import axios, { AxiosResponse } from "axios";
import { Model, Message, Prompt } from "@/interfaces";
import {
    InternalError,
    APIConnectionError,
    InvalidCredentialsError,
    MalformedResponseError,
    RateLimitError,
} from "@/errors";
import {
    OpenAIModelSettings,
    OpenAIModelParams,
    OpenAIRequestBody,
    OpenAIMessage,
    OpenAIResponse,
} from "./types";

export class OpenAIModel implements Model {
    private apiKey: string;
    private baseUrl = "https://api.openai.com/v1/chat/completions";
    private model: string;

    constructor(settings: OpenAIModelSettings) {
        this.apiKey = this.validateApiKey(settings.apiKey);
        this.model = settings.model || "gpt-4o-mini";
    }

    private validateApiKey(apiKey: string): string {
        if (!apiKey) {
            throw new InvalidCredentialsError("OpenAI API key is required");
        }
        return apiKey;
    }

    async generate(prompt: Prompt): Promise<Message> {
        const response = await this.makeRequest(prompt);
        return this.handleResponse(response);
    }

    private async makeRequest(prompt: Prompt): Promise<AxiosResponse<OpenAIResponse>> {
        const params: OpenAIModelParams = {
            temperature: 0.7,
            max_tokens: 1000,
            top_p: 1,
            frequency_penalty: 0,
            presence_penalty: 0,
        };

        const body: OpenAIRequestBody = {
            model: this.model,
            messages: prompt.messages.map(this.toOpenAIMessage),
            ...params,
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

    private handleResponse(response: AxiosResponse<OpenAIResponse>): Message {
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

        return this.toMessage(message);
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
        return {
            role: message.role,
            content: message.content,
        };
    }
}
