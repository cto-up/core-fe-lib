export default {
  title: "Authentification Multi-Facteurs",
  subtitle:
    "Gérez la sécurité de votre compte et l'authentification multi-facteurs",
  currentLevel: "Niveau de Sécurité Actuel",
  levelStandard: "Standard",
  levelEnhanced: "Renforcé (MFA Active)",
  methods: {
    authenticator: "Application d'Authentification",
    securityKey: "Clé de Sécurité",
    recoveryCode: "Codes de Récupération",
    totp: {
      title: "Application d'Authentification (TOTP)",
      description:
        "Utilisez des applications comme Google Authenticator, Authy ou 1Password",
      setup: "Configurer l'Application d'Authentification",
      disable: "Désactiver TOTP",
      enabled: "Activé",
      disabled: "Désactivé",
    },
    webauthn: {
      title: "Clé de Sécurité (WebAuthn)",
      description:
        "Utilisez des clés matérielles comme YubiKey ou la biométrie intégrée",
      setup: "Configurer la Clé de Sécurité",
      manage: "Gérer les Clés",
      enabled: "Activé",
      disabled: "Désactivé",
    },
    recovery: {
      title: "Codes de Récupération",
      description:
        "Utilisez ces codes si vous perdez l'accès à votre appareil MFA",
      generate: "Générer les Codes",
      regenerate: "Régénérer les Codes",
      generated: "Générés",
      notGenerated: "Non Générés",
    },
  },
  setup: {
    totp: {
      title: "Configurer l'Application d'Authentification",
      scanQR: "Scannez ce code QR avec votre application d'authentification :",
      manualEntry: "Ou entrez cette clé manuellement :",
      enterCode:
        "Entrez le code à 6 chiffres de votre application d'authentification :",
      codePlaceholder: "000000",
      invalidCode: "Code invalide. Veuillez réessayer.",
      cancel: "Annuler",
      next: "Suivant",
      verify: "Vérifier et Activer",
    },
    webauthn: {
      title: "Enregistrement de clé de sécurité",
      description:
        "Veuillez suivre les instructions pour enregistrer votre clé de sécurité",
      processing: "Enregistrement de votre clé de sécurité...",
      ready: "Prêt à enregistrer votre clé de sécurité",
      success: "Clé de sécurité enregistrée avec succès. Redirection...",
    },
    recovery: {
      title: "Codes de Récupération",
      warning:
        "Important : Conservez ces codes dans un endroit sûr. Chaque code ne peut être utilisé qu'une seule fois.",
      warningTitle: "Attention ! Ne perdez pas l'accès à votre compte",
      warningMessage:
        "Si vous perdez votre téléphone, vous serez bloqué. Enregistrez ces codes de récupération dans un endroit sûr. Chaque code ne peut être utilisé qu'une seule fois.",
      download: "Télécharger",
      copy: "Copier",
      saved: "Je les ai Sauvegardés",
      confirm: "J'ai Sauvegardé ces Codes",
      interactionHint:
        "Vous devez copier ou télécharger les codes pour continuer",
    },
  },
  notifications: {
    loadError: "Échec du chargement des paramètres MFA",
    totpEnabled: "TOTP activé avec succès",
    totpAlreadyEnabled: "TOTP Déjà Activé",
    totpAlreadyEnabledDesc:
      "Vous avez déjà l'authentification TOTP activée. Pour configurer un nouvel appareil, veuillez d'abord désactiver TOTP, puis le reconfigurer.",
    setupComplete:
      "L'authentification à deux facteurs est maintenant active. Vos codes de récupération ont été sauvegardés.",
    totpDisabled: "TOTP désactivé avec succès",
    totpSetupError: "Échec de l'initialisation de la configuration TOTP",
    totpDisableError: "Échec de la désactivation de TOTP",
    webauthnEnabled: "Clé de sécurité enregistrée avec succès",
    webauthnDisabled: "Clé de sécurité désactivée avec succès",
    webauthnError: "Échec de l'enregistrement de la clé de sécurité",
    webauthnDisableError: "Échec de la désactivation de la clé de sécurité",
    recoveryGenerated: "Codes de récupération générés avec succès",
    recoveryError: "Échec de la génération des codes de récupération",
    recoveryCopied: "Codes de récupération copiés dans le presse-papiers",
    setupError: "Échec de la configuration. Veuillez réessayer.",
    verificationError: "Échec de la vérification",
    verificationErrorDesc:
      "Impossible d'initialiser la vérification. Veuillez réessayer ou contacter le support.",
    verificationSuccess: "Vérification réussie",
    verificationSuccessDesc:
      "Votre identité a été vérifiée. Vous pouvez maintenant continuer.",
    verificationCancelled: "Vérification annulée",
    verificationCancelledDesc:
      "L'opération a été annulée. Veuillez réessayer lorsque vous êtes prêt.",
    noMethodsAvailable: "Aucune méthode MFA disponible",
    noMethodsAvailableDesc:
      "Vous n'avez aucune méthode MFA configurée. Veuillez configurer MFA d'abord.",
  },
  confirmations: {
    disableTotp:
      "Êtes-vous sûr de vouloir désactiver l'authentification TOTP ?",
    disableTotpDescription:
      "Cela supprimera l'authentification à deux facteurs de votre compte. Vous pourrez la reconfigurer à tout moment.",
    disableWebauthn:
      "Êtes-vous sûr de vouloir désactiver votre clé de sécurité ?",
    disableWebauthnDescription:
      "Cela supprimera votre clé de sécurité de votre compte. Vous pourrez enregistrer une nouvelle clé à tout moment.",
    cancelRecoveryCodes:
      "Vous n'avez pas encore sauvegardé vos codes de récupération. Si vous fermez cette fenêtre, vous devrez les régénérer. Êtes-vous sûr de vouloir annuler ?",
    cancelRecoveryCodesDescription:
      "Ces codes sont votre méthode d'accès de secours. Sans eux, vous pourriez perdre l'accès à votre compte si vous perdez votre appareil d'authentification.",
  },
  aal2: {
    title: "Vérification Supplémentaire Requise",
    description:
      "Cette action nécessite une vérification de sécurité supplémentaire. Veuillez vérifier votre identité en utilisant l'une de vos méthodes d'authentification configurées.",
    selectMethod: "Choisissez la méthode de vérification :",
    methodTotp: "Application d'Authentification",
    methodRecovery: "Code de Récupération",
    methodWebauthn: "Clé de Sécurité",
    webauthnComingSoon: "Vérification par clé de sécurité bientôt disponible",
    useRecoveryCode: "Utiliser un code de récupération à la place",
    useAuthenticator: "Utiliser l'application d'authentification à la place",
    totpHint:
      "Entrez le code à 6 chiffres de votre application d'authentification",
    webauthnHint: "Insérez votre clé de sécurité et suivez les instructions",
    recoveryHint: "Entrez l'un de vos codes de récupération de secours",
    webauthnTitle: "Vérification par Clé de Sécurité",
    webauthnDescription:
      "Veuillez utiliser votre clé de sécurité pour vérifier votre identité",
    webauthnProcessing: "Vérification de votre clé de sécurité...",
    webauthnReady: "Prêt à vérifier avec votre clé de sécurité",
    noMfaRegistered:
      "Vous devez enregistrer un niveau d'authentification plus élevé pour accéder à cette fonctionnalité. Veuillez accéder aux Paramètres de Sécurité pour configurer l'authentification multi-facteurs.",
    goToSecuritySettings: "Ouvrir les Paramètres de Sécurité",
    sessionRefreshRequired:
      "Votre session est trop ancienne pour effectuer cette action. Veuillez vous reconnecter pour continuer.",
    logout: "Se Déconnecter",
  },
  recovery: {
    enterCode: "Entrez le code de récupération",
    invalidCode: "Code de récupération invalide. Veuillez réessayer.",
  },
};
