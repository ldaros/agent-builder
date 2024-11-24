import axios, { AxiosInstance, AxiosResponse, AxiosError } from "axios";
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

/**
 * Implementation of IModel for OpenAI's API
 */
export class OpenAIModel implements IModel {
    readonly name = "OpenAI";
    readonly version = "1";
    private static readonly DEFAULT_MODEL = "gpt-4o-mini";
    private static readonly BASE_URL = "https://api.openai.com/v1/chat/completions";
    private static readonly DEFAULT_PARAMS: OpenAIModelParams = {
        temperature: 0.7,
        max_tokens: 1000,
        top_p: 1,
        frequency_penalty: 0,
        presence_penalty: 0,
    };

    private readonly client: AxiosInstance;
    private readonly model: string;
    private readonly params: OpenAIModelParams;

    constructor(
        private readonly settings: OpenAIModelSettings,
        private readonly logger?: ILogger
    ) {
        this.validateSettings(settings);
        this.model = settings.model || OpenAIModel.DEFAULT_MODEL;
        this.params = this.initializeParams(settings.params);
        this.client = this.createAxiosClient(settings.apiKey);
    }

    /**
     * Generates a response using the OpenAI API
     */
    async generate(prompt: Message[], params?: ExecutionParams): Promise<ModelOutput> {
        try {
            const response = await this.makeApiRequest(prompt);
            const generatedMessage = this.processApiResponse(response);
            
            this.logInteraction(prompt, generatedMessage, params);
            
            return this.createModelOutput(generatedMessage, params, response.data.usage);
        } catch (error) {
            this.handleError(error);
        }
    }

    private validateSettings(settings: OpenAIModelSettings): void {
        if (!settings.apiKey) {
            throw new InvalidCredentialsError("OpenAI API key is required");
        }
    }

    private initializeParams(userParams?: Partial<OpenAIModelParams>): OpenAIModelParams {
        return {
            ...OpenAIModel.DEFAULT_PARAMS,
            ...userParams,
        };
    }

    private createAxiosClient(apiKey: string): AxiosInstance {
        return axios.create({
            baseURL: OpenAIModel.BASE_URL,
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${apiKey}`,
            },
        });
    }

    private async makeApiRequest(prompt: Message[]): Promise<AxiosResponse<OpenAIResponse>> {
        const requestBody = this.createRequestBody(prompt);
        return await this.client.post<OpenAIResponse>("", requestBody);
    }

    private createRequestBody(prompt: Message[]): OpenAIRequestBody {
        return {
            model: this.model,
            messages: prompt.map(this.mapMessageToOpenAIFormat),
            ...this.params,
        };
    }

    private mapMessageToOpenAIFormat(message: Message): OpenAIMessage {
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

    private processApiResponse(response: AxiosResponse<OpenAIResponse>): Message {
        this.validateApiResponse(response);

        const openAIMessage = response.data.choices[0].message!;
        return {
            role: openAIMessage.role as "user" | "assistant",
            content: openAIMessage.content,
        };
    }

    private validateApiResponse(response: AxiosResponse<OpenAIResponse>): void {
        if (response.status !== 200) {
            throw new InternalError(
                "OpenAI API returned an error",
                new Error(JSON.stringify(response.data))
            );
        }

        if (!response.data.choices?.[0]?.message) {
            throw new MalformedResponseError("Invalid or empty OpenAI API response");
        }
    }

    private createModelOutput(
        generatedMessage: Message,
        params?: ExecutionParams,
        usage?: OpenAIUsage
    ): ModelOutput {
        return {
            generated: generatedMessage,
            params,
            modelMetadata: usage && {
                model: this.model,
                inputTokens: usage.prompt_tokens,
                outputTokens: usage.completion_tokens,
                totalTokens: usage.total_tokens,
            },
        };
    }

    private logInteraction(
        prompt: Message[],
        generatedMessage: Message,
        params?: ExecutionParams
    ): void {
        this.logger?.log([...prompt, generatedMessage], params);
    }

    private handleError(error: unknown): never {
        if (axios.isAxiosError(error)) {
            this.handleAxiosError(error);
        }
        throw new InternalError("An unexpected error occurred", error);
    }

    private handleAxiosError(error: AxiosError): never {
        if (!error.response) {
            throw new APIConnectionError("Failed to connect to OpenAI API");
        }

        switch (error.response.status) {
            case 401:
                throw new InvalidCredentialsError("Invalid OpenAI API key");
            case 429:
                throw new RateLimitError("Rate limit exceeded");
            default:
                throw new InternalError("OpenAI API request failed", error);
        }
    }
}
