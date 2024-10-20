export type Message = {
    role: "user" | "assistant" | "system" | "tool";
    content: string;
};

export type Prompt = {
    messages: Message[];
};

export type Model = {
    generate(prompt: Prompt): Promise<Message>;
};
