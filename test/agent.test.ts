import dotenv from "dotenv";
import { expect } from "chai";
import { OpenAIModel } from "@/models/open-ai";
import { InitI18n } from "@/i18n";
import { JSONConversionAgent } from "@/agents/json-agent";

describe("JSON Conversion Agent", () => {
    dotenv.config();
    InitI18n();

    it("should parse unstructured text to JSON", async () => {
        const model = new OpenAIModel({
            apiKey: process.env.OPENAI_API_KEY as string,
            params: {
                max_tokens: 500,
            },
        });

        type Response = {
            name: string;
            age: number;
        };

        const text = `Sure! Here are some random names and ages: \
        1. Sarah Thompson, 28 \
        2. Michael Reed, 34 \
        3. Jessica Nguyen, 22 \
        4. David Kim, 45 \
        5. Emily Carter, 30 \
        Let me know if you need more!`;

        const jsonResponse = await new JSONConversionAgent<Response[]>(model, {
            $schema: "http://json-schema.org/draft-07/schema#",
            type: "array",
            items: {
                type: "object",
                properties: {
                    name: {
                        type: "string",
                    },
                    age: {
                        type: "integer",
                        minimum: 0,
                    },
                },
                required: ["name", "age"],
            },
        }).execute(text);

        expect(jsonResponse).to.not.be.undefined;
        expect(jsonResponse).to.be.an("array");
        expect(jsonResponse).to.have.length(5);
        expect(jsonResponse[0]).to.have.property("name");
        expect(jsonResponse[0]).to.have.property("age");
    });
});
