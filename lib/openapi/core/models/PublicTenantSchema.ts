/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { Tenant } from './Tenant';
import type { TenantFeatureLicenses } from './TenantFeatureLicenses';
import type { TenantFeatures } from './TenantFeatures';
import type { TenantProfile } from './TenantProfile';
export type PublicTenantSchema = (Tenant & {
    profile: TenantProfile;
    features: TenantFeatures;
    feature_licenses?: TenantFeatureLicenses;
});

