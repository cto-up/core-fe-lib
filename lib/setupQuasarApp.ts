import { type App } from 'vue'
import { Quasar } from 'quasar'
import quasarUserOptions from './quasar-user-options.ts'

export function setupQuasarApp(app: App) {
  app.use(Quasar, quasarUserOptions)
}