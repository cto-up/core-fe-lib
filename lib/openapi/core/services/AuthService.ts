/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
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
}
