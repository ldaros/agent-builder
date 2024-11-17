import dotenv from "dotenv";
import { expect } from "chai";
import { OpenAIModel } from "../src/models/open-ai";
import { JSONSchemaParser } from "../src/parsers/json-schema-parser";
import { Agent } from "../src/core/agent";
import { InitI18n } from "../src/i18n";
import { GoogleAIModel } from "../src/models/google-ai";
import { getTestingModel } from "./testing-utils";

describe("JSON Schema Parser", () => {
    dotenv.config();
    InitI18n();

    it("should generate a parsed response", async () => {
        const model = getTestingModel(200);

        const prompt = [
            {
                role: "system" as const,
                content:
                    "You are a helpful assistant. Your job is to generate random names and ages.",
            },
            {
                role: "user" as const,
                content: "Generate a random name and age",
            },
        ];

        type AgeType = {
            name: string;
            age: number;
        };

        const parser = new JSONSchemaParser<AgeType>({
            $schema: "http://json-schema.org/draft-07/schema#",
            type: "object",
            properties: {
                name: {
                    type: "string",
                },
                age: {
                    type: "number",
                },
            },
            required: ["name", "age"],
        });

        const response = await new Agent<AgeType>(model, parser).execute(prompt);

        expect(response.data).to.be.an("object");
        expect(response.data).to.have.property("name");
        expect(response.data).to.have.property("age");
    });
});
