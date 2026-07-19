export default {
  title: "Multi-Faktor-Authentifizierung",
  subtitle: "Verwalten Sie Ihre Kontosicherheit und Multi-Faktor-Authentifizierung",
  currentLevel: "Aktuelle Sicherheitsstufe",
  levelStandard: "Standard",
  levelEnhanced: "Erhöht (MFA aktiv)",
  methods: {
    authenticator: "Authenticator-App",
    securityKey: "Sicherheitsschlüssel",
    recoveryCode: "Wiederherstellungscode",
    totp: {
      title: "Authenticator-App (TOTP)",
      description: "Verwenden Sie Apps wie Google Authenticator, Authy oder 1Password",
      setup: "Authenticator-App einrichten",
      disable: "TOTP deaktivieren",
      enabled: "Aktiviert",
      disabled: "Deaktiviert",
    },
    webauthn: {
      title: "Sicherheitsschlüssel (WebAuthn)",
      description: "Verwenden Sie Hardware-Schlüssel wie YubiKey oder integrierte Biometrie",
      setup: "Sicherheitsschlüssel einrichten",
      disable: "Sicherheitsschlüssel deaktivieren",
      enabled: "Aktiviert",
      disabled: "Deaktiviert",
    },
    recovery: {
      title: "Wiederherstellungscodes",
      description: "Verwenden Sie diese Codes, wenn Sie den Zugriff auf Ihr MFA-Gerät verlieren",
      generate: "Codes generieren",
      regenerate: "Codes neu generieren",
      generated: "Generiert",
      notGenerated: "Nicht generiert",
    },
  },
  setup: {
    totp: {
      title: "Authenticator-App einrichten",
      scanQR: "Scannen Sie diesen QR-Code mit Ihrer Authenticator-App:",
      manualEntry: "Oder geben Sie diesen Schlüssel manuell ein:",
      enterCode: "Geben Sie den 6-stelligen Code aus Ihrer Authenticator-App ein:",
      codePlaceholder: "000000",
      invalidCode: "Ungültiger Code. Bitte versuchen Sie es erneut.",
      cancel: "Abbrechen",
      next: "Weiter",
      verify: "Verifizieren & aktivieren",
    },
    webauthn: {
      title: "Registrierung des Sicherheitsschlüssels",
      description: "Bitte folgen Sie den Anweisungen, um Ihren Sicherheitsschlüssel zu registrieren",
      processing: "Ihr Sicherheitsschlüssel wird registriert...",
      ready: "Bereit, Ihren Sicherheitsschlüssel zu registrieren",
      success: "Sicherheitsschlüssel erfolgreich registriert. Weiterleitung...",
    },
    recovery: {
      title: "Wiederherstellungscodes",
      warning:
        "Wichtig: Bewahren Sie diese Codes an einem sicheren Ort auf. Jeder Code kann nur einmal verwendet werden.",
      warningTitle: "Warten Sie! Verlieren Sie nicht den Zugriff auf Ihr Konto",
      warningMessage:
        "Wenn Sie Ihr Telefon verlieren, werden Sie ausgesperrt. Bewahren Sie diese Wiederherstellungscodes an einem sicheren Ort auf. Jeder Code kann nur einmal verwendet werden.",
      download: "Herunterladen",
      copy: "Kopieren",
      saved: "Ich habe sie gespeichert",
      confirm: "Ich habe diese Codes gespeichert",
      interactionHint: "Sie müssen die Codes kopieren oder herunterladen, um fortzufahren",
    },
  },
  notifications: {
    loadError: "MFA-Einstellungen konnten nicht geladen werden",
    totpEnabled: "TOTP erfolgreich aktiviert",
    totpAlreadyEnabled: "TOTP bereits aktiviert",
    totpAlreadyEnabledDesc:
      "Sie haben die TOTP-Authentifizierung bereits aktiviert. Um ein neues Gerät einzurichten, deaktivieren Sie bitte zuerst TOTP und richten Sie es dann erneut ein.",
    setupComplete:
      "Die Zwei-Faktor-Authentifizierung ist nun aktiv. Ihre Wiederherstellungscodes wurden gespeichert.",
    totpDisabled: "TOTP erfolgreich deaktiviert",
    totpSetupError: "TOTP-Einrichtung konnte nicht initialisiert werden",
    totpDisableError: "TOTP konnte nicht deaktiviert werden",
    webauthnEnabled: "Sicherheitsschlüssel erfolgreich registriert",
    webauthnDisabled: "Sicherheitsschlüssel erfolgreich deaktiviert",
    webauthnError: "Sicherheitsschlüssel konnte nicht registriert werden",
    webauthnDisableError: "Sicherheitsschlüssel konnte nicht deaktiviert werden",
    recoveryGenerated: "Wiederherstellungscodes erfolgreich generiert",
    recoveryError: "Wiederherstellungscodes konnten nicht generiert werden",
    recoveryCopied: "Wiederherstellungscodes in die Zwischenablage kopiert",
    setupError: "Einrichtung konnte nicht abgeschlossen werden. Bitte versuchen Sie es erneut.",
    verificationError: "Verifizierung fehlgeschlagen",
    verificationErrorDesc:
      "Verifizierung konnte nicht initialisiert werden. Bitte versuchen Sie es erneut oder kontaktieren Sie den Support.",
    verificationSuccess: "Verifizierung erfolgreich",
    verificationSuccessDesc:
      "Ihre Identität wurde verifiziert. Sie können nun fortfahren.",
    verificationCancelled: "Verifizierung abgebrochen",
    verificationCancelledDesc:
      "Der Vorgang wurde abgebrochen. Bitte versuchen Sie es erneut, wenn Sie bereit sind.",
    noMethodsAvailable: "Keine MFA-Methoden verfügbar",
    noMethodsAvailableDesc:
      "Sie haben keine MFA-Methoden konfiguriert. Bitte richten Sie zuerst MFA ein.",
  },
  confirmations: {
    disableTotp: "Möchten Sie die TOTP-Authentifizierung wirklich deaktivieren?",
    disableTotpDescription:
      "Dadurch wird die Zwei-Faktor-Authentifizierung von Ihrem Konto entfernt. Sie können sie jederzeit erneut einrichten.",
    disableWebauthn: "Möchten Sie Ihren Sicherheitsschlüssel wirklich deaktivieren?",
    disableWebauthnDescription:
      "Dadurch wird Ihr Sicherheitsschlüssel von Ihrem Konto entfernt. Sie können jederzeit einen neuen Schlüssel registrieren.",
    cancelRecoveryCodes:
      "Sie haben Ihre Wiederherstellungscodes noch nicht gespeichert. Wenn Sie dieses Fenster schließen, müssen Sie sie neu generieren. Möchten Sie wirklich abbrechen?",
    cancelRecoveryCodesDescription:
      "Diese Codes sind Ihre Backup-Zugriffsmethode. Ohne sie könnten Sie den Zugriff auf Ihr Konto verlieren, wenn Sie Ihr Authentifizierungsgerät verlieren.",
  },
  aal2: {
    title: "Zusätzliche Verifizierung erforderlich",
    description:
      "Diese Aktion erfordert eine zusätzliche Sicherheitsverifizierung. Bitte verifizieren Sie Ihre Identität mit einer Ihrer konfigurierten Authentifizierungsmethoden.",
    selectMethod: "Verifizierungsmethode wählen:",
    methodTotp: "Authenticator-App",
    methodRecovery: "Wiederherstellungscode",
    methodWebauthn: "Sicherheitsschlüssel",
    webauthnComingSoon: "Verifizierung per Sicherheitsschlüssel folgt in Kürze",
    useRecoveryCode: "Stattdessen einen Wiederherstellungscode verwenden",
    useAuthenticator: "Stattdessen die Authenticator-App verwenden",
    totpHint: "Geben Sie den 6-stelligen Code aus Ihrer Authenticator-App ein",
    webauthnHint: "Stecken Sie Ihren Sicherheitsschlüssel ein und folgen Sie den Anweisungen",
    recoveryHint: "Geben Sie einen Ihrer Backup-Wiederherstellungscodes ein",
    webauthnTitle: "Verifizierung des Sicherheitsschlüssels",
    webauthnDescription: "Bitte verwenden Sie Ihren Sicherheitsschlüssel, um Ihre Identität zu verifizieren",
    webauthnProcessing: "Ihr Sicherheitsschlüssel wird verifiziert...",
    webauthnReady: "Bereit zur Verifizierung mit Ihrem Sicherheitsschlüssel",
    noMfaRegistered:
      "Sie müssen eine höhere Authentifizierungsstufe registrieren, um auf diese Funktion zuzugreifen. Bitte gehen Sie zu den Sicherheitseinstellungen, um die Multi-Faktor-Authentifizierung einzurichten.",
    goToSecuritySettings: "Sicherheitseinstellungen öffnen",
    sessionRefreshRequired:
      "Ihre Sitzung ist zu alt, um diese Aktion durchzuführen. Bitte melden Sie sich erneut an, um fortzufahren.",
    logout: "Abmelden",
  },
  recovery: {
    enterCode: "Wiederherstellungscode eingeben",
    invalidCode: "Ungültiger Wiederherstellungscode. Bitte versuchen Sie es erneut.",
  },
};
