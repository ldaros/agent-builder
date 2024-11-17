import dotenv from "dotenv";
import { expect } from "chai";
import { OpenAIModel } from "../src/models/open-ai";

describe("OpenAI Model", () => {
    dotenv.config();

    it("should generate a response", async () => {
        const model = new OpenAIModel({
            apiKey: process.env.OPENAI_API_KEY as string,
            params: {
                max_tokens: 100,
            },
        });

        const response = await model.generate([
            {
                role: "user",
                content: "Hello world!",
            },
        ], { contextID: "test" });

        expect(response.generated.content).to.be.a("string");
    });
});
