/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { MFAStatus } from '../models/MFAStatus';
import type { SettingsFlow } from '../models/SettingsFlow';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class MfaService {
    /**
     * Get MFA status
     * Get the current user's MFA configuration status
     * @returns MFAStatus MFA status retrieved successfully
     * @throws ApiError
     */
    public static getMfaStatus(): CancelablePromise<MFAStatus> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/mfa/status',
        });
    }
    /**
     * Initialize settings flow
     * Initialize a Kratos settings flow for MFA configuration
     * @returns SettingsFlow Settings flow initialized successfully
     * @throws ApiError
     */
    public static initializeSettingsFlow(): CancelablePromise<SettingsFlow> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/mfa/settings/init',
        });
    }
}
