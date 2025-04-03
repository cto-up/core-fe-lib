import "./styles/quasar.variables.sass";

// Import icon libraries
import "@quasar/extras/roboto-font/roboto-font.css";
import "@quasar/extras/material-icons/material-icons.css";
import "@quasar/extras/material-icons-outlined/material-icons-outlined.css";
import "@quasar/extras/material-icons-round/material-icons-round.css";
import "@quasar/extras/material-icons-sharp/material-icons-sharp.css";
import "@quasar/extras/fontawesome-v5/fontawesome-v5.css";
import "@quasar/extras/ionicons-v4/ionicons-v4.css";
import "@quasar/extras/mdi-v4/mdi-v4.css";
import "@quasar/extras/eva-icons/eva-icons.css";

// Import all Quasar components
import { QCard, QCardSection,QCardActions, QLinearProgress, QImg, QSelect, QSpinnerFacebook, Dialog, Notify, QBtn, QInput, QIcon, QPopupProxy, QDate, QTime, ClosePopup, QTab, QTabPanel, QTabs, QTabPanels, QDialog, QPage } from 'quasar'

// To be used on app.use(Quasar, { ... })
export default {
  config: {},
  plugins: {
    Dialog,
    Notify
  },
  components: {
    QCard,
    QCardSection,
    QCardActions,
    QLinearProgress,
    QImg,
    QSelect,
    QSpinnerFacebook,
    QBtn,
    QInput,
    QIcon,
    QPopupProxy,
    QDate,
    QTime,
    QTab,
    QTabPanel,
    QTabs,
    QTabPanels,
    QDialog,
    QPage
  },
  directives: {
    ClosePopup
  }
};
