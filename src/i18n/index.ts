import i18n, { InitOptions } from "i18next";
import resources from "./locales";

/**
 * agent-builder uses i18next for internationalization.
 * This function initializes the i18next instance with the default configuration.
 * You can pass in an optional configuration object to customize the behavior.
 */
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
