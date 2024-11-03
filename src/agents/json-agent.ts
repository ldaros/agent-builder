import i18n from "@/i18n";
import { Model } from "@/core/interfaces";
import { Agent } from "@/core/agent";
import { JSONSchemaParser } from "@/parsers/json-schema-parser";

export class JSONConversionAgent<T> {
    private agent: Agent<T>;
    private parser: JSONSchemaParser<T>;

    constructor(model: Model, schema: any) {
        this.parser = new JSONSchemaParser<T>(schema);
        this.agent = new Agent<T>(model, this.parser);
    }

    async execute(content: string): Promise<T> {
        return await this.agent.execute([
            {
                role: "system",
                content: i18n.t("instructions.jsonAgent"),
            },
            {
                role: "user",
                content: content,
            },
        ]);
    }
}
