import Ajv, { ValidateFunction } from "ajv";
import i18n from "../i18n";
import { IParser } from "../core/interfaces";
import { ParserError, ValidationError, SchemaCompilationError } from "../core/errors";
import { cleanJSON } from "../utils/clean-json";
import { formatAJVErrors } from "../utils/ajv";

export class JSONSchemaParser<T> implements IParser<T> {
    readonly name = "json-schema";
    readonly version = "1";
    private schema: any;
    private validator: ValidateFunction;

    constructor(schema: any) {
        const ajv = new Ajv();

        try {
            console.assert(schema, "Schema is undefined");
            this.schema = schema;
            this.validator = ajv.compile(schema);
        } catch (error) {
            throw new SchemaCompilationError("Failed to compile JSON schema");
        }
    }

    getInstructions(): string {
        return i18n.t("instructions.jsonSchema", { schema: this.getSchema() });
    }

    getSchema(): string {
        return JSON.stringify(this.schema);
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
            const formattedErrors = formatAJVErrors(this.validator.errors);
            throw new ValidationError(formattedErrors);
        }

        console.assert(parsedData, "Parsed data is undefined");
        return parsedData as T;
    }
}
