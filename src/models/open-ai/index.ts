import axios, { AxiosResponse } from "axios";
import { IModel, Message, ILogger, ExecutionParams, ModelOutput } from "../../core/interfaces";
import {
    InternalError,
    APIConnectionError,
    InvalidCredentialsError,
    MalformedResponseError,
    RateLimitError,
} from "../../core/errors";
import {
    OpenAIModelSettings,
    OpenAIModelParams,
    OpenAIRequestBody,
    OpenAIMessage,
    OpenAIResponse,
} from "./types";

export class OpenAIModel implements IModel {
    private apiKey: string;
    private baseUrl = "https://api.openai.com/v1/chat/completions";
    private model: string;
    private params: OpenAIModelParams;
    private logger?: ILogger;

    constructor(settings: OpenAIModelSettings, logger?: ILogger) {
        if (!settings.apiKey) {
            throw new InvalidCredentialsError("OpenAI API key is required");
        }

        this.apiKey = settings.apiKey;
        this.model = settings.model || "gpt-4o-mini";
        this.logger = logger;

        this.params = {
            temperature: settings.params?.temperature || 0.7,
            max_tokens: settings.params?.max_tokens || 1000,
            top_p: settings.params?.top_p || 1,
            frequency_penalty: settings.params?.frequency_penalty || 0,
            presence_penalty: settings.params?.presence_penalty || 0,
        };
    }

    async generate(prompt: Message[], params?: ExecutionParams): Promise<ModelOutput> {
        const requestBody: OpenAIRequestBody = {
            model: this.model,
            messages: prompt.map(this.mapMessageExternal),
            ...this.params,
        };

        let response: AxiosResponse<OpenAIResponse>;
        try {
            response = await axios.post(this.baseUrl, requestBody, {
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${this.apiKey}`,
                },
            });
        } catch (error) {
            this.handleRequestError(error);
        }

        if (response.status !== 200) {
            throw new InternalError(
                "OpenAI API returned an error",
                new Error(JSON.stringify(response.data))
            );
        }

        const data = response.data;
        if (!data.choices || data.choices.length === 0) {
            throw new MalformedResponseError("OpenAI API response is empty");
        }

        const openAIMessage = data.choices[0].message;
        if (!openAIMessage) {
            throw new MalformedResponseError("OpenAI API response message is empty");
        }

        const mappedMessage = {
            role: openAIMessage.role as "user" | "assistant",
            content: openAIMessage.content,
        };

        this.logger?.log([...prompt, mappedMessage], params);

        return {
            generated: mappedMessage,
            params: params,
            modelMetadata: {
                model: this.model,
                inputTokens: data.usage.prompt_tokens,
                outputTokens: data.usage.completion_tokens,
                totalTokens: data.usage.total_tokens,
            },
        };
    }

    private mapMessageExternal(message: Message): OpenAIMessage {
        if (message.role === "tool") {
            return {
                role: "system",
                name: "tool",
                content: message.content,
            };
        }

        return {
            role: message.role,
            content: message.content,
        };
    }

    private handleRequestError(error: unknown): never {
        if (!axios.isAxiosError(error)) {
            throw new InternalError("An unexpected error occurred", error);
        }

        if (!error.response) {
            throw new APIConnectionError("Failed to connect to OpenAI API");
        }

        const { status } = error.response;
        if (status === 401) {
            throw new InvalidCredentialsError("Invalid OpenAI API key");
        }

        if (status === 429) {
            throw new RateLimitError("Rate limit exceeded");
        }

        throw new InternalError("An unexpected error occurred", error);
    }
}
