/**
 * AAL2 verification state
 */
export interface Aal2VerificationState {
  show: boolean;
  flowId: string | null;
  csrfToken: string;
  availableMethods: Array<"totp" | "webauthn" | "lookup_secret">;
  selectedMethod: "totp" | "webauthn" | "lookup_secret" | null;
  totpCode: string;
  lookupCode: string;
  error: string;
  loading: boolean;
  userEmail?: string;
  identityId?: string;
  webauthnChallenge?: string;
}

/**
 * State store interface used internally by Aal2Manager.
 * Not a public contract — each framework implements this
 * inline (e.g. closure-based adapter in Pinia store).
 */
export interface IStateStore<T> {
  getState(): T;
  setState(updates: Partial<T>): void;
}
