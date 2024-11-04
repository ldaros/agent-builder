export type Message = {
    role: "user" | "assistant" | "system" | "tool";
    content: string;
};

export type ExecutionParams = {
    contextID?: string;
    custom?: any;
};

export type ModelMetadata = {
    model?: string;
    inputTokens?: number;
    outputTokens?: number;
    totalTokens?: number;
};

export type AgentMetadata = {
    parser?: string;
    tool?: string;
};

export type ModelOutput = {
    generated: Message;
    params?: ExecutionParams;
    modelMetadata?: ModelMetadata;
};

export type ToolExecutorOutput = {
    toolName?: string;
    toolOutput?: string;
};

export type AgentOutput<T> = {
    data: T;
    agentMetadata?: AgentMetadata;
} & ModelOutput;

export type ToolExecutionResult = {
    output: string;
    error?: string;
};

export interface IModel {
    generate(prompt: Message[], params?: ExecutionParams): Promise<ModelOutput>;
}

export interface ILogger {
    log(messages: Message[], params?: ExecutionParams): void;
}

export interface IParser<T> {
    name: string;

    parse(text: string): Promise<T>;
    getInstructions?(): string;
}

export interface ITool {
    name: string;
    description: string;
    schema: any;

    execute(args: any): Promise<ToolExecutionResult>;
}
