## Advanced Usage

This guide demonstrates advanced usage scenarios, including implementing custom models and using tools.

### Implementing a Custom Model

The `agent-builder` library allows for seamless integration with any LLMs. To use a custom model, you need to implement the `IModel` interface.

```typescript
import { IModel, ModelOutput, Message, ExecutionParams } from "agent-builder/lib/core/interfaces";

export class MyCustomModel implements IModel {
    async generate(prompt: Message[], params?: ExecutionParams): Promise<ModelOutput> {
        // Your custom logic to interact with your LLM goes here.
        // Example using a hypothetical 'custom-llm' library:
        const response = await customLlm.generate(prompt.map((msg) => msg.content));
        const generatedMessage: Message = { role: "assistant", content: response };
        return { generated: generatedMessage, modelMetadata: { model: "MyCustomModel" } };
    }
}
```

### Using Tools

The `ToolExecutor` handles the execution of external tools. You'll need to define your tools as objects implementing the `ITool` interface:

This example shows a tool that fetches data from an external API. The `schema` defines the expected input arguments for the tool. The `execute` method performs the API call and returns the result.

```typescript
import { ITool, ToolExecutionResult } from "agent-builder/lib/core/interfaces";

class MyTool implements ITool {
    name = "my-tool";
    description = "A tool for fetching information from a specific API";
    schema = { type: "object", properties: { apiKey: { type: "string" } } };

    async execute(args: { apiKey: string }): Promise<ToolExecutionResult> {
        try {
            const response = await fetch(`https://api.example.com/data`, {
                headers: { "X-API-Key": args.apiKey },
            });

            if (!response.ok) {
                return { error: `API request failed: ${response.status}` };
            }

            const data = await response.json();
            return { output: JSON.stringify(data, null, 2) };
        } catch (error) {
            return { error: `Error executing tool: ${error.message}` };
        }
    }
}
```

**Integrating Tools with the Agent:**

```typescript
import { Agent, ToolExecutor } from "agent-builder";
import { MyTool } from "./my-tool";
import { MyCustomModel } from "./my-custom-model";

const tools = [new MyTool()];
const executor = new ToolExecutor(tools);
const model = new MyCustomModel();

const agent = new Agent(
    model,
    new JSONSchemaParser({
        /* your schema */
    }),
    executor
);

// ... use the agent as usual
```
