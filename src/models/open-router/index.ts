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
    OpenRouterModelSettings,
    OpenRouterModelParams,
    OpenRouterRequest,
    OpenRouterMessage,
    OpenRouterResponse,
    OpenRouterChoice,
} from "./types";

/**
 * Implementation of IModel for OpenRouter API
 */
export class OpenRouterModel implements IModel {
    readonly name = "OpenRouter";
    readonly version = "1";
    private static readonly DEFAULT_MODEL = "anthropic/claude-3.5-haiku";
    private static readonly DEFAULT_BASE_URL = "https://openrouter.ai/api/v1/chat/completions";
    private static readonly DEFAULT_PARAMS: OpenRouterModelParams = {
        temperature: 0.7,
        max_tokens: 1000,
        top_p: 1,
        frequency_penalty: 0,
        presence_penalty: 0,
    };

    private readonly client: AxiosInstance;
    private readonly model: string;
    private readonly params: OpenRouterModelParams;

    constructor(
        private readonly settings: OpenRouterModelSettings,
        private readonly logger?: ILogger
    ) {
        this.validateSettings(settings);
        this.model = settings.model || OpenRouterModel.DEFAULT_MODEL;
        this.params = this.initializeParams(settings.params);
        this.client = this.createAxiosClient();
    }

    async generate(prompt: Message[], params?: ExecutionParams): Promise<ModelOutput> {
        try {
            const requestBody = this.createRequestBody(prompt);
            const response = await this.makeApiRequest(requestBody);
            const generatedMessage = this.processApiResponse(response);
            
            this.logInteraction(prompt, generatedMessage, params);
            
            return this.createModelOutput(response.data, generatedMessage, params);
        } catch (error) {
            this.handleError(error);
        }
    }

    private validateSettings(settings: OpenRouterModelSettings): void {
        if (!settings.apiKey) {
            throw new InvalidCredentialsError("OpenRouter API key is required");
        }
    }

    private initializeParams(userParams?: Partial<OpenRouterModelParams>): OpenRouterModelParams {
        return {
            ...OpenRouterModel.DEFAULT_PARAMS,
            ...userParams,
        };
    }

    private createAxiosClient(): AxiosInstance {
        return axios.create({
            baseURL: this.settings.baseUrl || OpenRouterModel.DEFAULT_BASE_URL,
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${this.settings.apiKey}`,
            },
        });
    }

    private createRequestBody(prompt: Message[]): OpenRouterRequest {
        return {
            model: this.model,
            messages: prompt.map(this.mapMessageToOpenRouterFormat),
            ...this.params,
        };
    }

    private mapMessageToOpenRouterFormat(message: Message): OpenRouterMessage {
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

    private async makeApiRequest(
        requestBody: OpenRouterRequest
    ): Promise<AxiosResponse<OpenRouterResponse>> {
        const response = await this.client.post<OpenRouterResponse>("", requestBody);
        this.validateResponseStatus(response);
        return response;
    }

    private validateResponseStatus(response: AxiosResponse<OpenRouterResponse>): void {
        if (response.data.error?.code === 429) {
            throw new RateLimitError("Rate limit exceeded");
        }

        if (response.status !== 200) {
            throw new InternalError("OpenRouter API returned an error");
        }
    }

    private processApiResponse(response: AxiosResponse<OpenRouterResponse>): Message {
        this.validateApiResponse(response.data);
        
        const choice = response.data.choices[0];
        return {
            role: "assistant",
            content: choice.message.content || "",
        };
    }

    private validateApiResponse(data: OpenRouterResponse): void {
        if (!data.choices?.length) {
            throw new MalformedResponseError("OpenRouter API response is empty");
        }

        if (!this.isValidChoice(data.choices[0])) {
            throw new MalformedResponseError("OpenRouter API response message is empty");
        }
    }

    private isValidChoice(choice: OpenRouterChoice): boolean {
        return Boolean(choice.message?.content);
    }

    private createModelOutput(
        responseData: OpenRouterResponse,
        generatedMessage: Message,
        params?: ExecutionParams
    ): ModelOutput {
        return {
            generated: generatedMessage,
            params,
            modelMetadata: {
                model: this.model,
                inputTokens: responseData.usage?.prompt_tokens,
                outputTokens: responseData.usage?.completion_tokens,
                totalTokens: responseData.usage?.total_tokens,
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
            throw new APIConnectionError("Failed to connect to OpenRouter API");
        }

        const { status } = error.response;
        
        switch (status) {
            case 401:
                throw new InvalidCredentialsError("Invalid OpenRouter API key");
            case 429:
                throw new RateLimitError("Rate limit exceeded");
            default:
                throw new InternalError("OpenRouter API request failed", error);
        }
    }
}
