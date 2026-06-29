import { createI18n } from "vue-i18n";

const messages = {
  "en-US": {
    entities: {
      common: {
        duration: "Duration",
        close: "Close",
        dateTime: "Date Time",
      },
    },
  },
  fr: {
    entities: {
      common: {
        duration: "Durée",
        close: "Fermer",
        dateTime: "Date et heure",
      },
    },
  },
  es: {
    entities: {
      common: {
        duration: "Duración",
        close: "Cerrar",
        dateTime: "Fecha y hora",
      },
    },
  },
  it: {
    entities: {
      common: {
        duration: "Durata",
        close: "Chiudi",
        dateTime: "Data e ora",
      },
    },
  },
};

export const i18n = createI18n({
  legacy: false, // Set to false to use Composition API
  locale: "en-US",
  fallbackLocale: "en-US",
  messages,
});
