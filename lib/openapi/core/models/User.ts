/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { Role } from './Role';
import type { UserProfileSchema } from './UserProfileSchema';
export type User = {
    id: string;
    name: string;
    email: string;
    disabled?: boolean;
    email_verified?: boolean;
    profile?: UserProfileSchema;
    roles: Array<Role>;
    created_at?: string;
    /**
     * Membership status (active, inactive, etc.)
     */
    membership_status?: string | null;
    /**
     * Identity state at the auth provider — "active", "inactive", or "missing" when the provider answered and has no identity for this user (a row left behind by an earlier auth provider; nobody can sign in as it). Null means the provider could not be asked, which is not the same as "missing".
     */
    auth_state?: string | null;
    /**
     * When the user most recently authenticated, taken from the newest session the auth provider still holds. Null means no session on record — which after session pruning is not the same as "never signed in".
     */
    last_authenticated_at?: string | null;
};

