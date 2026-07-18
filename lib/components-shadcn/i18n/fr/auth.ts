export default {
  error: "Erreur d'Authentification",
  noAccess: {
    title: "Accès Requis",
    subtitle: "Vous n'avez pas encore accès à ce tenant",
    message1:
      "Votre compte est authentifié, mais vous devez demander l'accès à",
    message2: "pour continuer.",
    message3:
      "Veuillez contacter votre administrateur pour vous accorder l'accès à ce tenant.",
    signedInAs: "Connecté en tant que",
    signOutButton: "Se déconnecter",
    contactAdminButton: "Contacter l'administrateur",
    emailSubject: "Demande d'accès pour {tenantName}",
    emailBody:
      "Bonjour,\n\nJe souhaiterais demander l'accès à {tenantName}.\n\nMon email : {userEmail}\n\nMerci.",
  },
  signIn: {
    title: "Connexion",
    subtitle: "Connectez-vous pour accéder à votre compte",
    emailLabel: "Adresse e-mail",
    passwordLabel: "Mot de passe",
    loginButton: "Se connecter",
    forgotPassword: "Mot de passe oublié ?",
    noAccount: "Vous n'avez pas encore de compte ?",
    signUpLink: "Inscrivez-vous",
  },
  signUp: {
    title: "Inscription",
    subtitle: "Créez votre compte",
    nameLabel: "Nom",
    nameRequired: "Le nom est requis",
    emailLabel: "Adresse e-mail",
    emailInvalid: "Veuillez saisir une adresse e-mail valide",
    passwordLabel: "Mot de passe",
    passwordMinLength: "Le mot de passe doit contenir au moins 6 caractères",
    passwordConfirmLabel: "Confirmez le mot de passe",
    passwordsNoMatch: "Les mots de passe ne correspondent pas",
    signUpButton: "S'inscrire",
    haveAccount: "Vous avez déjà un compte ?",
    signInLink: "Connectez-vous",
    disabled: "L'inscription est désactivée",
    notifications: {
      validationError: "Veuillez vérifier vos saisies.",
      success: "Inscription réussie ! Redirection...",
    },
  },
  emailVerification: {
    loading: {
      title: "Vérification de votre e-mail...",
      subtitle:
        "Veuillez patienter pendant que nous confirmons votre adresse e-mail.",
    },
    success: {
      title: "E-mail vérifié avec succès !",
      subtitle:
        "Votre adresse e-mail a été confirmée. Vous avez maintenant un accès complet à votre compte.",
      continueButton: "Continuer vers le tableau de bord",
      signInButton: "Se connecter",
    },
    error: {
      title: "La vérification a échoué",
      noToken:
        "Aucun jeton de vérification fourni. Veuillez vérifier le lien dans votre e-mail.",
      network: "Erreur réseau. Veuillez vérifier votre connexion et réessayer.",
      resendHelpText: "Besoin d'un nouveau lien de vérification ?",
      resendButton: "Renvoyer l'e-mail de vérification",
      resending: "Envoi en cours...",
      resendCooldown: "Renvoyer dans {seconds}s",
      backToSignIn: "Retour à la connexion",
      contactSupport: "Contacter le support",
    },
    expired: {
      title: "Lien de vérification expiré",
      subtitle:
        "Ce lien de vérification a expiré pour des raisons de sécurité. Les liens de vérification sont valides pendant 24 heures.",
      getNewLinkButton: "Obtenir un nouveau lien de vérification",
      backToSignIn: "Retour à la connexion",
    },
    toasts: {
      success: "E-mail vérifié avec succès !",
      resendSuccess:
        "E-mail de vérification envoyé ! Veuillez consulter votre boîte de réception.",
      networkError: "Erreur réseau. Veuillez réessayer.",
    },
  },
  passwordReset: {
    title: "Réinitialiser le mot de passe",
    emailLabel: "E-mail",
    newPasswordLabel: "Nouveau mot de passe",
    resetButton: "Réinitialiser le mot de passe",
    sending: "Envoi en cours...",
    emailSent: "E-mail de réinitialisation de mot de passe envoyé",
    emailSentDescription:
      "Veuillez vérifier votre e-mail pour les instructions de réinitialisation du mot de passe.",
    error: "Échec de l'envoi de l'e-mail de réinitialisation de mot de passe",
    success: "Mot de passe réinitialisé avec succès",
    checkEmailTitle: "Vérifiez votre e-mail",
    checkEmailDescription:
      "Si un compte existe pour cette adresse, nous vous avons envoyé un lien sécurisé pour réinitialiser votre mot de passe.",
    emailSentTo: "Envoyé à :",
    closePageHint:
      "Ouvrez le lien pour définir un nouveau mot de passe. Vous pouvez maintenant fermer cette page.",
  },
  recovery: {
    title: "Définir votre mot de passe",
    activatingLink: "Activation du lien de récupération...",
    pleaseSetPassword: "Veuillez définir votre mot de passe",
    newPasswordLabel: "Nouveau mot de passe",
    newPasswordPlaceholder: "Entrez votre nouveau mot de passe",
    confirmPasswordLabel: "Confirmer le mot de passe",
    confirmPasswordPlaceholder: "Confirmez votre nouveau mot de passe",
    setPasswordButton: "Définir le mot de passe",
    settingPassword: "Définition du mot de passe...",
    mismatchedPasswords: "Mots de passe incompatibles",
    passwordTooShort: "Le mot de passe doit contenir au moins 8 caractères",
    passwordsDoNotMatch: "Les mots de passe ne correspondent pas",
    invalidLink:
      "Lien de récupération invalide. Paramètres requis manquants (flux ou jeton).",
    invalidToken: "Le lien de récupération est invalide.",
    csrfTokenError: "Échec de l'extraction du jeton CSRF du flux de paramètres",
    sessionExpired:
      "Session expirée. Veuillez demander un nouveau lien de récupération.",
    processingError:
      "Échec du traitement du lien de récupération. Veuillez réessayer.",
    failedToSetPassword: "Échec de la définition du mot de passe",
    passwordSetSuccess:
      "Mot de passe défini avec succès ! Redirection vers la connexion...",
    requestNewLink:
      "Veuillez demander un nouveau lien de réinitialisation de mot de passe.",
  },
  securitySettings: {
    title: "Paramètres de Sécurité",
    subtitle:
      "Gérez la sécurité de votre compte et l'authentification multi-facteurs",
  },
  loginSuccess: "Connexion réussie",
  logoutSuccess: "Déconnexion réussie",
  success: "Succès",
};
