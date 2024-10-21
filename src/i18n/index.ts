import i18n, { InitOptions } from "i18next";
import resources from "./locales";

export function InitI18n(config?: InitOptions) {
    const defaultConfig: InitOptions = {
        lng: "en",
        fallbackLng: "en",
        resources,
        interpolation: {
            escapeValue: false,
        },
        ...config,
    };

    i18n.init(defaultConfig);
}

export default i18n;
