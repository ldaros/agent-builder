// Core message types and roles for agent communication

export type MessageRole = "user" | "assistant" | "system" | "tool";

export interface Message {
    role: MessageRole;
    content: string;
}

// Execution and configuration parameters

export interface ExecutionParams {
    contextID?: string;
    custom?: Record<string, unknown>;
}

// Metadata interfaces for tracking and monitoring

export interface ModelMetadata {
    model?: string;
    inputTokens?: number;
    outputTokens?: number;
    totalTokens?: number;
}

export interface AgentMetadata {
    parser?: string;
    tool?: string;
    startTime?: number;
    endTime?: number;
}

// Output interfaces for different components

export interface ModelOutput {
    generated: Message;
    params?: ExecutionParams;
    modelMetadata?: ModelMetadata;
}

export interface ToolExecutorOutput {
    toolName?: string;
    toolOutput?: string;
}

export interface AgentOutput<T = unknown> extends ModelOutput {
    data: T;
    agentMetadata?: AgentMetadata;
}

export interface ToolExecutionResult {
    output: string;
    error?: string;
}

// Core component interfaces

export interface IModel {
    readonly name: string;
    readonly version?: string;

    generate(prompt: Message[], params?: ExecutionParams): Promise<ModelOutput>;
}

export interface ILogger {
    log(messages: Message[], params?: ExecutionParams): void;
}

export interface IParser<T = unknown> {
    readonly name: string;
    readonly version?: string;

    parse(text: string): Promise<T>;
    getInstructions?(): string;
}

export interface ITool {
    readonly name: string;
    readonly description: string;
    readonly schema: any;

    execute(args: any): Promise<ToolExecutionResult>;
}
