import i18n from "i18next";
import { InitI18n } from "../src/i18n";
import { expect } from "chai";
import pt_translation from "../src/i18n/locales/pt/translations.json";

describe("i18n", () => {
    it("should initialize i18n with default config", () => {
        InitI18n();

        expect(i18n.language).to.equal("en");
        expect(i18n.options.lng).to.equal("en");
    });

    it("should initialize i18n with custom config", () => {
        InitI18n({
            lng: "pt",
        });

        expect(i18n.language).to.equal("pt");
        expect(i18n.options.lng).to.equal("pt");
    });

    it("should return the correct translations", () => {
        InitI18n({ lng: "pt" });

        expect(i18n.t("instructions.jsonSchema")).to.equal(pt_translation.instructions.jsonSchema);
    });
});
