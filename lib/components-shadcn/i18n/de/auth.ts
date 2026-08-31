export default {
  error: "Authentifizierungsfehler",
  noAccess: {
    title: "Zugriff erforderlich",
    subtitle: "Sie haben noch keinen Zugriff auf diesen Mandanten",
    message1:
      "Ihr Konto ist authentifiziert, aber Sie müssen Zugriff anfordern auf",
    message2: "um fortzufahren.",
    message3:
      "Bitte wenden Sie sich an Ihren Administrator, um Ihnen Zugriff auf diesen Mandanten zu gewähren.",
    signedInAs: "Angemeldet als",
    signOutButton: "Abmelden",
    contactAdminButton: "Administrator kontaktieren",
    emailSubject: "Zugriffsanfrage für {tenantName}",
    emailBody:
      "Hallo,\n\nich möchte Zugriff auf {tenantName} anfordern.\n\nMeine E-Mail-Adresse: {userEmail}\n\nVielen Dank.",
  },
  alreadySignedIn: {
    title: "Sie sind bereits angemeldet",
    subtitle: "In diesem Browser ist bereits eine Sitzung aktiv.",
    signedInAs: "Angemeldet als",
    continueButton: "Weiter",
    switchButton: "Mit einem anderen Konto anmelden",
    switching: "Abmelden...",
    toastTitle: "Bereits angemeldet",
    toastDescription: "Wir bringen Sie dorthin zurück, wo Sie aufgehört haben.",
  },
  // Kratos redirects here (selfservice.flows.error.ui_url) when a flow
  // dies before it can render — expired, interrupted, or traits rejected.
  flowError: {
    title: "Anmeldung konnte nicht abgeschlossen werden",
    subtitle: "An Ihrem Konto wurde nichts geändert.",
    generic:
      "Der Anmeldeversuch ist abgelaufen oder wurde unterbrochen. Ein neuer Versuch behebt das meist.",
    reference: "Referenz",
    retry: "Zurück zur Anmeldung",
  },
  // Where a social sign-in round-trip lands: the identity exists, the
  // tenant membership is being attached. See ADR 039 in the lms repo.
  socialCallback: {
    working: {
      title: "Anmeldung wird abgeschlossen",
      body: "Ihr Konto wird eingerichtet…",
    },
    denied: {
      title: "Dieser Bereich ist nur auf Einladung",
      body: "Ihr Konto ist angemeldet, aber dieser Bereich erlaubt keine Selbstregistrierung. Bitten Sie eine Administratorin oder einen Administrator um eine Einladung.",
    },
    failed: {
      title: "Anmeldung konnte nicht abgeschlossen werden",
      body: "Ihr Konto wurde erstellt, konnte diesem Bereich aber nicht zugeordnet werden. Bitte versuchen Sie es gleich noch einmal.",
    },
    backToSignIn: "Zurück zur Anmeldung",
  },
  signIn: {
    title: "Anmelden",
    subtitle: "Melden Sie sich an, um auf Ihr Konto zuzugreifen",
    emailLabel: "E-Mail-Adresse",
    passwordLabel: "Passwort",
    loginButton: "Anmelden",
    forgotPassword: "Passwort vergessen?",
    noAccount: "Sie haben noch kein Konto?",
    signUpLink: "Registrieren",
    // Social sign-in buttons are rendered from the Kratos login flow; the
    // provider name is substituted at runtime.
    continueWith: "Weiter mit {provider}",
    orContinueWith: "oder",
    // Replaces Kratos's own wording for message 1010016 — an email that
    // already belongs to a password account. Reassure, don't report.
    linkAccount:
      "Sie haben bereits ein Konto mit {email}. Geben Sie einmal Ihr Passwort ein, dann verknüpfen wir {provider} damit — beim nächsten Mal genügt ein Klick.",
  },
  signUp: {
    title: "Registrieren",
    subtitle: "Erstellen Sie Ihr Konto",
    magicLinkSubtitle: "Geben Sie Ihre Daten ein, um loszulegen",
    nameLabel: "Name",
    nameRequired: "Name ist erforderlich",
    emailLabel: "E-Mail-Adresse",
    emailInvalid: "Bitte geben Sie eine gültige E-Mail-Adresse ein",
    continueButton: "Fortfahren",
    haveAccount: "Sie haben bereits ein Konto?",
    signInLink: "Anmelden",
    disabled: "Die Registrierung ist deaktiviert",
    checkEmail: "Überprüfen Sie Ihre E-Mails",
    universalMessage:
      "Wir haben einen sicheren Link oder Code gesendet, falls diese E-Mail-Adresse mit einem Konto verknüpft ist.",
    emailSentTo: "Gesendet an:",
    nextSteps: "Nächste Schritte:",
    step1: "Überprüfen Sie Ihren E-Mail-Posteingang",
    step2: "Klicken Sie auf den sicheren Link, den wir Ihnen gesendet haben",
    step3:
      "Sie werden automatisch angemeldet und können Ihr Passwort festlegen",
    changeEmail: "Falsche E-Mail-Adresse eingegeben?",
    backToSignIn: "Zurück zur Anmeldung",
    secureExplainer:
      "Wir senden Ihnen einen sicheren Link zum Fortfahren. Kein Passwort erforderlich — mit dem Link können Sie Ihr Passwort festlegen, sobald Sie angemeldet sind.",
    spamHint:
      "Sie sehen die E-Mail nicht? Prüfen Sie bitte Ihren Spam- oder Junk-Ordner.",
    notifications: {
      validationError: "Bitte geben Sie eine gültige E-Mail-Adresse ein.",
      error: "Etwas ist schiefgelaufen. Bitte versuchen Sie es erneut.",
    },
  },
  emailVerification: {
    loading: {
      title: "Ihre E-Mail-Adresse wird verifiziert...",
      subtitle: "Bitte warten Sie, während wir Ihre E-Mail-Adresse bestätigen.",
    },
    success: {
      title: "E-Mail-Adresse erfolgreich verifiziert!",
      subtitle:
        "Ihre E-Mail-Adresse wurde bestätigt. Sie haben nun vollen Zugriff auf Ihr Konto.",
      continueButton: "Weiter zum Dashboard",
      signInButton: "Anmelden",
    },
    error: {
      title: "Verifizierung fehlgeschlagen",
      noToken:
        "Kein Verifizierungs-Token angegeben. Bitte überprüfen Sie Ihren E-Mail-Link.",
      network:
        "Netzwerkfehler. Bitte überprüfen Sie Ihre Verbindung und versuchen Sie es erneut.",
      resendHelpText: "Benötigen Sie einen neuen Verifizierungslink?",
      resendButton: "Verifizierungs-E-Mail erneut senden",
      resending: "Wird gesendet...",
      resendCooldown: "Erneut senden in {seconds}s",
      backToSignIn: "Zurück zur Anmeldung",
      contactSupport: "Support kontaktieren",
    },
    expired: {
      title: "Verifizierungslink abgelaufen",
      subtitle:
        "Dieser Verifizierungslink ist aus Sicherheitsgründen abgelaufen. Verifizierungslinks sind 24 Stunden gültig.",
      getNewLinkButton: "Neuen Verifizierungslink anfordern",
      backToSignIn: "Zurück zur Anmeldung",
    },
    toasts: {
      success: "E-Mail-Adresse erfolgreich verifiziert!",
      resendSuccess:
        "Verifizierungs-E-Mail gesendet! Bitte überprüfen Sie Ihren Posteingang.",
      networkError: "Netzwerkfehler. Bitte versuchen Sie es erneut.",
    },
  },
  passwordReset: {
    title: "Passwort zurücksetzen",
    emailLabel: "E-Mail",
    newPasswordLabel: "Neues Passwort",
    resetButton: "Passwort zurücksetzen",
    sending: "Wird gesendet...",
    emailSent: "E-Mail zum Zurücksetzen des Passworts gesendet",
    emailSentDescription:
      "Bitte überprüfen Sie Ihre E-Mails auf Anweisungen zum Zurücksetzen des Passworts.",
    error: "E-Mail zum Zurücksetzen des Passworts konnte nicht gesendet werden",
    success: "Passwort erfolgreich zurückgesetzt",
    checkEmailTitle: "Überprüfen Sie Ihre E-Mails",
    checkEmailDescription:
      "Falls ein Konto für diese Adresse existiert, haben wir einen sicheren Link zum Zurücksetzen Ihres Passworts gesendet.",
    emailSentTo: "Gesendet an:",
    spamHint:
      "Sie sehen die E-Mail nicht? Prüfen Sie bitte Ihren Spam- oder Junk-Ordner.",
    closePageHint:
      "Öffnen Sie den Link, um ein neues Passwort festzulegen. Sie können diese Seite nun schließen.",
  },
  recovery: {
    title: "Legen Sie Ihr Passwort fest",
    activatingLink: "Wiederherstellungslink wird aktiviert...",
    pleaseSetPassword: "Bitte legen Sie Ihr Passwort fest",
    newPasswordLabel: "Neues Passwort",
    newPasswordPlaceholder: "Geben Sie Ihr neues Passwort ein",
    confirmPasswordLabel: "Passwort bestätigen",
    confirmPasswordPlaceholder: "Bestätigen Sie Ihr neues Passwort",
    setPasswordButton: "Passwort festlegen",
    settingPassword: "Passwort wird festgelegt...",
    mismatchedPasswords: "Passwörter stimmen nicht überein",
    passwordTooShort: "Das Passwort muss mindestens 8 Zeichen lang sein",
    passwordsDoNotMatch: "Die Passwörter stimmen nicht überein",
    invalidLink:
      "Ungültiger Wiederherstellungslink. Erforderliche Parameter fehlen (Flow oder Token).",
    invalidToken: "Der Wiederherstellungslink ist ungültig.",
    csrfTokenError:
      "CSRF-Token konnte nicht aus dem Einstellungs-Flow extrahiert werden",
    sessionExpired:
      "Sitzung abgelaufen. Bitte fordern Sie einen neuen Wiederherstellungslink an.",
    processingError:
      "Wiederherstellungslink konnte nicht verarbeitet werden. Bitte versuchen Sie es erneut.",
    failedToSetPassword: "Passwort konnte nicht festgelegt werden",
    passwordSetSuccess:
      "Passwort erfolgreich festgelegt! Weiterleitung zur Anmeldung...",
    requestNewLink:
      "Bitte fordern Sie einen neuen Link zum Zurücksetzen des Passworts an.",
    linkExpired: "Dieser Link ist abgelaufen oder wurde bereits verwendet.",
    linkExpiredOnly: "Dieser Link ist abgelaufen.",
    linkAlreadyUsed: "Dieser Link wurde bereits verwendet.",
    cookiesBlocked:
      "Ihr Browser blockiert Cookies, die diese Seite zur Anmeldung benötigt. Erlauben Sie Cookies für diese Website und öffnen Sie den Link erneut.",
    requestNewLinkButton: "Neuen Link anfordern",
    diagnosticsTitle: "Technische Details",
    diagnosticsCopy: "Details kopieren",
    diagnosticsCopied: "Kopiert",
    continuePrompt:
      "Bestätigen Sie unten, um die Einrichtung Ihres Kontos abzuschließen.",
    continueBody:
      "Ihr Link ist bereit. Bestätigen Sie, um Ihr Konto zu öffnen.",
    continueButton: "Weiter",
    conflictTitle: "Sie sind bereits angemeldet",
    conflictSignedInAs: "Angemeldet als",
    conflictBody:
      "Wurde dieser Link an eine andere Adresse gesendet, melden Sie sich zuerst ab — sonst ändern Sie das Passwort des oben genannten Kontos.",
    conflictUseLink: "Abmelden und Link öffnen",
    conflictContinue: "Mit diesem Konto fortfahren",
    conflictSignOutFailed:
      "Wir konnten Sie nicht abmelden. Melden Sie sich über das Menü ab und öffnen Sie den Link erneut.",
  },
  securitySettings: {
    title: "Sicherheitseinstellungen",
    subtitle:
      "Verwalten Sie Ihre Kontosicherheit und Multi-Faktor-Authentifizierung",
  },
  loginSuccess: "Erfolgreich angemeldet",
  logoutSuccess: "Erfolgreich abgemeldet",
  success: "Erfolg",
};
