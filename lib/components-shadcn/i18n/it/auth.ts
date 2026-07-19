export default {
  error: "Errore di autenticazione",
  noAccess: {
    title: "Accesso richiesto",
    subtitle: "Non hai ancora accesso a questo tenant",
    message1:
      "Il tuo account è autenticato, ma devi richiedere l'accesso a",
    message2: "per continuare.",
    message3:
      "Contatta il tuo amministratore per ottenere l'accesso a questo tenant.",
    signedInAs: "Connesso come",
    signOutButton: "Disconnetti",
    contactAdminButton: "Contatta l'amministratore",
    emailSubject: "Richiesta di accesso per {tenantName}",
    emailBody:
      "Salve,\n\nVorrei richiedere l'accesso a {tenantName}.\n\nLa mia email: {userEmail}\n\nGrazie.",
  },
  signIn: {
    title: "Accesso",
    subtitle: "Accedi per accedere al tuo account",
    emailLabel: "Indirizzo email",
    passwordLabel: "Password",
    loginButton: "Accedi",
    forgotPassword: "Password dimenticata?",
    noAccount: "Non hai ancora un account?",
    signUpLink: "Registrati",
  },
  signUp: {
    title: "Registrazione",
    subtitle: "Crea il tuo account",
    magicLinkSubtitle: "Inserisci i tuoi dati per iniziare",
    nameLabel: "Nome",
    nameRequired: "Il nome è obbligatorio",
    emailLabel: "Indirizzo email",
    emailInvalid: "Inserisci un indirizzo email valido",
    continueButton: "Continua",
    haveAccount: "Hai già un account?",
    signInLink: "Accedi",
    disabled: "La registrazione è disattivata",
    checkEmail: "Controlla la tua email",
    universalMessage:
      "Abbiamo inviato un link o un codice sicuro se questa email è associata a un account.",
    emailSentTo: "Inviato a:",
    nextSteps: "Cosa fare adesso:",
    step1: "Controlla la tua casella di posta",
    step2: "Fai clic sul link sicuro che ti abbiamo inviato",
    step3:
      "Verrai connesso automaticamente e potrai impostare la tua password",
    changeEmail: "Hai inserito l'email sbagliata?",
    backToSignIn: "Torna all'accesso",
    secureExplainer:
      "Ti invieremo un link sicuro per continuare. Nessuna password necessaria: il link ti permette di impostare la tua password una volta effettuato l'accesso.",
    spamHint:
      "Non vedi l'email? Controlla la cartella spam o posta indesiderata.",
    notifications: {
      validationError: "Verifica i tuoi dati.",
      error: "Si è verificato un errore. Riprova.",
    },
  },
  emailVerification: {
    loading: {
      title: "Verifica della tua email in corso...",
      subtitle:
        "Attendi mentre confermiamo il tuo indirizzo email.",
    },
    success: {
      title: "Email verificata con successo!",
      subtitle:
        "Il tuo indirizzo email è stato confermato. Ora hai accesso completo al tuo account.",
      continueButton: "Continua alla dashboard",
      signInButton: "Accedi",
    },
    error: {
      title: "Verifica non riuscita",
      noToken:
        "Nessun token di verifica fornito. Verifica il link nella tua email.",
      network: "Errore di rete. Verifica la tua connessione e riprova.",
      resendHelpText: "Hai bisogno di un nuovo link di verifica?",
      resendButton: "Invia di nuovo l'email di verifica",
      resending: "Invio in corso...",
      resendCooldown: "Invia di nuovo tra {seconds}s",
      backToSignIn: "Torna all'accesso",
      contactSupport: "Contatta il supporto",
    },
    expired: {
      title: "Link di verifica scaduto",
      subtitle:
        "Questo link di verifica è scaduto per motivi di sicurezza. I link di verifica sono validi per 24 ore.",
      getNewLinkButton: "Ottieni un nuovo link di verifica",
      backToSignIn: "Torna all'accesso",
    },
    toasts: {
      success: "Email verificata con successo!",
      resendSuccess:
        "Email di verifica inviata! Controlla la tua casella di posta.",
      networkError: "Errore di rete. Riprova.",
    },
  },
  passwordReset: {
    title: "Reimposta la password",
    emailLabel: "Email",
    newPasswordLabel: "Nuova password",
    resetButton: "Reimposta la password",
    sending: "Invio in corso...",
    emailSent: "Email di reimpostazione della password inviata",
    emailSentDescription:
      "Controlla la tua email per le istruzioni di reimpostazione della password.",
    error: "Invio dell'email di reimpostazione della password non riuscito",
    success: "Password reimpostata con successo",
    checkEmailTitle: "Controlla la tua email",
    checkEmailDescription:
      "Se esiste un account per questo indirizzo, ti abbiamo inviato un link sicuro per reimpostare la password.",
    emailSentTo: "Inviato a:",
    spamHint:
      "Non vedi l'email? Controlla la cartella spam o posta indesiderata.",
    closePageHint:
      "Apri il link per impostare una nuova password. Ora puoi chiudere questa pagina.",
  },
  recovery: {
    title: "Imposta la tua password",
    activatingLink: "Attivazione del link di recupero in corso...",
    pleaseSetPassword: "Imposta la tua password",
    newPasswordLabel: "Nuova password",
    newPasswordPlaceholder: "Inserisci la tua nuova password",
    confirmPasswordLabel: "Conferma la password",
    confirmPasswordPlaceholder: "Conferma la tua nuova password",
    setPasswordButton: "Imposta la password",
    settingPassword: "Impostazione della password in corso...",
    mismatchedPasswords: "Le password non corrispondono",
    passwordTooShort: "La password deve contenere almeno 8 caratteri",
    passwordsDoNotMatch: "Le password non corrispondono",
    invalidLink:
      "Link di recupero non valido. Parametri richiesti mancanti (flusso o token).",
    invalidToken: "Il link di recupero non è valido.",
    csrfTokenError: "Estrazione del token CSRF dal flusso di parametri non riuscita",
    sessionExpired:
      "Sessione scaduta. Richiedi un nuovo link di recupero.",
    processingError:
      "Elaborazione del link di recupero non riuscita. Riprova.",
    failedToSetPassword: "Impostazione della password non riuscita",
    passwordSetSuccess:
      "Password impostata con successo! Reindirizzamento all'accesso...",
    requestNewLink:
      "Richiedi un nuovo link di reimpostazione della password.",
  },
  securitySettings: {
    title: "Impostazioni di sicurezza",
    subtitle:
      "Gestisci la sicurezza del tuo account e l'autenticazione a più fattori",
  },
  loginSuccess: "Accesso riuscito",
  logoutSuccess: "Disconnessione riuscita",
  success: "Successo",
};
