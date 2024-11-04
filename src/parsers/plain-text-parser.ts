import { IParser } from "@/core/interfaces";
import { ParserError } from "@/core/errors";

export class PlainTextParser implements IParser<string> {
    name = "plain-text";

    async parse(text: string): Promise<string> {
        if (typeof text !== "string") {
            throw new ParserError("Response must be a plain text string");
        }

        return text;
    }
}