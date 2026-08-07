/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type AccountDeletionRequest = {
    /**
     * Must equal the caller's own email. Verified server-side — the typed confirmation is a real check, not a client-side speed bump.
     *
     */
    confirmEmail: string;
    reason?: string;
};

