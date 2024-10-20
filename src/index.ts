import { OpenAIModel } from "./models/open-ai";
import dotenv from "dotenv";

async function main() {
    dotenv.config();

    const API_KEY = process.env.OPENAI_API_KEY;
    console.assert(API_KEY, "OPENAI_API_KEY is required");

    const model = new OpenAIModel({
        apiKey: process.env.OPENAI_API_KEY as string,
    });

    const response = await model.generate({
        messages: [
            {
                role: "user",
                content: "Hello world!",
            },
        ],
    });

    console.log(response);
}

main();