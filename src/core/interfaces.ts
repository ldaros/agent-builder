export type Message = {
    role: "user" | "assistant" | "system" | "tool";
    content: string;
};

export type ExecutionParams = {
    contextID?: string;
    custom?: any;
}

export interface Model {
    generate(prompt: Message[], params?: ExecutionParams): Promise<Message>;
}

export interface Logger {
    log(messages: Message[], params?: ExecutionParams): void;
}

export interface Parser<T> {
    parse(text: string): Promise<T>;
    getInstructions?(): string;
}

export interface Tool {
    name: string;
    description: string;
    schema: any;

    execute(args: any): Promise<ToolExecutionResult>;
};

export type ToolExecutionResult = {
    output: string;
    error?: string;
};
