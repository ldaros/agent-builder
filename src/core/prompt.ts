import { Message } from "./interfaces";
 
export class Prompt {
    parts: Message[];

    constructor(parts: Message[]) {
        this.parts = parts;
    }

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
