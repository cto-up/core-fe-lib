/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { Identify } from '../models/Identify';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class AuthService {
    /**
     * Handle password recovery
     * Proxies password recovery request to Kratos while preserving subdomain context
     * @param flow Recovery flow ID from Kratos
     * @param token Recovery token from Kratos
     * @returns any Recovery successful
     * @throws ApiError
     */
    public static handleRecovery(
        flow: string,
        token: string,
    ): CancelablePromise<{
        success?: boolean;
        message?: string;
        redirect_url?: string;
    }> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/public-api/v1/auth/recovery',
            query: {
                'flow': flow,
                'token': token,
            },
            errors: {
                400: `Invalid or expired recovery link`,
                500: `Internal server error`,
            },
        });
    }
    /**
     * Identify user and initiate authentication flow
     * Checks if user exists and is a member of the tenant, then sends appropriate sign-in or magic link.
     * @param requestBody
     * @returns any Process completed successfully (even if signup is not allowed)
     * @throws ApiError
     */
    public static identifyUser(
        requestBody: Identify,
    ): CancelablePromise<{
        success?: boolean;
        message?: string;
    }> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/public-api/v1/auth/identify',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `Invalid request`,
                500: `Internal server error`,
            },
        });
    }
}
