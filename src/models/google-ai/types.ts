export type GoogleAIModelSettings = {
    apiKey: string;
    baseUrl?: string;
    model?: string;
    params?: Partial<GemniGenerationConfig>;
};

export type GemniGenerationConfig = {
    stopSequences: string[];
    temperature: number;
    maxOutputTokens: number;
    topP: number;
    topK: number;
};

export type GenerateContentRequest = {
    contents: Content[];
    system_instruction?: Content;
    generationConfig?: GemniGenerationConfig;
};

export type Content = {
    parts: ContentPart[];
    role?: string;
};

export type ContentPart = {
    text: string;
};

export type GenerateContentResponse = {
    candidates: Candidate[];
    usageMetadata: UsageMetadata;
    modelVersion: string;
};

export type Candidate = {
    content: Content;
    finishReason: string;
    avgLogprobs: number;
};

export type UsageMetadata = {
    promptTokenCount: number;
    candidatesTokenCount: number;
    totalTokenCount: number;
};
