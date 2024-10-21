export type Message = {
    role: "user" | "assistant" | "system" | "tool";
    content: string;
};

export type Prompt = {
    messages: Message[];
};

export interface Model {
    generate(prompt: Prompt): Promise<Message>;
};

export interface Parser<T> {
    parse(text: string): Promise<T>;
    getInstructions?(): string;
};