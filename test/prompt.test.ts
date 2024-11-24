import { expect } from "chai";
import { Prompt } from "../src/core/prompt";

describe("Prompt", () => {
    it("should format prompt parts", () => {
        const prompt = new Prompt([
            {
                role: "user",
                content: "Hello, {{name}}!",
            },
            {
                role: "assistant",
                content: "Hello, {{name}}!",
            },
        ]);

        const formattedPrompt = prompt.format({ name: "John" });

        expect(formattedPrompt).to.be.an("array");
        expect(formattedPrompt).to.have.length(2);
        expect(formattedPrompt[0]).to.have.property("role", "user");
        expect(formattedPrompt[0]).to.have.property("content", "Hello, John!");
        expect(formattedPrompt[1]).to.have.property("role", "assistant");
        expect(formattedPrompt[1]).to.have.property("content", "Hello, John!");
    });

    it("should handle missing keys", () => {
        const prompt = new Prompt([
            {
                role: "user",
                content: "Hello, {{name}}!",
            },
        ]);

        const formattedPrompt = prompt.format({});

        expect(formattedPrompt).to.be.an("array");
        expect(formattedPrompt).to.have.length(1);
        expect(formattedPrompt[0]).to.have.property("role", "user");
        expect(formattedPrompt[0]).to.have.property("content", "Hello, {{name}}!");
    });
});
