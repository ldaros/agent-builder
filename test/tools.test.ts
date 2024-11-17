import dotenv from "dotenv";
import { expect } from "chai";
import { InitI18n } from "../src/i18n";
import { OpenAIModel } from "../src/models/open-ai";
import { ConsoleLogger } from "../src/loggers/console-logger";
import { ToolExecutor } from "../src/core/tool-executor";
import { Agent } from "../src/core/agent";
import { PlainTextParser } from "../src/parsers/plain-text-parser";
import { getTestingModel } from "./testing-utils";

describe("Tool Executor", () => {
    dotenv.config();
    InitI18n();

    it("should execute tools", async () => {
        const model = getTestingModel(500);

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

        const response = await agent.execute(
            [
                {
                    role: "user",
                    content: "Please calculate 4 + 4 * 4 using the calculator tool",
                },
            ],
            { contextID: "test" }
        );

        expect(response.data).to.be.a("string");
        expect(response.data).to.include("20");
    });
});
