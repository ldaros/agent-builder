import { OpenAIModel, GoogleAIModel, OpenRouterModel } from "../src/models";
import { ConsoleLogger } from "../src/loggers";

export function getTestingModel(maxTokens: number) {
    const modelName = process.env.TESTING_MODEL;
    const useLogging = process.env.USE_LOGGING === "true";

    const logger = useLogging ? new ConsoleLogger() : undefined;

    switch (modelName) {
        case "openai":
            return new OpenAIModel(
                {
                    apiKey: process.env.OPENAI_API_KEY as string,
                    params: {
                        max_tokens: maxTokens,
                    },
                },
                logger
            );
        case "googleai":
            return new GoogleAIModel(
                {
                    apiKey: process.env.GOOGLEAI_API_KEY as string,
                    params: {
                        maxOutputTokens: maxTokens,
                    },
                },
                logger
            );
        case "openrouter":
            return new OpenRouterModel(
                {
                    apiKey: process.env.OPENROUTER_API_KEY as string,
                    model: "anthropic/claude-3.5-haiku",
                    params: {
                        max_tokens: maxTokens,
                    },
                },
                logger
            );
        default:
            return new OpenAIModel(
                {
                    apiKey: process.env.OPENAI_API_KEY as string,
                    params: {
                        max_tokens: maxTokens,
                    },
                },
                logger
            );
    }
}
