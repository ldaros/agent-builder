import { Parser } from "@/interfaces";
import { ParserError } from "@/errors";

export class PlainTextParser implements Parser<string> {
    async parse(text: string): Promise<string> {
        if (typeof text !== "string") {
            throw new ParserError("Response must be a plain text string");
        }

        return text;
    }
}
