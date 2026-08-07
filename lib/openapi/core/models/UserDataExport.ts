/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { TenantMembership } from './TenantMembership';
import type { User } from './User';
/**
 * Assembled by core from what it owns, plus one section per registered data contributor. Core cannot enumerate module data — `modules` is deliberately open, and its keys are the contributors that answered, which is also how a reader sees what the export covered.
 *
 */
export type UserDataExport = {
    exportedAt: string;
    user: User;
    memberships: Array<TenantMembership>;
    /**
     * Keyed by contributor name (`lms`, `aiemployee`, …). The shape of each value is the contributing module's business, not core's.
     *
     */
    modules: Record<string, any>;
};

