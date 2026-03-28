/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type NewTenant = {
    name: string;
    subdomain: string;
    /**
     * Auth Provider setting to Enable email link sign in (TODO is really used?)
     */
    enable_email_link_sign_in: boolean;
    /**
     * Auth Provider setting to Allow password sign up (can skip)
     */
    allow_password_sign_up: boolean;
    /**
     * Allow users to sign up for this tenant
     */
    allow_sign_up: boolean;
    is_reseller?: boolean;
    reseller_id?: string | null;
    /**
     * Optional contract expiry date. When reached, the tenant is automatically disabled.
     */
    contract_end_date?: string | null;
    /**
     * When true, all API requests for this tenant are rejected with 403.
     */
    is_disabled?: boolean;
};

