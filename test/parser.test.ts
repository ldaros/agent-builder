import dotenv from "dotenv";
import { expect } from "chai";
import { OpenAIModel } from "@/models/open-ai";
import { JSONSchemaParser } from "@/parsers/json-schema-parser";
import { Agent } from "@/core/agent";
import { InitI18n } from "@/i18n";

describe("JSON Schema Parser", () => {
    dotenv.config();
    InitI18n();

    it("should generate a parsed response", async () => {
        const model = new OpenAIModel({
            apiKey: process.env.OPENAI_API_KEY as string,
            params: {
                max_tokens: 200,
            },
        });

        const prompt = [
            {
                role: "system" as const,
                content:
                    "You are a helpful assistant. Your job is to generate random names and ages.",
            },
        ];

        type Response = {
            name: string;
            age: number;
        };

        const parser = new JSONSchemaParser<Response>({
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

        const response = await new Agent<Response>(model, parser).execute(prompt);

        expect(response).to.be.an("object");
        expect(response).to.have.property("name");
        expect(response).to.have.property("age");
    });
});
