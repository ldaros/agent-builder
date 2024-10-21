import Ajv, { ValidateFunction, ErrorObject } from "ajv";
import i18n from "@/i18n";
import { Parser } from "@/interfaces";
import { ParserError, ValidationError, SchemaCompilationError } from "@/errors";
import { cleanJSON } from "@/utils/clean-json";

export class JSONSchemaParser<T> implements Parser<T> {
    private schema: any;
    private validator: ValidateFunction;

    constructor(schema: any) {
        const ajv = new Ajv();

        try {
            this.schema = schema;
            this.validator = ajv.compile(schema);
        } catch (error) {
            throw new SchemaCompilationError("Failed to compile JSON schema");
        }
    }

    getInstructions(): string {
        return i18n.t("instructions.jsonSchema", { schema: JSON.stringify(this.schema) });
    }

    async parse(text: string): Promise<T> {
        console.assert(text, "Text is an empty string");
        let parsedData: any;

        text = cleanJSON(text);
        console.assert(text, "Text is empty after cleanup");

        try {
            parsedData = JSON.parse(text);
        } catch (error) {
            throw new ParserError(`Failed to parse JSON Response: ${text}`);
        }

        const isValid = this.validator(parsedData);
        if (!isValid) {
            const formattedErrors = this.formatAJVErrors(this.validator.errors);
            throw new ValidationError(formattedErrors);
        }

        console.assert(parsedData, "Parsed data is undefined");
        return parsedData as T;
    }

    private formatAJVErrors(errors: ErrorObject[] | null | undefined): string {
        if (!errors) {
            return "Unknown error";
        }

        return errors
            .map((err) => {
                const dataPath = err.instancePath || err.instancePath || "";
                const message = err.message || "Validation error";
                return `Error at ${dataPath}: ${message}`;
            })
            .join("\n");
    }
}
