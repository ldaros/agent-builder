/**
 * Configuration for retrying failed executions.
 */
export interface RetryConfig {
    maxAttempts: number;
    delayMs: number;
    backoffFactor: number;
}

export class RetryUtil {
    static async withRetry<T>(operation: () => Promise<T>, config: RetryConfig): Promise<T> {
        let lastError: Error | undefined;

        for (let attempt = 1; attempt <= config.maxAttempts; attempt++) {
            try {
                return await operation();
            } catch (error) {
                lastError = error as Error;
                if (attempt < config.maxAttempts) {
                    await this.delay(config.delayMs * Math.pow(config.backoffFactor, attempt - 1));
                }
            }
        }

        throw lastError;
    }

    private static delay(ms: number): Promise<void> {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }
}
