### Tool Executor and Tools

Describes the `ITool` interface and the `ToolExecutor` class:

*   **ITool:** Defines the contract for external tools, specifying `name`, `description`, and `schema` (for argument validation). The `execute` method handles the tool's logic.
*   **ToolExecutor:**  Manages execution of `ITool` instances, handling argument parsing, validation, and error handling.