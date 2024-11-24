import {
    Message,
    IModel,
    IParser,
    ExecutionParams,
    AgentOutput,
    ToolExecutorOutput,
    ModelOutput,
} from "../core/interfaces";
import { PlainTextParser } from "../parsers/plain-text-parser";
import { InternalError } from "./errors";
import { Prompt } from "./prompt";
import { ToolExecutor } from "./tool-executor";
import { RetryConfig, RetryUtil } from "../utils/retry";
import { PromptValidator } from "./validators";

interface ExecutionContext {
    prompt: Message[];
    params?: ExecutionParams;
}

interface GenerationResult {
    modelOutput: ModelOutput;
    toolOutput: ToolExecutorOutput | null;
}

/**
 * Configuration for the agent.
 */
export interface AgentConfig {
    retryConfig?: RetryConfig;
}

/**
 * Agent class that orchestrates the interaction between a language model, parser, and optional tool executor.
 * @template T The type of data that will be parsed from the model's output
 */
export class Agent<T> {
    private static readonly DEFAULT_CONFIG: AgentConfig = {
        // Defaults to a single attempt
        retryConfig: {
            maxAttempts: 1,
            delayMs: 0,
            backoffFactor: 1,
        },
    };

    /**
     * Creates a new Agent instance.
     */
    constructor(
        private readonly model: IModel,
        private readonly parser: IParser<T | any> = new PlainTextParser(),
        private readonly toolExecutor?: ToolExecutor,
        private readonly config: AgentConfig = Agent.DEFAULT_CONFIG
    ) {}

    /**
     * Executes the agent with given prompt and parameters.
     * @param prompt - Either a Prompt instance or array of Messages to send to the model
     * @param params - Optional execution parameters for the model
     */
    async execute(prompt: Prompt | Message[], params?: ExecutionParams): Promise<AgentOutput<T>> {
        const startTime = Date.now();
        const executor = () => this.executeInternal(prompt, params);

        const result = this.config.retryConfig
            ? await RetryUtil.withRetry(executor, this.config.retryConfig)
            : await executor();

        const endTime = Date.now();

        return {
            ...result,
            agentMetadata: {
                ...result.agentMetadata,
                startTime,
                endTime,
            },
        };
    }

    private async executeInternal(
        prompt: Prompt | Message[],
        params?: ExecutionParams
    ): Promise<AgentOutput<T>> {
        try {
            const context = this.prepareExecutionContext(prompt, params);
            const { modelOutput, toolOutput } = await this.executeWithTools(context);
            const parsedData = await this.parser.parse(modelOutput.generated.content);

            return this.createAgentOutput(modelOutput, parsedData, toolOutput);
        } catch (error) {
            throw new InternalError("Agent execution failed", error);
        }
    }

    private prepareExecutionContext(
        prompt: Prompt | Message[],
        params?: ExecutionParams
    ): ExecutionContext {
        const formattedPrompt = prompt instanceof Prompt ? prompt.format() : prompt;
        PromptValidator.validate(formattedPrompt);

        const enrichedPrompt = this.enrichPromptWithInstructions(formattedPrompt);
        return { prompt: enrichedPrompt, params };
    }

    private enrichPromptWithInstructions(prompt: Message[]): Message[] {
        const instructions = this.compileInstructions();
        if (!instructions) return prompt;

        const systemMessage = prompt.find((msg) => msg.role === "system");
        if (systemMessage) {
            systemMessage.content += `\n${instructions}`;
            return prompt;
        }

        return [{ role: "system", content: instructions }, ...prompt];
    }

    private compileInstructions(): string {
        const instructions = [
            this.parser.getInstructions?.(),
            this.toolExecutor?.getInstructions?.(),
        ].filter(Boolean);

        return instructions.length > 0 ? instructions.join("\n").trim() : "";
    }

    private async executeWithTools(context: ExecutionContext): Promise<GenerationResult> {
        const modelOutput = await this.model.generate(context.prompt, context.params);
        const toolOutput = await this.handleToolExecution(
            modelOutput.generated.content,
            context.prompt
        );

        if (toolOutput) {
            return {
                modelOutput: await this.model.generate(context.prompt, context.params),
                toolOutput,
            };
        }

        return { modelOutput, toolOutput: null };
    }

    private async handleToolExecution(
        content: string,
        prompt: Message[]
    ): Promise<ToolExecutorOutput | null> {
        const toolCall = await this.toolExecutor?.execute(content);
        if (toolCall?.toolOutput) {
            prompt.push(
                { role: "assistant", content },
                { role: "tool", content: toolCall.toolOutput }
            );
        }
        return toolCall ?? null;
    }

    private createAgentOutput(
        modelOutput: ModelOutput,
        parsedData: T,
        toolOutput: ToolExecutorOutput | null
    ): AgentOutput<T> {
        return {
            ...modelOutput,
            data: parsedData,
            agentMetadata: {
                parser: this.parser.name,
                tool: toolOutput?.toolName,
            },
        };
    }
}
