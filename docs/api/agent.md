### Agent Class

The `Agent` class is the core component for interacting with LLMs and tools. It manages the execution flow, handling prompts, model responses, parsing, and tool execution.

**Constructor:**

```typescript
constructor(
    model: IModel,
    parser: IParser<any> = new PlainTextParser(),
    executor?: ToolExecutor
);
```

-   `model`: An instance of `IModel` representing the LLM to interact with.
-   `parser`: An instance of `IParser` (defaulting to `PlainTextParser`) used to convert model output into a specific format. Can be customized for JSON, XML, or other formats.
-   `executor`: An optional `ToolExecutor` instance for executing external tools.

**execute Method:**

```typescript
async execute(prompt: Prompt | Message[], params?: ExecutionParams): Promise<AgentOutput<T>>;
```

-   `prompt`: The prompt or a list of messages to send to the LLM.
-   `params`: Optional execution parameters, allowing for context-specific configurations (e.g., `contextID`).

**Key Features:**

-   Handles both `Prompt` and `Message` array inputs for flexibility.
-   Integrates with parsers for diverse output formats.
-   Supports tool execution through the `ToolExecutor` (optional).
-   Adds system instructions based on the parser and tool.
-   Robust error handling (through custom error classes).
