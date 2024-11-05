import { expect } from "chai";
import { cleanJSON } from "../src/utils/clean-json";

describe("cleanJSON", () => {
    it("should remove markdown content", () => {
        const text = "```json\n{ \"name\": \"John Doe\", \"age\": 30 }\n```";

        const result = cleanJSON(text);

        expect(result).to.be.a("string");
        expect(result).to.equal("{ \"name\": \"John Doe\", \"age\": 30 }");
    });

    it("should keep valid JSON content", () => {
        const text = "{ \"name\": \"John Doe\", \"age\": 30 }";

        const result = cleanJSON(text);

        expect(result).to.be.a("string");
        expect(result).to.equal(text);
    });
});
