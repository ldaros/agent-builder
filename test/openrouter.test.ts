import dotenv from "dotenv";
import { expect } from "chai";
import { InitI18n } from "../src/i18n";
import { OpenRouterModel } from "../src/models/open-router";

describe("OpenRouter Model", () => {
    dotenv.config();
    InitI18n();

    it("should generate text", async () => {
        const model = new OpenRouterModel({
            apiKey: process.env.OPENROUTER_API_KEY as string,
            model: "anthropic/claude-3.5-haiku",
        });

        const text = "Hello, how are you?";
        const response = await model.generate([{ role: "user", content: text }]);

        expect(response.generated).to.not.be.undefined;
        expect(response.generated.content).to.be.a("string");
        expect(response.generated.role).to.be.equal("assistant");
    });
});
