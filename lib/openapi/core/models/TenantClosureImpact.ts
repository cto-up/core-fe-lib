/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { LeaveImpact } from './LeaveImpact';
export type TenantClosureImpact = {
    /**
     * Named in the response, never in a request: it identifies which answer belongs to which organization, not which tenant the call acts on.
     *
     */
    tenantId: string;
    tenantName: string;
    subdomain?: string;
    impacts: Array<LeaveImpact>;
};

