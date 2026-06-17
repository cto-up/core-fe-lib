/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * License info per feature for a tenant. Key is the feature name. Only features enabled in TenantFeatures should have an entry.
 */
export type TenantFeatureLicenses = Record<string, {
    /**
     * License code for the feature
     */
    code: string;
    /**
     * Optional license expiry date. When reached, the feature is automatically disabled. Omit or null for no expiry.
     */
    end_date?: string | null;
}>;
