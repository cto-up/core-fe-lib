export default {
  title: "Multi-Factor Authentication",
  subtitle: "Manage your account security and multi-factor authentication",
  currentLevel: "Current Security Level",
  levelStandard: "Standard",
  levelEnhanced: "Enhanced (MFA Active)",
  methods: {
    authenticator: "Authenticator App",
    securityKey: "Security Key",
    recoveryCode: "Recovery Code",
    totp: {
      title: "Authenticator App (TOTP)",
      description: "Use apps like Google Authenticator, Authy, or 1Password",
      setup: "Set Up Authenticator App",
      disable: "Disable TOTP",
      enabled: "Enabled",
      disabled: "Disabled",
    },
    webauthn: {
      title: "Security Key (WebAuthn)",
      description: "Use hardware keys like YubiKey or built-in biometrics",
      setup: "Set Up Security Key",
      disable: "Disable Security Key",
      enabled: "Enabled",
      disabled: "Disabled",
    },
    recovery: {
      title: "Recovery Codes",
      description: "Use these codes if you lose access to your MFA device",
      generate: "Generate Codes",
      regenerate: "Regenerate Codes",
      generated: "Generated",
      notGenerated: "Not Generated",
    },
  },
  setup: {
    totp: {
      title: "Set Up Authenticator App",
      scanQR: "Scan this QR code with your authenticator app:",
      manualEntry: "Or enter this key manually:",
      enterCode: "Enter the 6-digit code from your authenticator app:",
      codePlaceholder: "000000",
      invalidCode: "Invalid code. Please try again.",
      cancel: "Cancel",
      next: "Next",
      verify: "Verify & Enable",
    },
    webauthn: {
      title: "Security Key Registration",
      description: "Please follow the prompts to register your security key",
      processing: "Registering your security key...",
      ready: "Ready to register your security key",
      success: "Security key registered successfully. Redirecting...",
    },
    recovery: {
      title: "Recovery Codes",
      warning:
        "Important: Save these codes in a safe place. Each code can only be used once.",
      warningTitle: "Wait! Don't lose access to your account",
      warningMessage:
        "If you lose your phone, you'll be locked out. Save these recovery codes in a safe place. Each code can only be used once.",
      download: "Download",
      copy: "Copy",
      saved: "I've Saved Them",
      confirm: "I Have Saved These Codes",
      interactionHint: "You must copy or download the codes to continue",
    },
  },
  notifications: {
    loadError: "Failed to load MFA settings",
    totpEnabled: "TOTP enabled successfully",
    totpAlreadyEnabled: "TOTP Already Enabled",
    totpAlreadyEnabledDesc:
      "You already have TOTP authentication enabled. To set up a new device, please disable TOTP first, then set it up again.",
    setupComplete:
      "Two-factor authentication is now active. Your recovery codes have been saved.",
    totpDisabled: "TOTP disabled successfully",
    totpSetupError: "Failed to initialize TOTP setup",
    totpDisableError: "Failed to disable TOTP",
    webauthnEnabled: "Security key registered successfully",
    webauthnDisabled: "Security key disabled successfully",
    webauthnError: "Failed to register security key",
    webauthnDisableError: "Failed to disable security key",
    recoveryGenerated: "Recovery codes generated successfully",
    recoveryError: "Failed to generate recovery codes",
    recoveryCopied: "Recovery codes copied to clipboard",
    setupError: "Failed to complete setup. Please try again.",
    verificationError: "Verification Failed",
    verificationErrorDesc:
      "Unable to initialize verification. Please try again or contact support.",
    verificationSuccess: "Verification Successful",
    verificationSuccessDesc:
      "Your identity has been verified. You can now proceed.",
    verificationCancelled: "Verification Cancelled",
    verificationCancelledDesc:
      "The operation was cancelled. Please try again when ready.",
    noMethodsAvailable: "No MFA Methods Available",
    noMethodsAvailableDesc:
      "You don't have any MFA methods configured. Please set up MFA first.",
  },
  confirmations: {
    disableTotp: "Are you sure you want to disable TOTP authentication?",
    disableTotpDescription:
      "This will remove two-factor authentication from your account. You can set it up again at any time.",
    disableWebauthn: "Are you sure you want to disable your security key?",
    disableWebauthnDescription:
      "This will remove your security key from your account. You can register a new key at any time.",
    cancelRecoveryCodes:
      "You haven't saved your recovery codes yet. If you close this window, you'll need to regenerate them. Are you sure you want to cancel?",
    cancelRecoveryCodesDescription:
      "These codes are your backup access method. Without them, you could lose access to your account if you lose your authentication device.",
  },
  aal2: {
    title: "Additional Verification Required",
    description:
      "This action requires additional security verification. Please verify your identity using one of your configured authentication methods.",
    selectMethod: "Choose verification method:",
    methodTotp: "Authenticator App",
    methodRecovery: "Recovery Code",
    methodWebauthn: "Security Key",
    webauthnComingSoon: "Security key verification coming soon",
    useRecoveryCode: "Use a recovery code instead",
    useAuthenticator: "Use authenticator app instead",
    totpHint: "Enter the 6-digit code from your authenticator app",
    webauthnHint: "Insert your security key and follow the prompts",
    recoveryHint: "Enter one of your backup recovery codes",
    webauthnTitle: "Security Key Verification",
    webauthnDescription: "Please use your security key to verify your identity",
    webauthnProcessing: "Verifying your security key...",
    webauthnReady: "Ready to verify with your security key",
    noMfaRegistered:
      "You need to register a higher level of authentication to access this feature. Please go to Security Settings to set up multi-factor authentication.",
    goToSecuritySettings: "Open Security Settings",
    sessionRefreshRequired:
      "Your session is too old to perform this action. Please sign in again to continue.",
    logout: "Sign Out",
  },
  recovery: {
    enterCode: "Enter recovery code",
    invalidCode: "Invalid recovery code. Please try again.",
  },
};
