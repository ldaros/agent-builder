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
    OpenRouterModelSettings,
    OpenRouterModelParams,
    OpenRouterRequest,
    OpenRouterMessage,
    OpenRouterResponse,
} from "./types";

export class OpenRouterModel implements IModel {
    private apiKey: string;
    private baseUrl: string;
    private model: string;
    private params: OpenRouterModelParams;
    private logger?: ILogger;

    constructor(settings: OpenRouterModelSettings, logger?: ILogger) {
        if (!settings.apiKey) {
            throw new InvalidCredentialsError("OpenRouter API key is required");
        }

        this.apiKey = settings.apiKey;
        this.baseUrl = settings.baseUrl || "https://openrouter.ai/api/v1/chat/completions";
        this.model = settings.model || "anthropic/claude-3.5-haiku";
        this.logger = logger;

        this.params = {
            temperature: settings.params?.temperature ?? 0.7,
            max_tokens: settings.params?.max_tokens ?? 1000,
            top_p: settings.params?.top_p ?? 1,
            frequency_penalty: settings.params?.frequency_penalty ?? 0,
            presence_penalty: settings.params?.presence_penalty ?? 0,
        };
    }

    async generate(prompt: Message[], params?: ExecutionParams): Promise<ModelOutput> {
        const requestBody: OpenRouterRequest = {
            model: this.model,
            messages: prompt.map(this.mapMessageExternal),
            temperature: this.params.temperature,
            max_tokens: this.params.max_tokens,
            top_p: this.params.top_p,
            frequency_penalty: this.params.frequency_penalty,
            presence_penalty: this.params.presence_penalty,
        };

        let response: AxiosResponse<OpenRouterResponse>;
        try {
            response = await axios.post<OpenRouterResponse>(this.baseUrl, requestBody, {
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${this.apiKey}`,
                },
            });
        } catch (error) {
            this.handleRequestError(error);
        }

        if (response.data.error?.code === 429) {
            throw new RateLimitError("Rate limit exceeded");
        }

        if (response.status !== 200) {
            throw new InternalError("OpenRouter API returned an error");
        }

        const data = response.data;
        if (!data.choices || data.choices.length === 0) {
            throw new MalformedResponseError("OpenRouter API response is empty");
        }

        const choice = data.choices[0];
        if (!choice.message || !choice.message.content) {
            throw new MalformedResponseError("OpenRouter API response message is empty");
        }

        const responseMessage = {
            role: "assistant" as const,
            content: choice.message.content,
        };

        this.logger?.log([...prompt, responseMessage], params);

        return {
            generated: responseMessage,
            params: params,
            modelMetadata: {
                model: this.model,
                inputTokens: data.usage?.prompt_tokens,
                outputTokens: data.usage?.completion_tokens,
                totalTokens: data.usage?.total_tokens,
            },
        };
    }

    private mapMessageExternal(message: Message): OpenRouterMessage {
        // OpenRouter has its own tool format, since we implement our own we'll just ignore it
        if (message.role === "tool") {
            return {
                role: "user",
                name: "tool response",
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
            throw new APIConnectionError("Failed to connect to OpenRouter API");
        }

        const { status, data } = error.response;

        if (status === 401) {
            throw new InvalidCredentialsError("Invalid OpenRouter API key");
        }

        if (status === 429) {
            throw new RateLimitError("Rate limit exceeded");
        }

        throw new InternalError("An unexpected error occurred", error);
    }
}
