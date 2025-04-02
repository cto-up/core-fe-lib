import { type App } from 'vue'
import { Quasar } from 'quasar'
import quasarUserOptions from './quasar-user-options'

// Import Quasar css
import 'quasar/dist/quasar.css'

export function setupQuasarApp(app: App) {
  app.use(Quasar, quasarUserOptions)
}
