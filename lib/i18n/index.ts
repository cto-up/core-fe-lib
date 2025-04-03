import { createI18n } from 'vue-i18n'

const messages = {
  'en-US': {
    entities: {
      common: {
        duration: 'Duration',
        close: 'Close',
        dateTime: 'Date Time'
      }
    }
  },
  'fr': {
    entities: {
      common: {
        duration: 'Durée',
        close: 'Fermer',
        dateTime: 'Date et heure'
      }
    }
  }
}

export const i18n = createI18n({
  legacy: false, // Set to false to use Composition API
  locale: 'en-US',
  fallbackLocale: 'en-US',
  messages
})