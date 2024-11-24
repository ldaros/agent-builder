# Getting Started with agent-builder

This guide provides step-by-step instructions on how to install and use the `agent-builder` library to create agents that interact with large language models (LLMs).

## Prerequisites

Before you begin, ensure you have the following:

-   Node.js and npm (or yarn) installed on your system.
-   An understanding of basic JavaScript/TypeScript concepts.

## Installation

Use npm to install the `agent-builder` library:

```bash
npm install agent-builder
```

This command will install all the necessary dependencies.

## Basic Usage (With JSON output)

This example demonstrates how to create a simple agent that outputs JSON.

```typescript
import { Agent } from "agent-builder";
import { OpenAIModel } from "agent-builder/lib/models";
import { JSONSchemaParser } from "agent-builder/lib/parsers";

// Load the model
const model = new OpenAIModel({ apiKey: "YOUR_OPENAI_API_KEY" });

// Configure the parser
const parser = new JSONSchemaParser<Person>({
    type: "object",
    properties: {
        name: { type: "string" },
        age: { type: "integer" },
    },
});

// Create the agent
const agent = new Agent(model, parser);

// Example usage
async function run() {
    const output = await agent.execute([
        { role: "user", content: "Generate a random name and age" },
    ]);
    console.log(output.data); // Output: { name: "John Doe", age: 30 }
}

run();
```
