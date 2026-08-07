/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { LeaveImpact } from './LeaveImpact';
/**
 * What leaving would cost, and nothing else. Identity and membership facts already came with the row this dialog was opened from.
 *
 */
export type LeaveTenantPreview = {
    /**
     * False while an impact of severity `decision` is unanswered.
     */
    canLeaveNow: boolean;
    /**
     * When the tenant-scoped data kept for a possible return would be purged if the caller leaves now. The membership row itself is never purged — it is what makes returning a reactivation.
     *
     */
    dormantUntil?: string;
    impacts: Array<LeaveImpact>;
};

