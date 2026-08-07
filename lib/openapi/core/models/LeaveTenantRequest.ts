/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { LeaveDecision } from './LeaveDecision';
export type LeaveTenantRequest = {
    /**
     * One entry per impact the preview reported with severity `decision`. Absent or incomplete, the leave is refused with 409 and the current preview.
     *
     */
    decisions?: Array<LeaveDecision>;
    /**
     * Optional, free text. Product feedback only; never gates the leave.
     */
    reason?: string;
};

