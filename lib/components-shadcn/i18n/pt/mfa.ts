export default {
  title: "Autenticação multifator",
  subtitle: "Faça a gestão da segurança da sua conta e da autenticação multifator",
  currentLevel: "Nível de segurança atual",
  levelStandard: "Padrão",
  levelEnhanced: "Reforçado (MFA ativo)",
  methods: {
    authenticator: "Aplicação de autenticação",
    securityKey: "Chave de segurança",
    recoveryCode: "Código de recuperação",
    totp: {
      title: "Aplicação de autenticação (TOTP)",
      description: "Utilize aplicações como o Google Authenticator, Authy ou 1Password",
      setup: "Configurar aplicação de autenticação",
      disable: "Desativar TOTP",
      enabled: "Ativado",
      disabled: "Desativado",
    },
    webauthn: {
      title: "Chave de segurança (WebAuthn)",
      description: "Utilize chaves de hardware como YubiKey ou biometria integrada",
      setup: "Configurar chave de segurança",
      disable: "Desativar chave de segurança",
      enabled: "Ativado",
      disabled: "Desativado",
    },
    recovery: {
      title: "Códigos de recuperação",
      description: "Utilize estes códigos se perder o acesso ao seu dispositivo MFA",
      generate: "Gerar códigos",
      regenerate: "Regenerar códigos",
      generated: "Gerado",
      notGenerated: "Não gerado",
    },
  },
  setup: {
    totp: {
      title: "Configurar aplicação de autenticação",
      scanQR: "Leia este código QR com a sua aplicação de autenticação:",
      manualEntry: "Ou introduza esta chave manualmente:",
      enterCode: "Introduza o código de 6 dígitos da sua aplicação de autenticação:",
      codePlaceholder: "000000",
      invalidCode: "Código inválido. Tente novamente.",
      cancel: "Cancelar",
      next: "Seguinte",
      verify: "Verificar e ativar",
    },
    webauthn: {
      title: "Registo de chave de segurança",
      description: "Siga as instruções para registar a sua chave de segurança",
      processing: "A registar a sua chave de segurança...",
      ready: "Pronto para registar a sua chave de segurança",
      success: "Chave de segurança registada com sucesso. A redirecionar...",
    },
    recovery: {
      title: "Códigos de recuperação",
      warning:
        "Importante: Guarde estes códigos num local seguro. Cada código só pode ser utilizado uma vez.",
      warningTitle: "Espere! Não perca o acesso à sua conta",
      warningMessage:
        "Se perder o telemóvel, ficará bloqueado. Guarde estes códigos de recuperação num local seguro. Cada código só pode ser utilizado uma vez.",
      download: "Transferir",
      copy: "Copiar",
      saved: "Já os guardei",
      confirm: "Guardei estes códigos",
      interactionHint: "Tem de copiar ou transferir os códigos para continuar",
    },
  },
  notifications: {
    loadError: "Falha ao carregar as definições de MFA",
    totpEnabled: "TOTP ativado com sucesso",
    totpAlreadyEnabled: "TOTP já está ativado",
    totpAlreadyEnabledDesc:
      "Já tem a autenticação TOTP ativada. Para configurar um novo dispositivo, desative primeiro o TOTP e volte a configurá-lo.",
    setupComplete:
      "A autenticação de dois fatores está agora ativa. Os seus códigos de recuperação foram guardados.",
    totpDisabled: "TOTP desativado com sucesso",
    totpSetupError: "Falha ao inicializar a configuração do TOTP",
    totpDisableError: "Falha ao desativar o TOTP",
    webauthnEnabled: "Chave de segurança registada com sucesso",
    webauthnDisabled: "Chave de segurança desativada com sucesso",
    webauthnError: "Falha ao registar a chave de segurança",
    webauthnDisableError: "Falha ao desativar a chave de segurança",
    recoveryGenerated: "Códigos de recuperação gerados com sucesso",
    recoveryError: "Falha ao gerar os códigos de recuperação",
    recoveryCopied: "Códigos de recuperação copiados para a área de transferência",
    setupError: "Falha ao concluir a configuração. Tente novamente.",
    verificationError: "Falha na verificação",
    verificationErrorDesc:
      "Não foi possível inicializar a verificação. Tente novamente ou contacte o suporte.",
    verificationSuccess: "Verificação bem-sucedida",
    verificationSuccessDesc:
      "A sua identidade foi verificada. Pode agora prosseguir.",
    verificationCancelled: "Verificação cancelada",
    verificationCancelledDesc:
      "A operação foi cancelada. Tente novamente quando estiver pronto.",
    noMethodsAvailable: "Sem métodos de MFA disponíveis",
    noMethodsAvailableDesc:
      "Não tem nenhum método de MFA configurado. Configure primeiro o MFA.",
  },
  confirmations: {
    disableTotp: "Tem a certeza de que pretende desativar a autenticação TOTP?",
    disableTotpDescription:
      "Isto irá remover a autenticação de dois fatores da sua conta. Pode voltar a configurá-la a qualquer momento.",
    disableWebauthn: "Tem a certeza de que pretende desativar a sua chave de segurança?",
    disableWebauthnDescription:
      "Isto irá remover a sua chave de segurança da sua conta. Pode registar uma nova chave a qualquer momento.",
    cancelRecoveryCodes:
      "Ainda não guardou os seus códigos de recuperação. Se fechar esta janela, terá de os regenerar. Tem a certeza de que pretende cancelar?",
    cancelRecoveryCodesDescription:
      "Estes códigos são o seu método de acesso de reserva. Sem eles, pode perder o acesso à sua conta se perder o seu dispositivo de autenticação.",
  },
  aal2: {
    title: "Verificação adicional necessária",
    description:
      "Esta ação requer uma verificação de segurança adicional. Verifique a sua identidade utilizando um dos seus métodos de autenticação configurados.",
    selectMethod: "Escolha o método de verificação:",
    methodTotp: "Aplicação de autenticação",
    methodRecovery: "Código de recuperação",
    methodWebauthn: "Chave de segurança",
    webauthnComingSoon: "Verificação por chave de segurança brevemente disponível",
    useRecoveryCode: "Utilizar um código de recuperação em alternativa",
    useAuthenticator: "Utilizar a aplicação de autenticação em alternativa",
    totpHint: "Introduza o código de 6 dígitos da sua aplicação de autenticação",
    webauthnHint: "Insira a sua chave de segurança e siga as instruções",
    recoveryHint: "Introduza um dos seus códigos de recuperação de reserva",
    webauthnTitle: "Verificação por chave de segurança",
    webauthnDescription: "Utilize a sua chave de segurança para verificar a sua identidade",
    webauthnProcessing: "A verificar a sua chave de segurança...",
    webauthnReady: "Pronto para verificar com a sua chave de segurança",
    noMfaRegistered:
      "Precisa de registar um nível superior de autenticação para aceder a esta funcionalidade. Aceda às Definições de segurança para configurar a autenticação multifator.",
    goToSecuritySettings: "Abrir Definições de segurança",
    sessionRefreshRequired:
      "A sua sessão é demasiado antiga para realizar esta ação. Inicie sessão novamente para continuar.",
    logout: "Terminar sessão",
  },
  recovery: {
    enterCode: "Introduza o código de recuperação",
    invalidCode: "Código de recuperação inválido. Tente novamente.",
  },
};
