/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type AccountDeletion = {
    status: AccountDeletion.status;
    /**
     * When the caller asked for deletion.
     */
    scheduledAt?: string;
    /**
     * When the deletion executes. Until then the account can be recovered by signing in and cancelling; after it, nothing is recoverable.
     *
     */
    scheduledFor?: string;
    /**
     * Memberships that end with the account.
     */
    tenantsAffected?: number;
    /**
     * Whether GET /api/v1/users/me/export can still be called.
     */
    exportAvailable?: boolean;
};
export namespace AccountDeletion {
    export enum status {
        NONE = 'none',
        SCHEDULED = 'scheduled',
    }
}

