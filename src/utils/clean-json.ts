export function cleanJSON(text: string): string {
    // Regular expression to capture the JSON content inside the markdown block
    const regex = /```json\s*([\s\S]*?)\s*```/g;
    let matches;
    let result = "";

    // If there are markdown blocks, extract the JSON content
    while ((matches = regex.exec(text)) !== null) {
        result += matches[1].trim(); // Trim to clean up extra whitespaces
    }

    // If no markdown was found, return the original text (it may already be valid JSON)
    return result || text.trim();
}
