export default {
  title: "Autenticazione a più fattori",
  subtitle:
    "Gestisci la sicurezza del tuo account e l'autenticazione a più fattori",
  currentLevel: "Livello di sicurezza attuale",
  levelStandard: "Standard",
  levelEnhanced: "Avanzato (MFA attiva)",
  methods: {
    authenticator: "App di autenticazione",
    securityKey: "Chiave di sicurezza",
    recoveryCode: "Codici di recupero",
    totp: {
      title: "App di autenticazione (TOTP)",
      description:
        "Usa app come Google Authenticator, Authy o 1Password",
      setup: "Configura l'app di autenticazione",
      disable: "Disattiva TOTP",
      enabled: "Attivato",
      disabled: "Disattivato",
    },
    webauthn: {
      title: "Chiave di sicurezza (WebAuthn)",
      description:
        "Usa chiavi hardware come YubiKey o la biometria integrata",
      setup: "Configura la chiave di sicurezza",
      manage: "Gestisci le chiavi",
      enabled: "Attivato",
      disabled: "Disattivato",
    },
    recovery: {
      title: "Codici di recupero",
      description:
        "Usa questi codici se perdi l'accesso al tuo dispositivo MFA",
      generate: "Genera i codici",
      regenerate: "Rigenera i codici",
      generated: "Generati",
      notGenerated: "Non generati",
    },
  },
  setup: {
    totp: {
      title: "Configura l'app di autenticazione",
      scanQR: "Scansiona questo codice QR con la tua app di autenticazione:",
      manualEntry: "Oppure inserisci questa chiave manualmente:",
      enterCode:
        "Inserisci il codice a 6 cifre della tua app di autenticazione:",
      codePlaceholder: "000000",
      invalidCode: "Codice non valido. Riprova.",
      cancel: "Annulla",
      next: "Successivo",
      verify: "Verifica e attiva",
    },
    webauthn: {
      title: "Registrazione della chiave di sicurezza",
      description:
        "Segui le istruzioni per registrare la tua chiave di sicurezza",
      processing: "Registrazione della tua chiave di sicurezza in corso...",
      ready: "Pronto a registrare la tua chiave di sicurezza",
      success: "Chiave di sicurezza registrata con successo. Reindirizzamento...",
    },
    recovery: {
      title: "Codici di recupero",
      warning:
        "Importante: Conserva questi codici in un luogo sicuro. Ogni codice può essere usato una sola volta.",
      warningTitle: "Attenzione! Non perdere l'accesso al tuo account",
      warningMessage:
        "Se perdi il tuo telefono, verrai bloccato. Salva questi codici di recupero in un luogo sicuro. Ogni codice può essere usato una sola volta.",
      download: "Scarica",
      copy: "Copia",
      saved: "Li ho salvati",
      confirm: "Ho salvato questi codici",
      interactionHint:
        "Devi copiare o scaricare i codici per continuare",
    },
  },
  notifications: {
    loadError: "Caricamento delle impostazioni MFA non riuscito",
    totpEnabled: "TOTP attivato con successo",
    totpAlreadyEnabled: "TOTP già attivato",
    totpAlreadyEnabledDesc:
      "Hai già l'autenticazione TOTP attivata. Per configurare un nuovo dispositivo, disattiva prima TOTP, quindi riconfiguralo.",
    setupComplete:
      "L'autenticazione a due fattori è ora attiva. I tuoi codici di recupero sono stati salvati.",
    totpDisabled: "TOTP disattivato con successo",
    totpSetupError: "Inizializzazione della configurazione TOTP non riuscita",
    totpDisableError: "Disattivazione di TOTP non riuscita",
    webauthnEnabled: "Chiave di sicurezza registrata con successo",
    webauthnDisabled: "Chiave di sicurezza disattivata con successo",
    webauthnError: "Registrazione della chiave di sicurezza non riuscita",
    webauthnDisableError: "Disattivazione della chiave di sicurezza non riuscita",
    recoveryGenerated: "Codici di recupero generati con successo",
    recoveryError: "Generazione dei codici di recupero non riuscita",
    recoveryCopied: "Codici di recupero copiati negli appunti",
    setupError: "Configurazione non riuscita. Riprova.",
    verificationError: "Verifica non riuscita",
    verificationErrorDesc:
      "Impossibile inizializzare la verifica. Riprova o contatta il supporto.",
    verificationSuccess: "Verifica riuscita",
    verificationSuccessDesc:
      "La tua identità è stata verificata. Ora puoi continuare.",
    verificationCancelled: "Verifica annullata",
    verificationCancelledDesc:
      "L'operazione è stata annullata. Riprova quando sei pronto.",
    noMethodsAvailable: "Nessun metodo MFA disponibile",
    noMethodsAvailableDesc:
      "Non hai alcun metodo MFA configurato. Configura prima MFA.",
  },
  confirmations: {
    disableTotp:
      "Sei sicuro di voler disattivare l'autenticazione TOTP?",
    disableTotpDescription:
      "Questo rimuoverà l'autenticazione a due fattori dal tuo account. Potrai riconfigurarla in qualsiasi momento.",
    disableWebauthn:
      "Sei sicuro di voler disattivare la tua chiave di sicurezza?",
    disableWebauthnDescription:
      "Questo rimuoverà la tua chiave di sicurezza dal tuo account. Potrai registrare una nuova chiave in qualsiasi momento.",
    cancelRecoveryCodes:
      "Non hai ancora salvato i tuoi codici di recupero. Se chiudi questa finestra, dovrai rigenerarli. Sei sicuro di voler annullare?",
    cancelRecoveryCodesDescription:
      "Questi codici sono il tuo metodo di accesso di riserva. Senza di essi, potresti perdere l'accesso al tuo account se perdi il tuo dispositivo di autenticazione.",
  },
  aal2: {
    title: "Verifica aggiuntiva richiesta",
    description:
      "Questa azione richiede una verifica di sicurezza aggiuntiva. Verifica la tua identità usando uno dei tuoi metodi di autenticazione configurati.",
    selectMethod: "Scegli il metodo di verifica:",
    methodTotp: "App di autenticazione",
    methodRecovery: "Codice di recupero",
    methodWebauthn: "Chiave di sicurezza",
    webauthnComingSoon: "Verifica tramite chiave di sicurezza disponibile a breve",
    useRecoveryCode: "Usa un codice di recupero al suo posto",
    useAuthenticator: "Usa l'app di autenticazione al suo posto",
    totpHint:
      "Inserisci il codice a 6 cifre della tua app di autenticazione",
    webauthnHint: "Inserisci la tua chiave di sicurezza e segui le istruzioni",
    recoveryHint: "Inserisci uno dei tuoi codici di recupero di riserva",
    webauthnTitle: "Verifica tramite chiave di sicurezza",
    webauthnDescription:
      "Usa la tua chiave di sicurezza per verificare la tua identità",
    webauthnProcessing: "Verifica della tua chiave di sicurezza in corso...",
    webauthnReady: "Pronto a verificare con la tua chiave di sicurezza",
    noMfaRegistered:
      "Devi registrare un livello di autenticazione più elevato per accedere a questa funzionalità. Accedi alle Impostazioni di sicurezza per configurare l'autenticazione a più fattori.",
    goToSecuritySettings: "Apri le impostazioni di sicurezza",
    sessionRefreshRequired:
      "La tua sessione è troppo vecchia per eseguire questa azione. Accedi di nuovo per continuare.",
    logout: "Disconnetti",
  },
  recovery: {
    enterCode: "Inserisci il codice di recupero",
    invalidCode: "Codice di recupero non valido. Riprova.",
  },
};
