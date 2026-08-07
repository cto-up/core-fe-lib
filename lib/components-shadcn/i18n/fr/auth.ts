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
  alreadySignedIn: {
    title: "Vous êtes déjà connecté",
    subtitle: "Une session est déjà active dans ce navigateur.",
    signedInAs: "Connecté en tant que",
    continueButton: "Continuer",
    switchButton: "Se connecter avec un autre compte",
    switching: "Déconnexion...",
    toastTitle: "Déjà connecté",
    toastDescription: "Nous vous ramenons là où vous en étiez.",
  },
  // Kratos redirects here (selfservice.flows.error.ui_url) when a flow
  // dies before it can render — expired, interrupted, or traits rejected.
  flowError: {
    title: "Connexion impossible à finaliser",
    subtitle: "Aucune modification n'a été apportée à votre compte.",
    generic: "La tentative de connexion a expiré ou a été interrompue. Recommencer suffit généralement.",
    reference: "Référence",
    retry: "Retour à la connexion",
  },
  // Where a social sign-in round-trip lands: the identity exists, the
  // tenant membership is being attached. See ADR 039 in the lms repo.
  socialCallback: {
    working: { title: "Finalisation de la connexion", body: "Configuration de votre compte…" },
    denied: { title: "Cet espace est sur invitation", body: "Votre compte est bien connecté, mais cet espace n'accepte pas les inscriptions libres. Demandez une invitation à un administrateur." },
    failed: { title: "Connexion impossible à finaliser", body: "Votre compte a été créé, mais nous n'avons pas pu le rattacher à cet espace. Réessayez dans un instant." },
    backToSignIn: "Retour à la connexion",
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
    // Social sign-in buttons are rendered from the Kratos login flow; the
    // provider name is substituted at runtime.
    continueWith: "Continuer avec {provider}",
    orContinueWith: "ou",
    // Replaces Kratos's own wording for message 1010016 — an email that
    // already belongs to a password account. Reassure, don't report.
    linkAccount: "Vous avez déjà un compte avec {email}. Saisissez votre mot de passe une fois et nous y rattacherons {provider} — la prochaine fois, un clic suffira.",
  },
  signUp: {
    title: "Inscription",
    subtitle: "Créez votre compte",
    magicLinkSubtitle: "Saisissez vos informations pour commencer",
    nameLabel: "Nom",
    nameRequired: "Le nom est requis",
    emailLabel: "Adresse e-mail",
    emailInvalid: "Veuillez saisir une adresse e-mail valide",
    continueButton: "Continuer",
    haveAccount: "Vous avez déjà un compte ?",
    signInLink: "Connectez-vous",
    disabled: "L'inscription est désactivée",
    checkEmail: "Vérifiez votre e-mail",
    universalMessage:
      "Nous avons envoyé un lien sécurisé ou un code si cette adresse e-mail est associée à un compte.",
    emailSentTo: "Envoyé à :",
    nextSteps: "Que faire ensuite :",
    step1: "Consultez votre boîte de réception",
    step2: "Cliquez sur le lien sécurisé que nous vous avons envoyé",
    step3:
      "Vous serez connecté automatiquement et pourrez définir votre mot de passe",
    changeEmail: "Vous avez saisi la mauvaise adresse e-mail ?",
    backToSignIn: "Retour à la connexion",
    secureExplainer:
      "Nous vous enverrons un lien sécurisé pour continuer. Aucun mot de passe requis — le lien vous permet de définir votre mot de passe une fois connecté.",
    spamHint:
      "Vous ne voyez pas l'e-mail ? Pensez à vérifier votre dossier spam ou courrier indésirable.",
    notifications: {
      validationError: "Veuillez vérifier vos saisies.",
      error: "Une erreur s'est produite. Veuillez réessayer.",
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
    spamHint:
      "Vous ne voyez pas l'e-mail ? Pensez à vérifier votre dossier spam ou courrier indésirable.",
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
    linkExpired: "Ce lien a expiré ou a déjà été utilisé.",
    linkExpiredOnly: "Ce lien a expiré.",
    linkAlreadyUsed: "Ce lien a déjà été utilisé.",
    cookiesBlocked:
      "Votre navigateur bloque les cookies, dont cette page a besoin pour vous connecter. Autorisez les cookies pour ce site, puis rouvrez le lien.",
    requestNewLinkButton: "Demander un nouveau lien",
    diagnosticsTitle: "Détails techniques",
    diagnosticsCopy: "Copier les détails",
    diagnosticsCopied: "Copié",
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
