/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * One answer to an impact the preview reported with severity `decision`.
 */
export type LeaveDecision = {
    /**
     * The impact key being answered, e.g. `lms.authoredPublishedCourses`.
     */
    key: string;
    action: LeaveDecision.action;
    /**
     * Required for `transfer` — the member the content moves to.
     */
    targetUserId?: string;
};
export namespace LeaveDecision {
    export enum action {
        TRANSFER = 'transfer',
        KEEP = 'keep',
        UNPUBLISH = 'unpublish',
        CANCEL_AT_PERIOD_END = 'cancelAtPeriodEnd',
    }
}

