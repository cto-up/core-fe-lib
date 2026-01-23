/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type MFAStatus = {
    /**
     * Whether TOTP (Authenticator App) is enabled
     */
    totp_enabled: boolean;
    /**
     * Whether WebAuthn (Security Key) is enabled
     */
    webauthn_enabled: boolean;
    /**
     * Whether recovery codes have been generated
     */
    recovery_codes_set: boolean;
    /**
     * List of available MFA methods
     */
    available_methods: Array<string>;
    /**
     * Current Authenticator Assurance Level
     */
    aal: MFAStatus.aal;
};
export namespace MFAStatus {
    /**
     * Current Authenticator Assurance Level
     */
    export enum aal {
        AAL1 = 'aal1',
        AAL2 = 'aal2',
    }
}

