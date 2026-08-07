/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { Identify } from '../models/Identify';
import type { SocialSignInResult } from '../models/SocialSignInResult';
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
    /**
     * Attach a social sign-in identity to the tenant of the current host
     * Completes a social (OIDC) sign-in. The identity provider creates the identity inside Kratos, which serves every tenant from one host and therefore cannot know which tenant the user signed in to. Until the membership exists, the session is real but every authenticated call is rejected. The SPA calls this once, right after the OIDC redirect lands back on the tenant host; the tenant is resolved from the request Origin (falling back to Host) — the SPA calls this on the tenant-neutral api host, so Origin is what names the tenant — and the caller is identified from their Kratos session (this endpoint deliberately accepts a session the normal auth middleware would reject, since the missing membership is the point). Idempotent: an identity that is already a member is answered with provisioned=false. Subject to the tenant's self-service signup setting, the same gate /public-api/v1/auth/identify applies.
     *
     * @returns SocialSignInResult The identity is a member of this tenant
     * @throws ApiError
     */
    public static completeSocialSignIn(): CancelablePromise<SocialSignInResult> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/public-api/v1/auth/social/complete',
            errors: {
                400: `The host resolves to no tenant`,
                401: `No valid session`,
                403: `This tenant does not allow self-service signup`,
                500: `Internal server error`,
            },
        });
    }
}
