/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type NewTenant = {
    name: string;
    subdomain: string;
    /**
     * Firebase setting to Enable email link sign in (can skip)
     */
    enable_email_link_sign_in: boolean;
    /**
     * Firebase setting to Allow password sign up (can skip)
     */
    allow_password_sign_up: boolean;
    /**
     * Allow users to sign up for this tenant
     */
    allow_sign_up: boolean;
};

