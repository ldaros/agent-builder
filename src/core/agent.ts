import { Model, Parser, Prompt } from "@/interfaces";
import { PlainTextParser } from "@/parsers/plain-text-parser";

export class Agent<T = string> {
    private userPrompt: Prompt;
    private model: Model;
    private parser: Parser<T>;

    constructor(prompt: Prompt, model: Model, parser: Parser<any> = new PlainTextParser()) {
        this.userPrompt = prompt;
        this.model = model;
        this.parser = parser;
    }

    async execute(): Promise<T> {
        const prompt = { ...this.userPrompt };

        this.addSystemInstructions(prompt);

        const response = await this.model.generate(prompt);

        return await this.parser.parse(response.content);
    }

    private addSystemInstructions(prompt: Prompt): void {
        const instructions = this.parser.getInstructions?.();
        if (!instructions) {
            return;
        }

        const systemMessage = prompt.messages.find((message) => message.role === "system");
        if (!systemMessage) {
            prompt.messages.unshift({
                role: "system",
                content: instructions,
            });
            return;
        }

        systemMessage.content += `\n${instructions}`;
    }
}
