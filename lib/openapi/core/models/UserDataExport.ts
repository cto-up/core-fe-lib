/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { TenantMembership } from './TenantMembership';
import type { User } from './User';
import type { UserDataExportFailure } from './UserDataExportFailure';
/**
 * Assembled by core from what it owns, plus one section per registered data contributor. Core cannot enumerate module data — `modules` is deliberately open, and its keys are the contributors that answered, which is also how a reader sees what the export covered.
 *
 */
export type UserDataExport = {
    exportedAt: string;
    user: User;
    memberships: Array<TenantMembership>;
    /**
     * Keyed by contributor name (`lms`, `agent`, …). The shape of each value is the contributing module's business, not core's.
     *
     */
    modules: Record<string, any>;
    /**
     * Contributors whose section could not be read for this export, with the reason. Present only when at least one failed: the export is then incomplete and says so, rather than silently missing a module.
     *
     */
    failedSections?: Array<UserDataExportFailure>;
};

