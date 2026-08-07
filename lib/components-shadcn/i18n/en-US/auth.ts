export default {
  error: "Authentication Error",
  noAccess: {
    title: "Access Required",
    subtitle: "You don't have access to this tenant yet",
    message1:
      "Your account is authenticated, but you need to request access to",
    message2: "to continue.",
    message3:
      "Please contact your administrator to grant you access to this tenant.",
    signedInAs: "Signed in as",
    signOutButton: "Sign Out",
    contactAdminButton: "Contact Administrator",
    emailSubject: "Access Request for {tenantName}",
    emailBody:
      "Hello,\n\nI would like to request access to {tenantName}.\n\nMy email: {userEmail}\n\nThank you.",
  },
  alreadySignedIn: {
    title: "You're already signed in",
    subtitle: "This browser already has an active session.",
    signedInAs: "Signed in as",
    continueButton: "Continue",
    switchButton: "Sign in as a different user",
    switching: "Signing out...",
    toastTitle: "Already signed in",
    toastDescription: "We've taken you back to where you left off.",
  },
  // Kratos redirects here (selfservice.flows.error.ui_url) when a flow
  // dies before it can render — expired, interrupted, or traits rejected.
  flowError: {
    title: "Sign-in could not be completed",
    subtitle: "Nothing was changed on your account.",
    generic: "The sign-in attempt expired or was interrupted. Starting again usually resolves it.",
    reference: "Reference",
    retry: "Back to sign-in",
  },
  signIn: {
    title: "Sign In",
    subtitle: "Sign in to access your account",
    emailLabel: "Email Address",
    passwordLabel: "Password",
    loginButton: "Login",
    forgotPassword: "Forgot Password?",
    noAccount: "Don't have an account yet?",
    signUpLink: "Sign up",
    // Social sign-in buttons are rendered from the Kratos login flow; the
    // provider name is substituted at runtime.
    continueWith: "Continue with {provider}",
    orContinueWith: "or",
    // Replaces Kratos's own wording for message 1010016 — an email that
    // already belongs to a password account. Reassure, don't report.
    linkAccount: "You already have an account with {email}. Enter your password once and we'll connect {provider} to it — next time, one click is enough.",
  },
  signUp: {
    title: "Sign Up",
    subtitle: "Create your account",
    magicLinkSubtitle: "Enter your details to get started",
    nameLabel: "Name",
    nameRequired: "Name is required",
    emailLabel: "Email Address",
    emailInvalid: "Please enter a valid email",
    continueButton: "Continue",
    haveAccount: "Already have an account?",
    signInLink: "Sign in",
    disabled: "Sign up is disabled",
    checkEmail: "Check Your Email",
    universalMessage:
      "We've sent a secure link or code if this email is associated with an account.",
    emailSentTo: "Sent to:",
    nextSteps: "What to do next:",
    step1: "Check your email inbox",
    step2: "Click the secure link we sent you",
    step3: "You'll be signed in automatically, and can set your password",
    changeEmail: "Entered the wrong email?",
    backToSignIn: "Back to sign in",
    secureExplainer:
      "We'll send you a secure link to continue. No password needed — the link lets you set your password once you're in.",
    spamHint: "Don't see the email? Check your spam or junk folder.",
    notifications: {
      validationError: "Please enter a valid email address.",
      error: "Something went wrong. Please try again.",
    },
  },
  emailVerification: {
    loading: {
      title: "Verifying your email...",
      subtitle: "Please wait while we confirm your email address.",
    },
    success: {
      title: "Email Verified Successfully!",
      subtitle:
        "Your email address has been confirmed. You now have full access to your account.",
      continueButton: "Continue to Dashboard",
      signInButton: "Sign In",
    },
    error: {
      title: "Verification Failed",
      noToken: "No verification token provided. Please check your email link.",
      network: "Network error. Please check your connection and try again.",
      resendHelpText: "Need a new verification link?",
      resendButton: "Resend Verification Email",
      resending: "Sending...",
      resendCooldown: "Resend in {seconds}s",
      backToSignIn: "Back to Sign In",
      contactSupport: "Contact Support",
    },
    expired: {
      title: "Verification Link Expired",
      subtitle:
        "This verification link has expired for security reasons. Verification links are valid for 24 hours.",
      getNewLinkButton: "Get New Verification Link",
      backToSignIn: "Back to Sign In",
    },
    toasts: {
      success: "Email verified successfully!",
      resendSuccess: "Verification email sent! Please check your inbox.",
      networkError: "Network error. Please try again.",
    },
  },
  passwordReset: {
    title: "Reset Password",
    emailLabel: "Email",
    newPasswordLabel: "New Password",
    resetButton: "Reset Password",
    sending: "Sending...",
    emailSent: "Password reset email sent",
    emailSentDescription:
      "Please check your email for password reset instructions.",
    error: "Failed to send password reset email",
    success: "Password reset successfully",
    checkEmailTitle: "Check your email",
    checkEmailDescription:
      "If an account exists for this address, we've sent a secure link to reset your password.",
    emailSentTo: "Sent to:",
    spamHint: "Don't see the email? Check your spam or junk folder.",
    closePageHint:
      "Open the link to set a new password. You can now close this page.",
  },
  recovery: {
    title: "Set Your Password",
    activatingLink: "Activating recovery link...",
    pleaseSetPassword: "Please set your password",
    newPasswordLabel: "New Password",
    newPasswordPlaceholder: "Enter your new password",
    confirmPasswordLabel: "Confirm Password",
    confirmPasswordPlaceholder: "Confirm your new password",
    setPasswordButton: "Set Password",
    settingPassword: "Setting Password...",
    mismatchedPasswords: "Mismatched Passwords",
    passwordTooShort: "Password must be at least 8 characters long",
    passwordsDoNotMatch: "Passwords do not match",
    invalidLink:
      "Invalid recovery link. Missing required parameters (flow or token).",
    invalidToken: "Recovery link is invalid.",
    csrfTokenError: "Failed to extract CSRF token from settings flow",
    sessionExpired: "Session expired. Please request a new recovery link.",
    processingError: "Failed to process recovery link. Please try again.",
    failedToSetPassword: "Failed to set password",
    passwordSetSuccess: "Password set successfully! Redirecting to sign in...",
    requestNewLink: "Please request a new password reset link.",
    linkExpired: "This link has expired or has already been used.",
    linkExpiredOnly: "This link has expired.",
    linkAlreadyUsed: "This link has already been used.",
    cookiesBlocked:
      "Your browser is blocking cookies, which this page needs to sign you in. Enable cookies for this site and open the link again.",
    requestNewLinkButton: "Request a new link",
    diagnosticsTitle: "Technical details",
    diagnosticsCopy: "Copy details",
    diagnosticsCopied: "Copied",
  },
  securitySettings: {
    title: "Security Settings",
    subtitle: "Manage your account security and multi-factor authentication",
  },
  loginSuccess: "Successfully signed in",
  logoutSuccess: "Successfully signed out",
  success: "Success",
};
