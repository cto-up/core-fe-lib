/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { TenantLeaveDecision } from './TenantLeaveDecision';
export type AccountDeletionRequest = {
    /**
     * What to do with the content the caller owns, per organization. Stored with the schedule and applied at execution — not now, so cancelling leaves nothing to undo. Anything unanswered falls back to the owning module's policy.
     *
     */
    decisions?: Array<TenantLeaveDecision>;
    /**
     * Must equal the caller's own email. Verified server-side — the typed confirmation is a real check, not a client-side speed bump.
     *
     */
    confirmEmail: string;
    reason?: string;
};

