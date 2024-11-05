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
    OpenAIUsage,
} from "./types";

export class OpenAIModel implements IModel {
    private apiKey: string;
    private baseUrl = "https://api.openai.com/v1/chat/completions";
    private model: string;
    private params: OpenAIModelParams;
    private logger?: ILogger;

    constructor(settings: OpenAIModelSettings, logger?: ILogger) {
        this.apiKey = this.validateApiKey(settings.apiKey);
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

    private validateApiKey(apiKey: string): string {
        if (!apiKey) {
            throw new InvalidCredentialsError("OpenAI API key is required");
        }
        return apiKey;
    }

    async generate(prompt: Message[], params?: ExecutionParams): Promise<ModelOutput> {
        const response = await this.makeRequest(prompt);
        const { message, usage } = await this.handleResponse(response);
        
        this.logger?.log([...prompt, message], params);

        return {
            generated: message,
            params: params,
            modelMetadata: {
                model: this.model,
                inputTokens: usage.prompt_tokens,
                outputTokens: usage.completion_tokens,
                totalTokens: usage.total_tokens,
            },
        };
    }

    private async makeRequest(prompt: Message[]): Promise<AxiosResponse<OpenAIResponse>> {
        const body: OpenAIRequestBody = {
            model: this.model,
            messages: prompt.map(this.toOpenAIMessage),
            ...this.params,
        };

        try {
            return await axios.post(this.baseUrl, body, {
                headers: this.getHeaders(),
            });
        } catch (error) {
            this.handleRequestError(error);
        }
    }

    private getHeaders() {
        return {
            "Content-Type": "application/json",
            Authorization: `Bearer ${this.apiKey}`,
        };
    }

    private handleRequestError(error: unknown): never {
        if (!axios.isAxiosError(error)) {
            throw new InternalError("An unexpected error occurred");
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

        throw new InternalError("An unexpected error occurred");
    }

    private handleResponse(response: AxiosResponse<OpenAIResponse>): {
        message: Message;
        usage: OpenAIUsage;
    } {
        if (response.status !== 200) {
            throw new InternalError("OpenAI API returned an error");
        }

        const data = response.data;
        if (!data.choices || data.choices.length === 0) {
            throw new MalformedResponseError("OpenAI API response is empty");
        }

        const message = data.choices[0].message;
        if (!message) {
            throw new MalformedResponseError("OpenAI API response message is empty");
        }

        const parsedMessage = this.toMessage(data.choices[0].message);

        return { message: parsedMessage, usage: data.usage };
    }

    private toMessage(message: OpenAIMessage): Message {
        if (message.role !== "user" && message.role !== "assistant") {
            throw new InternalError("Invalid message role");
        }

        return {
            role: message.role,
            content: message.content,
        };
    }

    private toOpenAIMessage(message: Message): OpenAIMessage {
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
}
