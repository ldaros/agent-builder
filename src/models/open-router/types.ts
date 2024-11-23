export type OpenRouterModelSettings = {
    apiKey: string;
    baseUrl?: string;
    model?: string;
    params?: Partial<OpenRouterModelParams>;
};

export type OpenRouterModelParams = {
    temperature?: number;
    max_tokens?: number;
    top_p?: number;
    frequency_penalty?: number;
    presence_penalty?: number;
};

export type OpenRouterRequest = {
    messages?: OpenRouterMessage[];
    prompt?: string;
    model?: string;
    response_format?: { type: "json_object" };
    stop?: string | string[];
    stream?: boolean;
    max_tokens?: number;
    temperature?: number;
    top_p?: number;
    top_k?: number;
    frequency_penalty?: number;
    presence_penalty?: number;
    repetition_penalty?: number;
    seed?: number;
    logit_bias?: { [key: number]: number };
    prediction?: { type: "content"; content: string };
    transforms?: string[];
    models?: string[];
    route?: "fallback";
};

export type OpenRouterMessage = {
    role: "user" | "assistant" | "system" | "tool";
    content: string;
    name?: string;
};

export type FunctionDescription = {
    description?: string;
    name: string;
    parameters: object;
};

export type OpenRouterResponse = {
    id: string;
    choices: NonStreamingChoice[];
    created: number;
    model: string;
    object: "chat.completion" | "chat.completion.chunk";
    system_fingerprint?: string;
    usage?: ResponseUsage;
    error?: OpenRouterError;
};

export type ResponseUsage = {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
};

export type NonStreamingChoice = {
    finish_reason: string | null;
    message: {
        content: string | null;
        role: string;
    };
    error?: Error;
};

export type OpenRouterError = {
    code: number;
    message: string;
};
