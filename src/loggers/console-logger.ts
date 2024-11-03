import { Message, Logger, ExecutionParams } from "@/core/interfaces";

export class ConsoleLogger implements Logger {
    private contexts: Map<string, number> = new Map();

    log(messages: Message[], params?: ExecutionParams): void {
        const contextID = params?.contextID;

        if (!contextID) {
            messages.forEach((msg, index) => {
                console.log(`[${index}] ${msg.role}:\n${msg.content}\n`);
            });
            return;
        }

        const lastLoggedIndex = this.contexts.get(contextID) ?? -1;
        const newMessages = messages.slice(lastLoggedIndex + 1);

        newMessages.forEach((msg, index) => {
            console.log(`[${lastLoggedIndex + 1 + index}] ${msg.role}:\n${msg.content}\n`);
        });

        this.contexts.set(contextID, messages.length - 1);
    }
}
