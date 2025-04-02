import { createApp } from 'vue'
import './style.css'
import App from './App.vue'

import "../lib/styles/quasar.global.sass"
import "../lib/styles/quasar.variables.sass"
import { setupQuasarApp } from "../lib/setupQuasarApp"

const app = createApp(App)
setupQuasarApp(app)
app.mount('#app')
