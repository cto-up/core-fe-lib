/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Contributed by the module that owns the data. Core cannot enumerate it, so `key` is open-ended.
 *
 */
export type LeaveImpact = {
    /**
     * Module that contributed this impact, e.g. `lms`.
     */
    module?: string;
    /**
     * Stable identifier used as a translation key by the SPA, e.g. `lms.enrollments`, `lms.authoredPublishedCourses`, `lms.activeSubscription`.
     *
     */
    key: string;
    /**
     * Fallback text for a key the SPA has no translation for.
     */
    label?: string;
    count?: number;
    /**
     * `info` is stated in the dialog. `decision` must be resolved by a matching entry in LeaveTenantRequest.decisions.
     *
     */
    severity: LeaveImpact.severity;
    /**
     * Actions this decision accepts, in the order to offer them.
     */
    actions?: Array<'transfer' | 'keep' | 'unpublish' | 'cancelAtPeriodEnd'>;
};
export namespace LeaveImpact {
    /**
     * `info` is stated in the dialog. `decision` must be resolved by a matching entry in LeaveTenantRequest.decisions.
     *
     */
    export enum severity {
        INFO = 'info',
        DECISION = 'decision',
    }
}

