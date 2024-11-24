import axios, { AxiosInstance, AxiosResponse, AxiosError } from "axios";
import { ExecutionParams, IModel, Message, ModelOutput, ILogger } from "../../core/interfaces";
import {
    InternalError,
    APIConnectionError,
    InvalidCredentialsError,
    MalformedResponseError,
    RateLimitError,
    ClientError,
} from "../../core/errors";
import {
    GenerateContentRequest,
    GenerateContentResponse,
    GoogleAIModelSettings,
    GemniGenerationConfig,
    Content,
    RoleMapping,
} from "./types";

/**
 * Implementation of IModel for Google's Gemini AI API
 */
export class GoogleAIModel implements IModel {
    readonly name = "Google AI";
    readonly version = "1";
    private static readonly DEFAULT_MODEL = "gemini-1.5-flash";
    private static readonly DEFAULT_BASE_URL = "https://generativelanguage.googleapis.com/v1beta/models";
    private static readonly DEFAULT_CONFIG: GemniGenerationConfig = {
        stopSequences: [],
        temperature: 0.7,
        maxOutputTokens: 1000,
        topP: 1,
        topK: 1,
    };

    private static readonly ROLE_MAPPING: RoleMapping = {
        user: "user",
        tool: "user",
        system: "system",
        assistant: "model",
    };

    private readonly client: AxiosInstance;
    private readonly apiUrl: string;

    constructor(
        private readonly settings: GoogleAIModelSettings,
        private readonly logger?: ILogger
    ) {
        this.validateSettings(settings);
        this.client = this.createAxiosClient();
        this.apiUrl = this.buildApiUrl();
    }

    async generate(prompt: Message[], params?: ExecutionParams): Promise<ModelOutput> {
        try {
            this.validatePrompt(prompt);
            const requestBody = this.createRequestBody(prompt);
            const response = await this.makeApiRequest(requestBody);
            const generatedMessage = this.processApiResponse(response);
            
            this.logInteraction(prompt, generatedMessage, params);
            
            return this.createModelOutput(response.data, generatedMessage, params);
        } catch (error) {
            this.handleError(error);
        }
    }

    private validateSettings(settings: GoogleAIModelSettings): void {
        if (!settings.apiKey) {
            throw new InvalidCredentialsError("Google AI API key is required");
        }
    }

    private createAxiosClient(): AxiosInstance {
        return axios.create({
            headers: { "Content-Type": "application/json" },
        });
    }

    private buildApiUrl(): string {
        const baseUrl = this.settings.baseUrl || GoogleAIModel.DEFAULT_BASE_URL;
        const model = this.settings.model || GoogleAIModel.DEFAULT_MODEL;
        return `${baseUrl}/${model}:generateContent?key=${this.settings.apiKey}`;
    }

    private validatePrompt(prompt: Message[]): void {
        const systemInstruction = prompt.find(msg => msg.role === "system");
        const hasContent = prompt.some(msg => msg.role !== "system");
        
        if (systemInstruction && !hasContent) {
            throw new ClientError("System instruction provided but no prompt provided");
        }
    }

    private createRequestBody(prompt: Message[]): GenerateContentRequest {
        const contents = prompt
            .map(this.mapMessageToContent)
            .filter(content => content?.role !== "system");

        const systemInstruction = prompt.find(msg => msg.role === "system");
        
        return {
            contents,
            generationConfig: {
                ...GoogleAIModel.DEFAULT_CONFIG,
                ...this.settings.params,
            },
            ...(systemInstruction && {
                system_instruction: {
                    parts: [{ text: systemInstruction.content }],
                },
            }),
        };
    }

    private mapMessageToContent(message: Message): Content {
        return {
            parts: [{ text: message.content }],
            role: GoogleAIModel.ROLE_MAPPING[message.role],
        };
    }

    private async makeApiRequest(
        requestBody: GenerateContentRequest
    ): Promise<AxiosResponse<GenerateContentResponse>> {
        return await this.client.post<GenerateContentResponse>(this.apiUrl, requestBody);
    }

    private processApiResponse(response: AxiosResponse<GenerateContentResponse>): Message {
        this.validateApiResponse(response);

        const generatedContent = response.data.candidates[0].content;
        const content = generatedContent.parts.map(part => part.text).join("");

        return {
            role: "assistant",
            content,
        };
    }

    private validateApiResponse(response: AxiosResponse<GenerateContentResponse>): void {
        if (response.status !== 200) {
            throw new InternalError("Google AI API returned an error");
        }

        if (!response.data.candidates?.[0]) {
            throw new MalformedResponseError("Google AI API response is empty");
        }
    }

    private createModelOutput(
        responseData: GenerateContentResponse,
        generatedMessage: Message,
        params?: ExecutionParams
    ): ModelOutput {
        return {
            generated: generatedMessage,
            params,
            modelMetadata: {
                model: responseData.modelVersion,
                inputTokens: responseData.usageMetadata.promptTokenCount,
                outputTokens: responseData.usageMetadata.candidatesTokenCount,
                totalTokens: responseData.usageMetadata.totalTokenCount,
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
            throw new APIConnectionError("Failed to connect to Google AI API");
        }

        const { status, data } = error.response as any;
        
        switch (status) {
            case 401:
                throw new InvalidCredentialsError("Invalid Google AI API key");
            case 429:
                throw new RateLimitError("Rate limit exceeded");
            default:
                const errorMessage = data?.error?.message;
                throw new InternalError(
                    `Google AI API returned an error: ${status} ${errorMessage}`,
                    error
                );
        }
    }
}
