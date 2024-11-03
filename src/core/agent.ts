import { Message, Model, Parser } from "@/interfaces";
import { PlainTextParser } from "@/parsers/plain-text-parser";

export class Agent<T = string> {
    private model: Model;
    private parser: Parser<T>;

    constructor(model: Model, parser: Parser<any> = new PlainTextParser()) {
        this.model = model;
        this.parser = parser;
    }

    async execute(prompt: Message[]): Promise<T> {
        this.addSystemInstructions(prompt);

        const response = await this.model.generate(prompt);

        return await this.parser.parse(response.content);
    }

    private addSystemInstructions(prompt: Message[]): void {
        const instructions = this.parser.getInstructions?.();
        if (!instructions) {
            return;
        }

        const systemMessage = prompt.find((message) => message.role === "system");
        if (!systemMessage) {
            prompt.unshift({
                role: "system",
                content: instructions,
            });
            return;
        }

        systemMessage.content += `\n${instructions}`;
    }
}
