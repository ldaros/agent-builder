import dotenv from "dotenv";
import { expect } from "chai";
import { OpenAIModel } from "../src/models/open-ai";
import { InitI18n } from "../src/i18n";
import { JSONConversionAgent } from "../src/agents/json-agent";
import { getTestingModel } from "./testing-utils";

describe("JSON Conversion Agent", () => {
    dotenv.config();
    InitI18n();

    it("should parse unstructured text to JSON", async () => {
        const model = getTestingModel(500);

        type AgeType = {
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

        const response = await new JSONConversionAgent<AgeType[]>(model, {
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

        expect(response.data).to.not.be.undefined;
        expect(response.data).to.be.an("array");
        expect(response.data).to.have.length(5);
        expect(response.data[0]).to.be.an("object");
        expect(response.data[0]).to.have.property("name");
        expect(response.data[0]).to.have.property("age");
    });
});
