import { Message, Logger } from "@/core/interfaces";

export class ConsoleLogger implements Logger {
    log(message: Message[]): void {
        message.forEach((msg, index) => {
            console.log(`[${index}] ${msg.role}:\n${msg.content}\n`);
        });
    }
}