import { ValidationError } from "./errors";
import { Message } from "./interfaces";

export class MessageValidator {
    static validate(message: Message): void {
        if (!message.role || !message.content) {
            throw new ValidationError("Invalid message format");
        }
        if (!["user", "assistant", "system", "tool"].includes(message.role)) {
            throw new ValidationError("Invalid message role");
        }
    }
}

export class PromptValidator {
    static validate(prompt: Message[]): void {
        if (!Array.isArray(prompt) || prompt.length === 0) {
            throw new ValidationError("Prompt must be a non-empty array of messages");
        }

        prompt.forEach(MessageValidator.validate);
    }
}
