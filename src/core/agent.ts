import { Message, Model, Parser, Tool, ExecutionParams } from "@/core/interfaces";
import { PlainTextParser } from "@/parsers/plain-text-parser";
import { ToolExecutor } from "./tool-executor";

export class Agent<T = string> {
    private model: Model;
    private parser: Parser<T>;
    private toolExecutor?: ToolExecutor;

    constructor(model: Model, parser: Parser<any> = new PlainTextParser(), executor?: ToolExecutor) {
        this.model = model;
        this.parser = parser;
        
        if (executor) {
            this.toolExecutor = executor;
        }
    }

    async execute(prompt: Message[], params?: ExecutionParams): Promise<T> {
        this.addSystemInstructions(prompt);

        let response = await this.model.generate(prompt, params);

        const toolResponse = await this.handleToolExecution(response.content, prompt);

        if (toolResponse) {
            response = await this.model.generate(prompt, params);
        }

        return this.parser.parse(response.content);
    }

    private addSystemInstructions(prompt: Message[]): void {
        const parserInstructions = this.parser.getInstructions?.() || '';
        const toolInstructions = this.toolExecutor?.getInstructions?.() || '';
    
        if (!parserInstructions && !toolInstructions) {
            return;
        }
    
        const instructions = `\n${toolInstructions}${parserInstructions}`.trim();
        const systemMessage = prompt.find((message) => message.role === "system");
    
        if (systemMessage) {
            systemMessage.content += `\n${instructions}`;
        } else {
            prompt.unshift({
                role: "system",
                content: instructions,
            });
        }
    }

    private async handleToolExecution(content: string, prompt: Message[]): Promise<string | null> {
        const toolOutput = await this.toolExecutor?.execute(content);
        if (toolOutput) {
            prompt.push({ role: "assistant", content });
            prompt.push({ role: "tool", content: toolOutput });
        }
        return toolOutput ?? null;
    }
}
