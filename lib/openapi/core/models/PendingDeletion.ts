/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type PendingDeletion = {
    userId: string;
    email: string;
    name: string;
    /**
     * closure_requested — a deletion is scheduled (by the holder, or by the inactivity rule when reason is "inactivity"); inactivity_warned — warned, closed unless they sign in.
     *
     */
    stage: PendingDeletion.stage;
    reason?: string | null;
    requestedAt?: string | null;
    warnedAt?: string | null;
    lastSeenAt?: string | null;
    /**
     * when the account is deleted if nothing changes
     */
    deletesOn: string;
    /**
     * the account's organizations — every one for a SUPER_ADMIN on a tenant-less host, else only the host tenant
     *
     */
    tenants: Array<string>;
};
export namespace PendingDeletion {
    /**
     * closure_requested — a deletion is scheduled (by the holder, or by the inactivity rule when reason is "inactivity"); inactivity_warned — warned, closed unless they sign in.
     *
     */
    export enum stage {
        CLOSURE_REQUESTED = 'closure_requested',
        INACTIVITY_WARNED = 'inactivity_warned',
    }
}

