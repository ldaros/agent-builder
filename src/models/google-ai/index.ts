import axios, { AxiosResponse } from "axios";
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
    UsageMetadata,
} from "./types";

export class GoogleAIModel implements IModel {
    private apiKey: string;
    private baseUrl: string;
    private model: string;
    private generationConfig: GemniGenerationConfig;
    private logger?: ILogger;

    constructor(settings: GoogleAIModelSettings, logger?: ILogger) {
        this.apiKey = this.validateApiKey(settings.apiKey);
        this.baseUrl =
            settings.baseUrl || "https://generativelanguage.googleapis.com/v1beta/models";
        this.model = settings.model || "gemini-1.5-flash";

        this.generationConfig = {
            stopSequences: settings.params?.stopSequences || [],
            temperature: settings.params?.temperature ?? 0.7,
            maxOutputTokens: settings.params?.maxOutputTokens ?? 1000,
            topP: settings.params?.topP ?? 1,
            topK: settings.params?.topK ?? 0,
        };

        this.logger = logger;
    }

    private validateApiKey(apiKey: string): string {
        if (!apiKey) {
            throw new InvalidCredentialsError("Google AI API key is required");
        }
        return apiKey;
    }

    async generate(prompt: Message[], params?: ExecutionParams): Promise<ModelOutput> {
        const response = await this.makeRequest(prompt);

        const { generatedContent, usage } = await this.handleResponse(response);

        const contents = generatedContent.parts.map((part) => part.text).join("");

        const responseMessage = {
            role: "assistant" as const,
            content: contents,
        };

        this.logger?.log([...prompt, responseMessage], params);

        return {
            generated: responseMessage,
            params: params,
            modelMetadata: {
                model: response.data.modelVersion,
                inputTokens: usage.promptTokenCount,
                outputTokens: usage.candidatesTokenCount,
                totalTokens: usage.totalTokenCount,
            },
        };
    }

    private async makeRequest(prompt: Message[]): Promise<AxiosResponse<GenerateContentResponse>> {
        const requestBody: GenerateContentRequest = {
            contents: prompt
                .map(this.toGemniContent)
                .filter((content) => content?.role !== "system"),
            generationConfig: this.generationConfig,
        };

        const systemInstruction = prompt.find((message) => message.role === "system");
        if (systemInstruction) {
            requestBody.system_instruction = {
                parts: [{ text: systemInstruction.content }],
            };
        }

        if (systemInstruction && requestBody.contents.length === 0) {
            throw new ClientError("System instruction provided but no prompt provided");
        }

        const url = `${this.baseUrl}/${this.model}:generateContent?key=${this.apiKey}`;

        try {
            return await axios.post<GenerateContentResponse>(url, requestBody, {
                headers: {
                    "Content-Type": "application/json",
                },
            });
        } catch (error) {
            this.handleRequestError(error);
        }
    }

    private handleRequestError(error: unknown): never {
        if (!axios.isAxiosError(error)) {
            throw new InternalError("An unexpected error occurred", error);
        }

        if (!error.response) {
            throw new APIConnectionError("Failed to connect to Google AI API");
        }

        const { status, data } = error.response;

        if (status === 401) {
            throw new InvalidCredentialsError("Invalid Google AI API key");
        }

        if (status === 429) {
            throw new RateLimitError("Rate limit exceeded");
        }

        throw new InternalError(
            `Google AI API returned an error: ${status} ${data?.error?.message}`, error
        );
    }

    private handleResponse(response: AxiosResponse<GenerateContentResponse>): {
        generatedContent: Content;
        usage: UsageMetadata;
    } {
        if (response.status !== 200) {
            throw new InternalError("Google AI API returned an error");
        }

        const data = response.data;

        if (!data.candidates || data.candidates.length === 0) {
            throw new MalformedResponseError("Google AI API response is empty");
        }

        const generatedContent = data.candidates[0].content;

        return { generatedContent, usage: data.usageMetadata };
    }

    private toGemniContent(message: Message): Content {
        const roleMapping = {
            user: "user",
            tool: "user",
            system: "system",
            assistant: "model",
        };

        return {
            parts: [{ text: message.content }],
            role: roleMapping[message.role],
        };
    }
}
