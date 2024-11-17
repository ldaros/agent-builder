import { OpenAIModel } from "../src/models/open-ai";
import { GoogleAIModel } from "../src/models/google-ai";

export function getTestingModel(maxTokens: number) {
    const modelName = process.env.TESTING_MODEL;

    switch (modelName) {
        case "openai":
            return new OpenAIModel({
                apiKey: process.env.OPENAI_API_KEY as string,
                params: {
                    max_tokens: maxTokens,
                },
            });
        case "googleai":
            return new GoogleAIModel({
                apiKey: process.env.GOOGLEAI_API_KEY as string,
                params: {
                    maxOutputTokens: maxTokens,
                },
            });
        default:
            return new OpenAIModel({
                apiKey: process.env.OPENAI_API_KEY as string,
                params: {
                    max_tokens: maxTokens,
                },
            });
    }
}
