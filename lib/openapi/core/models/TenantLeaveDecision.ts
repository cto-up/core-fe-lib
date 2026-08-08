/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * A LeaveDecision bound to the organization it answers for.
 */
export type TenantLeaveDecision = {
    tenantId: string;
    key: string;
    action: TenantLeaveDecision.action;
    targetUserId?: string;
};
export namespace TenantLeaveDecision {
    export enum action {
        TRANSFER = 'transfer',
        KEEP = 'keep',
        UNPUBLISH = 'unpublish',
        CANCEL_AT_PERIOD_END = 'cancelAtPeriodEnd',
    }
}

