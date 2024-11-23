import i18n from "../i18n";
import Ajv, { ValidateFunction } from "ajv";
import { ITool, ToolExecutorOutput } from "../core/interfaces";
import { SchemaCompilationError } from "../core/errors";
import { formatAJVErrors } from "../utils/ajv";
import { cleanJSON } from "../utils/clean-json";

export class ToolExecutor {
    private tools: Map<string, ITool>;
    private ajv: Ajv;

    constructor(tools: ITool[]) {
        this.tools = new Map(tools.map((tool) => [tool.name, tool]));
        this.ajv = new Ajv();
    }

    async execute(messageContent: string): Promise<ToolExecutorOutput | null> {
        const toolName = this.extractToolName(messageContent);
        if (!toolName) return null; // No tool found
        
        const tool = this.tools.get(toolName);
        if (!tool) return { toolOutput: `Error: Tool '${toolName}' not found` };

        const args = this.extractArgs(messageContent);
        const parsedArgs = this.parseArguments(args);
        if (typeof parsedArgs === "string") return { toolName, toolOutput: parsedArgs };

        const isValid = this.validateArgs(tool, parsedArgs);
        if (typeof isValid === "string") return { toolName, toolOutput: isValid };

        const result = await this.executeTool(tool, parsedArgs);
        return { toolName, toolOutput: result };
    }

    private extractToolName(text: string): string | null {
        const match = text.match(/\/tool (\w+)/);
        return match ? match[1] : null;
    }

    private extractArgs(text: string): string {
        const match = text.match(/\/args (.+)/);
        const args = match?.[1] ?? "";
        return cleanJSON(args);
    }

    private parseArguments(args: string): any | string {
        try {
            return JSON.parse(args);
        } catch (error) {
            return `Error: Failed to parse arguments: ${error}`;
        }
    }

    private validateArgs(tool: ITool, args: any): string | null {
        const validator = this.getValidator(tool.schema);
        if (!validator(args)) {
            const errors = formatAJVErrors(validator.errors);
            return `Error: ${errors}`;
        }
        return null;
    }

    private getValidator(schema: object): ValidateFunction {
        try {
            return this.ajv.compile(schema);
        } catch {
            throw new SchemaCompilationError("Failed to compile tool schema");
        }
    }

    private async executeTool(tool: ITool, args: any): Promise<string> {
        try {
            const result = await tool.execute(args);
            return result.error ? `Error: ${result.error}` : result.output;
        } catch {
            return `Error: An internal error occurred while executing the tool`;
        }
    }

    getInstructions(): string {
        if (this.tools.size === 0) return "";

        const instructions = [
            i18n.t("tool.intro"),
            i18n.t("tool.usage"),
            i18n.t("tool.exampleUsage"),
            i18n.t("tool.definitionHeader"),
        ];

        this.tools.forEach((tool) => {
            instructions.push(
                i18n.t("tool.definition", {
                    name: tool.name,
                    description: tool.description,
                    schema: JSON.stringify(tool.schema, null, 2),
                })
            );
        });

        return instructions.join("\n");
    }
}
