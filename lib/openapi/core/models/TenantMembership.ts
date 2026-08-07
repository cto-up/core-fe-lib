/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { Role } from './Role';
import type { TenantFeatureLicenses } from './TenantFeatureLicenses';
/**
 * One row of core_user_tenant_memberships joined to its tenant. Field names are snake_case because this payload predates its spec — it is the sqlc row, serialized as-is, and a live SPA already reads it. Renaming is a separate, breaking decision.
 *
 */
export type TenantMembership = {
    id: string;
    user_id: string;
    tenant_id: string;
    /**
     * `inactive` is a membership that ended — left or removed. The row is kept because reactivating it is what restores a returning member's history.
     *
     */
    status: TenantMembership.status;
    invited_by?: string | null;
    invited_at?: string | null;
    /**
     * Null while pending — only an accepted membership has joined.
     */
    joined_at?: string | null;
    created_at?: string;
    updated_at?: string;
    roles?: Array<Role>;
    feature_licenses?: TenantFeatureLicenses;
    tenant_name: string;
    subdomain: string;
};
export namespace TenantMembership {
    /**
     * `inactive` is a membership that ended — left or removed. The row is kept because reactivating it is what restores a returning member's history.
     *
     */
    export enum status {
        ACTIVE = 'active',
        PENDING = 'pending',
        INACTIVE = 'inactive',
        REJECTED = 'rejected',
    }
}

