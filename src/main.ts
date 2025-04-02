import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import { i18n } from "../lib/main"

import "../lib/styles/quasar.global.sass"
import "../lib/styles/quasar.variables.sass"
import { setupQuasarApp } from "../lib/setupQuasarApp"

const app = createApp(App)
app.use(i18n)
setupQuasarApp(app)
app.mount('#app')
