export default {
  title: "Autenticación multifactor",
  subtitle:
    "Gestiona la seguridad de tu cuenta y la autenticación multifactor",
  currentLevel: "Nivel de seguridad actual",
  levelStandard: "Estándar",
  levelEnhanced: "Reforzado (MFA activa)",
  methods: {
    authenticator: "Aplicación de autenticación",
    securityKey: "Llave de seguridad",
    recoveryCode: "Códigos de recuperación",
    totp: {
      title: "Aplicación de autenticación (TOTP)",
      description:
        "Usa aplicaciones como Google Authenticator, Authy o 1Password",
      setup: "Configurar la aplicación de autenticación",
      disable: "Desactivar TOTP",
      enabled: "Activado",
      disabled: "Desactivado",
    },
    webauthn: {
      title: "Llave de seguridad (WebAuthn)",
      description:
        "Usa llaves físicas como YubiKey o la biometría integrada",
      setup: "Configurar la llave de seguridad",
      manage: "Gestionar las llaves",
      enabled: "Activado",
      disabled: "Desactivado",
    },
    recovery: {
      title: "Códigos de recuperación",
      description:
        "Usa estos códigos si pierdes el acceso a tu dispositivo MFA",
      generate: "Generar los códigos",
      regenerate: "Regenerar los códigos",
      generated: "Generados",
      notGenerated: "No generados",
    },
  },
  setup: {
    totp: {
      title: "Configurar la aplicación de autenticación",
      scanQR: "Escanea este código QR con tu aplicación de autenticación:",
      manualEntry: "O introduce esta clave manualmente:",
      enterCode:
        "Introduce el código de 6 dígitos de tu aplicación de autenticación:",
      codePlaceholder: "000000",
      invalidCode: "Código inválido. Por favor, inténtalo de nuevo.",
      cancel: "Cancelar",
      next: "Siguiente",
      verify: "Verificar y activar",
    },
    webauthn: {
      title: "Registro de llave de seguridad",
      description:
        "Por favor, sigue las instrucciones para registrar tu llave de seguridad",
      processing: "Registrando tu llave de seguridad...",
      ready: "Listo para registrar tu llave de seguridad",
      success: "Llave de seguridad registrada con éxito. Redirigiendo...",
    },
    recovery: {
      title: "Códigos de recuperación",
      warning:
        "Importante: Guarda estos códigos en un lugar seguro. Cada código solo puede usarse una vez.",
      warningTitle: "¡Atención! No pierdas el acceso a tu cuenta",
      warningMessage:
        "Si pierdes tu teléfono, quedarás bloqueado. Guarda estos códigos de recuperación en un lugar seguro. Cada código solo puede usarse una vez.",
      download: "Descargar",
      copy: "Copiar",
      saved: "Los he guardado",
      confirm: "He guardado estos códigos",
      interactionHint:
        "Debes copiar o descargar los códigos para continuar",
    },
  },
  notifications: {
    loadError: "Error al cargar la configuración MFA",
    totpEnabled: "TOTP activado con éxito",
    totpAlreadyEnabled: "TOTP ya activado",
    totpAlreadyEnabledDesc:
      "Ya tienes la autenticación TOTP activada. Para configurar un nuevo dispositivo, primero desactiva TOTP y luego vuelve a configurarlo.",
    setupComplete:
      "La autenticación de dos factores ahora está activa. Tus códigos de recuperación han sido guardados.",
    totpDisabled: "TOTP desactivado con éxito",
    totpSetupError: "Error al inicializar la configuración TOTP",
    totpDisableError: "Error al desactivar TOTP",
    webauthnEnabled: "Llave de seguridad registrada con éxito",
    webauthnDisabled: "Llave de seguridad desactivada con éxito",
    webauthnError: "Error al registrar la llave de seguridad",
    webauthnDisableError: "Error al desactivar la llave de seguridad",
    recoveryGenerated: "Códigos de recuperación generados con éxito",
    recoveryError: "Error al generar los códigos de recuperación",
    recoveryCopied: "Códigos de recuperación copiados al portapapeles",
    setupError: "Error en la configuración. Por favor, inténtalo de nuevo.",
    verificationError: "Error en la verificación",
    verificationErrorDesc:
      "No se puede inicializar la verificación. Por favor, inténtalo de nuevo o contacta al soporte.",
    verificationSuccess: "Verificación exitosa",
    verificationSuccessDesc:
      "Tu identidad ha sido verificada. Ahora puedes continuar.",
    verificationCancelled: "Verificación cancelada",
    verificationCancelledDesc:
      "La operación ha sido cancelada. Por favor, inténtalo de nuevo cuando estés listo.",
    noMethodsAvailable: "Ningún método MFA disponible",
    noMethodsAvailableDesc:
      "No tienes ningún método MFA configurado. Por favor, configura MFA primero.",
  },
  confirmations: {
    disableTotp:
      "¿Estás seguro de que deseas desactivar la autenticación TOTP?",
    disableTotpDescription:
      "Esto eliminará la autenticación de dos factores de tu cuenta. Podrás volver a configurarla en cualquier momento.",
    disableWebauthn:
      "¿Estás seguro de que deseas desactivar tu llave de seguridad?",
    disableWebauthnDescription:
      "Esto eliminará tu llave de seguridad de tu cuenta. Podrás registrar una nueva llave en cualquier momento.",
    cancelRecoveryCodes:
      "Aún no has guardado tus códigos de recuperación. Si cierras esta ventana, tendrás que regenerarlos. ¿Estás seguro de que deseas cancelar?",
    cancelRecoveryCodesDescription:
      "Estos códigos son tu método de acceso de respaldo. Sin ellos, podrías perder el acceso a tu cuenta si pierdes tu dispositivo de autenticación.",
  },
  aal2: {
    title: "Verificación adicional requerida",
    description:
      "Esta acción requiere una verificación de seguridad adicional. Por favor, verifica tu identidad usando uno de tus métodos de autenticación configurados.",
    selectMethod: "Elige el método de verificación:",
    methodTotp: "Aplicación de autenticación",
    methodRecovery: "Código de recuperación",
    methodWebauthn: "Llave de seguridad",
    webauthnComingSoon: "Verificación por llave de seguridad disponible próximamente",
    useRecoveryCode: "Usar un código de recuperación en su lugar",
    useAuthenticator: "Usar la aplicación de autenticación en su lugar",
    totpHint:
      "Introduce el código de 6 dígitos de tu aplicación de autenticación",
    webauthnHint: "Inserta tu llave de seguridad y sigue las instrucciones",
    recoveryHint: "Introduce uno de tus códigos de recuperación de respaldo",
    webauthnTitle: "Verificación por llave de seguridad",
    webauthnDescription:
      "Por favor, usa tu llave de seguridad para verificar tu identidad",
    webauthnProcessing: "Verificando tu llave de seguridad...",
    webauthnReady: "Listo para verificar con tu llave de seguridad",
    noMfaRegistered:
      "Debes registrar un nivel de autenticación más alto para acceder a esta funcionalidad. Por favor, accede a la Configuración de seguridad para configurar la autenticación multifactor.",
    goToSecuritySettings: "Abrir la configuración de seguridad",
    sessionRefreshRequired:
      "Tu sesión es demasiado antigua para realizar esta acción. Por favor, vuelve a iniciar sesión para continuar.",
    logout: "Cerrar sesión",
  },
  recovery: {
    enterCode: "Introduce el código de recuperación",
    invalidCode: "Código de recuperación inválido. Por favor, inténtalo de nuevo.",
  },
};
