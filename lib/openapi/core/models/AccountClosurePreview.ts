/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { TenantClosureImpact } from './TenantClosureImpact';
/**
 * One entry per active membership. Closing ends them all, so the caller is shown every organization's cost at once rather than discovering them one at a time after the fact.
 *
 */
export type AccountClosurePreview = {
    tenants: Array<TenantClosureImpact>;
};

