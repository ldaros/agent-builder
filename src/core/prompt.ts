import { Message } from "./interfaces";

/**
 * A class that represents a templated prompt for language model interactions.
 * Allows for dynamic substitution of variables in the prompt template.
 */
export class Prompt {
    parts: Message[];

    /**
     * Creates a new Prompt instance.
     * @param parts - Array of Message objects that constitute the prompt template
     */
    constructor(parts: Message[]) {
        this.parts = parts;
    }

    /**
     * Formats the prompt by replacing template variables with provided values.
     * Template variables should be in the format {{variableName}}.
     * 
     * @param args - Object containing key-value pairs for template variable substitution
     * @returns Array of Message objects with template variables replaced by their values
     * 
     * @example
     * const prompt = new Prompt([
     *   { role: "system", content: "Hello {{name}}" }
     * ]);
     * prompt.format({ name: "John" }); // Returns [{ role: "system", content: "Hello John" }]
     */
    format(args: Record<string, string> = {}): Message[] {
        return this.parts.map((part) => ({
            role: part.role,
            content: part.content.replace(/\{\{(.*?)\}\}/g, (_, key) => {
                const trimmedKey = key.trim(); // Remove any whitespace around the key
                return args[trimmedKey] !== undefined ? args[trimmedKey] : `{{${trimmedKey}}}`;
            }),
        }));
    }
}
