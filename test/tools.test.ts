import dotenv from "dotenv";
import { expect } from "chai";
import { InitI18n } from "@/i18n";
import { OpenAIModel } from "@/models/open-ai";
import { ConsoleLogger } from "@/loggers/console-logger";
import { ToolExecutor } from "@/core/tool-executor";
import { Agent } from "@/core/agent";
import { PlainTextParser } from "@/parsers/plain-text-parser";

describe("Tool Executor", () => {
    dotenv.config();
    InitI18n();

    it("should execute tools", async () => {
        const model = new OpenAIModel(
            {
                apiKey: process.env.OPENAI_API_KEY as string,
                params: {
                    max_tokens: 500,
                },
            },
            // new ConsoleLogger()
        );

        const tools = [
            {
                name: "calculator",
                description: "Useful for answering simple mathematical questions",
                schema: {
                    type: "object",
                    properties: {
                        expression: {
                            type: "string",
                            description:
                                "The mathematical expression to evaluate, example: 2 + 2 * 2",
                        },
                    },
                    required: ["expression"],
                },
                execute: async (args: { expression: string }) => {
                    const result = eval(args.expression);
                    return {
                        output: result.toString(),
                    };
                },
            },
        ];

        const executor = new ToolExecutor(tools);
        const parser = new PlainTextParser();

        const agent = new Agent(model, parser, executor);

        const response = await agent.execute([
            {
                role: "user",
                content: "Please calculate 4 + 4 * 4 using the calculator tool",
            },
        ], { contextID: "test" });

        expect(response.data).to.be.a("string");
        expect(response.data).to.include("20");
    });
});
