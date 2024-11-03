export type Message = {
    role: "user" | "assistant" | "system" | "tool";
    content: string;
};

export interface Model {
    generate(prompt: Message[]): Promise<Message>;
}

export interface Logger {
    log(messages: Message[]): void;
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