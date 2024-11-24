import { expect } from "chai";
import { RetryUtil, RetryConfig } from "../src/utils/retry";
import sinon from "sinon";

describe("RetryUtil", () => {
    let clock: sinon.SinonFakeTimers;

    beforeEach(() => {
        // Use fake timers to control async operations
        clock = sinon.useFakeTimers();
    });

    afterEach(() => {
        clock.restore();
    });

    const defaultConfig: RetryConfig = {
        maxAttempts: 3,
        delayMs: 1000,
        backoffFactor: 2,
    };

    it("should succeed on first attempt if operation is successful", async () => {
        const operation = sinon.stub().resolves("success");

        const result = await RetryUtil.withRetry(operation, defaultConfig);

        expect(result).to.equal("success");
        expect(operation.callCount).to.equal(1);
    });

    it("should implement exponential backoff", async () => {
        const error = new Error("Test error");
        const operation = sinon.stub()
            .onFirstCall().rejects(error)
            .onSecondCall().rejects(error)
            .onThirdCall().resolves("success");

        const retryPromise = RetryUtil.withRetry(operation, defaultConfig);
        
        // First attempt fails
        expect(operation.callCount).to.equal(1);
        
        // First retry after 1000ms
        await clock.tickAsync(defaultConfig.delayMs);
        expect(operation.callCount).to.equal(2);
        
        // Second retry after 2000ms (backoff factor = 2)
        await clock.tickAsync(defaultConfig.delayMs * defaultConfig.backoffFactor);
        
        const result = await retryPromise;
        expect(result).to.equal("success");
        expect(operation.callCount).to.equal(3);
    });
});
