export type Message = {
    role: "user" | "assistant" | "system" | "tool";
    content: string;
};

export interface Model {
    generate(prompt: Message[]): Promise<Message>;
}

export interface Parser<T> {
    parse(text: string): Promise<T>;
    getInstructions?(): string;
}
