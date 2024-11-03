import { ErrorObject } from "ajv";

export function formatAJVErrors(errors: ErrorObject[] | null | undefined): string {
    if (!errors) {
        return "Unknown error";
    }

    return errors
        .map((err) => {
            const dataPath = err.instancePath || err.instancePath || "";
            const message = err.message || "Validation error";
            return `Error at ${dataPath}: ${message}`;
        })
        .join("\n");
}
