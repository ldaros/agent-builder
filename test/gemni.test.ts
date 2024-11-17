import dotenv from "dotenv";
import { expect } from "chai";
import { InitI18n } from "../src/i18n";
import { GoogleAIModel } from "../src/models/google-ai";

describe("Gemini Model", () => {
    dotenv.config();
    InitI18n();

    it("should generate text", async () => {
        const model = new GoogleAIModel({
            apiKey: process.env.GOOGLEAI_API_KEY as string,
            params: {
                maxOutputTokens: 100,
            },
        });

        const text = "Hello, how are you?";

        const response = await model.generate([{ role: "user", content: text }]);

        expect(response.generated).to.not.be.undefined;
        expect(response.generated.content).to.be.a("string");
        expect(response.generated.role).to.be.equal("assistant");
    });
});
