### Parser Interfaces and Implementations

This section describes the `IParser` interface and available parser implementations.

*   **IParser:** A contract for parsing model output. Implementations should handle different output formats.

*   **JSONSchemaParser:** Parses JSON responses according to a provided schema, checking for validity.
*   **PlainTextParser:** Parses plain text responses.
