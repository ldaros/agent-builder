export type OpenAIModelSettings = {
    apiKey: string;
    baseUrl?: string;
    model?: string;
    params?: Partial<OpenAIModelParams>;
};

export type OpenAIRequestBody = {
    model: string;
    messages: OpenAIMessage[];
    temperature?: number;
    max_tokens?: number;
    top_p?: number;
    frequency_penalty?: number;
    presence_penalty?: number;
};

export type OpenAIMessage = {
    role: string;
    content: string;
    name?: string;
};

export type OpenAIModelParams = {
    temperature: number;
    max_tokens: number;
    top_p: number;
    frequency_penalty: number;
    presence_penalty: number;
};

export type OpenAIResponse = {
    id: string;
    object: string;
    created: number;
    model: string;
    choices: OpenAIChoice[];
    usage: OpenAIUsage;
};

export type OpenAIUsage = {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
}

export type OpenAIChoice = {
    index: number;
    message: OpenAIMessage;
    finish_reason: string;
};
