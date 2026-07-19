export default {
  error: "Error de autenticación",
  noAccess: {
    title: "Acceso requerido",
    subtitle: "Aún no tienes acceso a este tenant",
    message1:
      "Tu cuenta está autenticada, pero debes solicitar acceso a",
    message2: "para continuar.",
    message3:
      "Por favor, contacta a tu administrador para que te conceda acceso a este tenant.",
    signedInAs: "Conectado como",
    signOutButton: "Cerrar sesión",
    contactAdminButton: "Contactar al administrador",
    emailSubject: "Solicitud de acceso para {tenantName}",
    emailBody:
      "Hola,\n\nMe gustaría solicitar acceso a {tenantName}.\n\nMi correo electrónico: {userEmail}\n\nGracias.",
  },
  signIn: {
    title: "Iniciar sesión",
    subtitle: "Inicia sesión para acceder a tu cuenta",
    emailLabel: "Correo electrónico",
    passwordLabel: "Contraseña",
    loginButton: "Iniciar sesión",
    forgotPassword: "¿Olvidaste tu contraseña?",
    noAccount: "¿Aún no tienes una cuenta?",
    signUpLink: "Regístrate",
  },
  signUp: {
    title: "Registro",
    subtitle: "Crea tu cuenta",
    magicLinkSubtitle: "Introduce tus datos para empezar",
    nameLabel: "Nombre",
    nameRequired: "El nombre es obligatorio",
    emailLabel: "Correo electrónico",
    emailInvalid: "Por favor, introduce un correo electrónico válido",
    continueButton: "Continuar",
    haveAccount: "¿Ya tienes una cuenta?",
    signInLink: "Inicia sesión",
    disabled: "El registro está desactivado",
    checkEmail: "Revisa tu correo electrónico",
    universalMessage:
      "Hemos enviado un enlace seguro o un código si este correo electrónico está asociado a una cuenta.",
    emailSentTo: "Enviado a:",
    nextSteps: "Qué hacer a continuación:",
    step1: "Revisa tu bandeja de entrada",
    step2: "Haz clic en el enlace seguro que te hemos enviado",
    step3:
      "Iniciarás sesión automáticamente y podrás establecer tu contraseña",
    changeEmail: "¿Introdujiste el correo electrónico incorrecto?",
    backToSignIn: "Volver al inicio de sesión",
    secureExplainer:
      "Te enviaremos un enlace seguro para continuar. No necesitas contraseña — el enlace te permite establecer tu contraseña una vez que hayas entrado.",
    spamHint:
      "¿No ves el correo? Revisa tu carpeta de spam o correo no deseado.",
    notifications: {
      validationError: "Por favor, verifica tus datos.",
      error: "Algo salió mal. Por favor, inténtalo de nuevo.",
    },
  },
  emailVerification: {
    loading: {
      title: "Verificando tu correo electrónico...",
      subtitle:
        "Por favor, espera mientras confirmamos tu dirección de correo electrónico.",
    },
    success: {
      title: "¡Correo electrónico verificado con éxito!",
      subtitle:
        "Tu dirección de correo electrónico ha sido confirmada. Ahora tienes acceso completo a tu cuenta.",
      continueButton: "Continuar al panel de control",
      signInButton: "Iniciar sesión",
    },
    error: {
      title: "La verificación ha fallado",
      noToken:
        "No se ha proporcionado ningún token de verificación. Por favor, verifica el enlace en tu correo electrónico.",
      network: "Error de red. Por favor, verifica tu conexión e inténtalo de nuevo.",
      resendHelpText: "¿Necesitas un nuevo enlace de verificación?",
      resendButton: "Reenviar el correo de verificación",
      resending: "Enviando...",
      resendCooldown: "Reenviar en {seconds}s",
      backToSignIn: "Volver al inicio de sesión",
      contactSupport: "Contactar al soporte",
    },
    expired: {
      title: "Enlace de verificación caducado",
      subtitle:
        "Este enlace de verificación ha caducado por motivos de seguridad. Los enlaces de verificación son válidos durante 24 horas.",
      getNewLinkButton: "Obtener un nuevo enlace de verificación",
      backToSignIn: "Volver al inicio de sesión",
    },
    toasts: {
      success: "¡Correo electrónico verificado con éxito!",
      resendSuccess:
        "¡Correo de verificación enviado! Por favor, revisa tu bandeja de entrada.",
      networkError: "Error de red. Por favor, inténtalo de nuevo.",
    },
  },
  passwordReset: {
    title: "Restablecer la contraseña",
    emailLabel: "Correo electrónico",
    newPasswordLabel: "Nueva contraseña",
    resetButton: "Restablecer la contraseña",
    sending: "Enviando...",
    emailSent: "Correo de restablecimiento de contraseña enviado",
    emailSentDescription:
      "Por favor, revisa tu correo electrónico para las instrucciones de restablecimiento de contraseña.",
    error: "Error al enviar el correo de restablecimiento de contraseña",
    success: "Contraseña restablecida con éxito",
    checkEmailTitle: "Revisa tu correo electrónico",
    checkEmailDescription:
      "Si existe una cuenta para esta dirección, te hemos enviado un enlace seguro para restablecer tu contraseña.",
    emailSentTo: "Enviado a:",
    spamHint:
      "¿No ves el correo? Revisa tu carpeta de spam o correo no deseado.",
    closePageHint:
      "Abre el enlace para establecer una nueva contraseña. Ya puedes cerrar esta página.",
  },
  recovery: {
    title: "Establecer tu contraseña",
    activatingLink: "Activando el enlace de recuperación...",
    pleaseSetPassword: "Por favor, establece tu contraseña",
    newPasswordLabel: "Nueva contraseña",
    newPasswordPlaceholder: "Introduce tu nueva contraseña",
    confirmPasswordLabel: "Confirmar la contraseña",
    confirmPasswordPlaceholder: "Confirma tu nueva contraseña",
    setPasswordButton: "Establecer la contraseña",
    settingPassword: "Estableciendo la contraseña...",
    mismatchedPasswords: "Las contraseñas no coinciden",
    passwordTooShort: "La contraseña debe tener al menos 8 caracteres",
    passwordsDoNotMatch: "Las contraseñas no coinciden",
    invalidLink:
      "Enlace de recuperación inválido. Faltan parámetros requeridos (flujo o token).",
    invalidToken: "El enlace de recuperación es inválido.",
    csrfTokenError: "Error al extraer el token CSRF del flujo de parámetros",
    sessionExpired:
      "Sesión caducada. Por favor, solicita un nuevo enlace de recuperación.",
    processingError:
      "Error al procesar el enlace de recuperación. Por favor, inténtalo de nuevo.",
    failedToSetPassword: "Error al establecer la contraseña",
    passwordSetSuccess:
      "¡Contraseña establecida con éxito! Redirigiendo al inicio de sesión...",
    requestNewLink:
      "Por favor, solicita un nuevo enlace de restablecimiento de contraseña.",
  },
  securitySettings: {
    title: "Configuración de seguridad",
    subtitle:
      "Gestiona la seguridad de tu cuenta y la autenticación multifactor",
  },
  loginSuccess: "Inicio de sesión exitoso",
  logoutSuccess: "Cierre de sesión exitoso",
  success: "Éxito",
};
