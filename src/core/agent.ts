import { Message, IModel, IParser, ExecutionParams, AgentOutput } from "../core/interfaces";
import { PlainTextParser } from "../parsers/plain-text-parser";
import { Prompt } from "./prompt";
import { ToolExecutor } from "./tool-executor";

export class Agent<T = any> {
    private model: IModel;
    private parser: IParser<T>;
    private toolExecutor?: ToolExecutor;

    constructor(
        model: IModel,
        parser: IParser<any> = new PlainTextParser(),
        executor?: ToolExecutor
    ) {
        this.model = model;
        this.parser = parser;

        if (executor) {
            this.toolExecutor = executor;
        }
    }

    async execute(prompt: Prompt | Message[], params?: ExecutionParams): Promise<AgentOutput<T>> {
        if (prompt instanceof Prompt) {
            prompt = prompt.format();
        }

        // Agent will add its own system instructions if needed
        this.addSystemInstructions(prompt);

        let modelOutput = await this.model.generate(prompt, params);

        // If a tool was executed, we'll give the output to the model
        const toolOutput = await this.handleToolExecution(modelOutput.generated.content, prompt);
        if (toolOutput) {
            modelOutput = await this.model.generate(prompt, params);
        }

        const parserOutput = await this.parser.parse(modelOutput.generated.content);

        return {
            ...modelOutput,
            data: parserOutput,
            agentMetadata: {
                parser: this.parser.name,
                tool: toolOutput?.toolName,
            },
        };
    }

    private addSystemInstructions(prompt: Message[]): void {
        const parserInstructions = this.parser.getInstructions?.() || "";
        const toolInstructions = this.toolExecutor?.getInstructions?.() || "";

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

    private async handleToolExecution(content: string, prompt: Message[]) {
        const toolCall = await this.toolExecutor?.execute(content);
        if (toolCall && toolCall.toolOutput) {
            prompt.push({ role: "assistant", content });
            prompt.push({ role: "tool", content: toolCall.toolOutput });
        }
        return toolCall ?? null;
    }
}
