/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { APIToken } from '../models/APIToken';
import type { APITokenAuditLog } from '../models/APITokenAuditLog';
import type { APITokenCreated } from '../models/APITokenCreated';
import type { APITokenRevoke } from '../models/APITokenRevoke';
import type { ClientApplication } from '../models/ClientApplication';
import type { Config } from '../models/Config';
import type { Migration } from '../models/Migration';
import type { NewAPIToken } from '../models/NewAPIToken';
import type { NewClientApplication } from '../models/NewClientApplication';
import type { NewConfig } from '../models/NewConfig';
import type { NewPrompt } from '../models/NewPrompt';
import type { NewSignUp } from '../models/NewSignUp';
import type { NewTenant } from '../models/NewTenant';
import type { NewTranslation } from '../models/NewTranslation';
import type { NewUser } from '../models/NewUser';
import type { Prompt } from '../models/Prompt';
import type { PromptResponse } from '../models/PromptResponse';
import type { PublicTenantSchema } from '../models/PublicTenantSchema';
import type { Role } from '../models/Role';
import type { Tenant } from '../models/Tenant';
import type { TenantFeatures } from '../models/TenantFeatures';
import type { TenantProfile } from '../models/TenantProfile';
import type { Translation } from '../models/Translation';
import type { User } from '../models/User';
import type { UserActionSchema } from '../models/UserActionSchema';
import type { UserProfileSchema } from '../models/UserProfileSchema';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class DefaultService {
    /**
     * Returns all global_configs from the system that the user has access to
     *
     * @param page page number
     * @param pageSize maximum number of results to return
     * @param sortBy field to sort by
     * @param order sort order
     * @param q starts with
     * @param detail basic or full
     * @returns Config global_config response
     * @throws ApiError
     */
    public static listGlobalConfigs(
        page?: number,
        pageSize?: number,
        sortBy?: string,
        order?: 'asc' | 'desc',
        q?: string,
        detail?: string,
    ): CancelablePromise<Array<Config>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/superadmin-api/v1/configs/global-configs',
            query: {
                'page': page,
                'pageSize': pageSize,
                'sortBy': sortBy,
                'order': order,
                'q': q,
                'detail': detail,
            },
        });
    }
    /**
     * Creates a new global_config in the store. Duplicates are allowed
     * @param requestBody GlobalConfig to add to the store
     * @returns Config global_config response
     * @throws ApiError
     */
    public static addGlobalConfig(
        requestBody: NewConfig,
    ): CancelablePromise<Config> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/superadmin-api/v1/configs/global-configs',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Returns a global config based on a single ID, if the user does not have access to the global config
     * @param id ID of global config to fetch
     * @returns Config global config response
     * @throws ApiError
     */
    public static getGlobalConfigById(
        id: string,
    ): CancelablePromise<Config> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/superadmin-api/v1/configs/global-configs/{id}',
            path: {
                'id': id,
            },
        });
    }
    /**
     * Updates a global config in the store.
     * @param id ID of global config to fetch
     * @param requestBody Global config to add to the store
     * @returns Config global config response
     * @throws ApiError
     */
    public static updateGlobalConfig(
        id: string,
        requestBody: Config,
    ): CancelablePromise<Config> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/superadmin-api/v1/configs/global-configs/{id}',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * deletes a single global config based on the ID supplied
     * @param id ID of global config to delete
     * @returns void
     * @throws ApiError
     */
    public static deleteGlobalConfig(
        id: string,
    ): CancelablePromise<void> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/superadmin-api/v1/configs/global-configs/{id}',
            path: {
                'id': id,
            },
        });
    }
    /**
     * Returns all tenant_configs from the system that the user has access to
     *
     * @param page page number
     * @param pageSize maximum number of results to return
     * @param sortBy field to sort by
     * @param order sort order
     * @param q starts with
     * @param detail basic or full
     * @returns Config tenant_config response
     * @throws ApiError
     */
    public static listTenantConfigs(
        page?: number,
        pageSize?: number,
        sortBy?: string,
        order?: 'asc' | 'desc',
        q?: string,
        detail?: string,
    ): CancelablePromise<Array<Config>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/configs/tenant-configs',
            query: {
                'page': page,
                'pageSize': pageSize,
                'sortBy': sortBy,
                'order': order,
                'q': q,
                'detail': detail,
            },
        });
    }
    /**
     * Creates a new tenant_config in the store. Duplicates are allowed
     * @param requestBody TenantConfig to add to the store
     * @returns Config tenant_config response
     * @throws ApiError
     */
    public static addTenantConfig(
        requestBody: NewConfig,
    ): CancelablePromise<Config> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/configs/tenant-configs',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Returns a tenant config based on a single ID, if the user does not have access to the tenant config
     * @param id ID of tenant config to fetch
     * @returns Config tenant config response
     * @throws ApiError
     */
    public static getTenantConfigById(
        id: string,
    ): CancelablePromise<Config> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/configs/tenant-configs/{id}',
            path: {
                'id': id,
            },
        });
    }
    /**
     * Updates a tenant config in the store.
     * @param id ID of tenant config to fetch
     * @param requestBody Tenant config to add to the store
     * @returns Config tenant config response
     * @throws ApiError
     */
    public static updateTenantConfig(
        id: string,
        requestBody: Config,
    ): CancelablePromise<Config> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/v1/configs/tenant-configs/{id}',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * deletes a single tenant config based on the ID supplied
     * @param id ID of tenant config to delete
     * @returns void
     * @throws ApiError
     */
    public static deleteTenantConfig(
        id: string,
    ): CancelablePromise<void> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/v1/configs/tenant-configs/{id}',
            path: {
                'id': id,
            },
        });
    }
    /**
     * Returns a user based on a single ID, if the user does not have access to the user
     * @param userid ID of user to fetch
     * @returns User user response
     * @throws ApiError
     */
    public static getUserById(
        userid: string,
    ): CancelablePromise<User> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/users/{userid}',
            path: {
                'userid': userid,
            },
        });
    }
    /**
     * Updates a new user in the store. Duplicates are allowed
     * @param userid ID of user to fetch
     * @param requestBody User to update to the store
     * @returns void
     * @throws ApiError
     */
    public static updateUser(
        userid: string,
        requestBody: User,
    ): CancelablePromise<void> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/v1/users/{userid}',
            path: {
                'userid': userid,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * deletes a single user based on the ID supplied
     * @param userid ID of user to delete
     * @returns void
     * @throws ApiError
     */
    public static deleteUser(
        userid: string,
    ): CancelablePromise<void> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/v1/users/{userid}',
            path: {
                'userid': userid,
            },
        });
    }
    /**
     * Act on user
     * @param userid ID of user
     * @param requestBody Project to add to the store
     * @returns void
     * @throws ApiError
     */
    public static updateUserStatus(
        userid: string,
        requestBody: UserActionSchema,
    ): CancelablePromise<void> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/users/{userid}/status',
            path: {
                'userid': userid,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Assign a role to a user based
     * @param userid ID of user
     * @param role role to assign
     * @returns void
     * @throws ApiError
     */
    public static assignRole(
        userid: string,
        role: Role,
    ): CancelablePromise<void> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/users/{userid}/roles/{role}/assign',
            path: {
                'userid': userid,
                'role': role,
            },
        });
    }
    /**
     * Unassign a role to a user based
     * @param userid ID of user
     * @param role role to unassign
     * @returns void
     * @throws ApiError
     */
    public static unassignRole(
        userid: string,
        role: Role,
    ): CancelablePromise<void> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/users/{userid}/roles/{role}/unassign',
            path: {
                'userid': userid,
                'role': role,
            },
        });
    }
    /**
     * Returns all users from the system that the user has access to
     *
     * @param page page number
     * @param pageSize maximum number of results to return
     * @param sortBy field to sort by
     * @param order sort order
     * @param q starts with
     * @param detail basic or full (default to full)
     * @returns User user response
     * @throws ApiError
     */
    public static listUsers(
        page?: number,
        pageSize?: number,
        sortBy?: string,
        order?: 'asc' | 'desc',
        q?: string,
        detail?: string,
    ): CancelablePromise<Array<User>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/users',
            query: {
                'page': page,
                'pageSize': pageSize,
                'sortBy': sortBy,
                'order': order,
                'q': q,
                'detail': detail,
            },
        });
    }
    /**
     * Creates a new user in the store. Duplicates are not allowed
     * @param requestBody User to add to the store
     * @returns User user response
     * @throws ApiError
     */
    public static addUser(
        requestBody: NewUser,
    ): CancelablePromise<User> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/users',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Import users from CSV file
     * @param formData CSV file containing user data
     * @returns any Import results
     * @throws ApiError
     */
    public static importUsersFromAdmin(
        formData: {
            /**
             * CSV file with user data (lastname;firstname;email format)
             */
            file?: Blob;
        },
    ): CancelablePromise<{
        /**
         * Total number of records processed
         */
        total?: number;
        /**
         * Number of users successfully created
         */
        success?: number;
        /**
         * Number of users that failed to be created
         */
        failed?: number;
        errors?: Array<{
            /**
             * Line number in CSV
             */
            line?: number;
            /**
             * Email of the user that failed
             */
            email?: string;
            /**
             * Error message
             */
            error?: string;
        }>;
    }> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/users/import',
            formData: formData,
            mediaType: 'multipart/form-data',
        });
    }
    /**
     * Returns a user based on their email
     * @param email email of user to fetch
     * @returns User user response
     * @throws ApiError
     */
    public static getUserByEmail(
        email: string,
    ): CancelablePromise<User> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/users/by-email/{email}',
            path: {
                'email': email,
            },
        });
    }
    /**
     * Returns a user based on a single ID, if the user does not have access to the user
     * @param userid ID of user to fetch
     * @param tenantid ID of tenant
     * @returns User user response
     * @throws ApiError
     */
    public static getUserByIdFromSuperAdmin(
        userid: string,
        tenantid: string,
    ): CancelablePromise<User> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/superadmin-api/v1/tenants/{tenantid}/users/{userid}',
            path: {
                'userid': userid,
                'tenantid': tenantid,
            },
        });
    }
    /**
     * Updates a new user in the store. Duplicates are allowed
     * @param userid ID of user to fetch
     * @param tenantid ID of tenant
     * @param requestBody User to update to the store
     * @returns void
     * @throws ApiError
     */
    public static updateUserFromSuperAdmin(
        userid: string,
        tenantid: string,
        requestBody: User,
    ): CancelablePromise<void> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/superadmin-api/v1/tenants/{tenantid}/users/{userid}',
            path: {
                'userid': userid,
                'tenantid': tenantid,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * deletes a single user based on the ID supplied
     * @param userid ID of user to fetch
     * @param tenantid ID of tenant
     * @returns void
     * @throws ApiError
     */
    public static deleteUserFromSuperAdmin(
        userid: string,
        tenantid: string,
    ): CancelablePromise<void> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/superadmin-api/v1/tenants/{tenantid}/users/{userid}',
            path: {
                'userid': userid,
                'tenantid': tenantid,
            },
        });
    }
    /**
     * Act on user
     * @param userid ID of user to fetch
     * @param tenantid ID of tenant
     * @param requestBody Action to add to the store
     * @returns void
     * @throws ApiError
     */
    public static updateUserStatusFromSuperAdmin(
        userid: string,
        tenantid: string,
        requestBody: UserActionSchema,
    ): CancelablePromise<void> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/superadmin-api/v1/tenants/{tenantid}/users/{userid}/status',
            path: {
                'userid': userid,
                'tenantid': tenantid,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Assign a role to a user based
     * @param userid ID of user to fetch
     * @param tenantid ID of tenant
     * @param role role to assign
     * @returns void
     * @throws ApiError
     */
    public static assignRoleFromSuperAdmin(
        userid: string,
        tenantid: string,
        role: Role,
    ): CancelablePromise<void> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/superadmin-api/v1/tenants/{tenantid}/users/{userid}/roles/{role}/assign',
            path: {
                'userid': userid,
                'tenantid': tenantid,
                'role': role,
            },
        });
    }
    /**
     * Unassign a role to a user based
     * @param userid ID of user to fetch
     * @param tenantid ID of tenant
     * @param role role to unassign
     * @returns void
     * @throws ApiError
     */
    public static unassignRoleFromSuperAdmin(
        userid: string,
        tenantid: string,
        role: Role,
    ): CancelablePromise<void> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/superadmin-api/v1/tenants/{tenantid}/users/{userid}/roles/{role}/unassign',
            path: {
                'userid': userid,
                'tenantid': tenantid,
                'role': role,
            },
        });
    }
    /**
     * Returns all users from the system that the user has access to
     *
     * @param tenantid ID of tenant
     * @param page page number
     * @param pageSize maximum number of results to return
     * @param sortBy field to sort by
     * @param order sort order
     * @param q starts with
     * @returns User user response
     * @throws ApiError
     */
    public static listUsersFromSuperAdmin(
        tenantid: string,
        page?: number,
        pageSize?: number,
        sortBy?: string,
        order?: 'asc' | 'desc',
        q?: string,
    ): CancelablePromise<Array<User>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/superadmin-api/v1/tenants/{tenantid}/users',
            path: {
                'tenantid': tenantid,
            },
            query: {
                'page': page,
                'pageSize': pageSize,
                'sortBy': sortBy,
                'order': order,
                'q': q,
            },
        });
    }
    /**
     * Creates a new user in the store. Duplicates are not allowed
     * @param tenantid ID of tenant
     * @param requestBody User to add to the store
     * @returns User user response
     * @throws ApiError
     */
    public static addUserFromSuperAdmin(
        tenantid: string,
        requestBody: NewUser,
    ): CancelablePromise<User> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/superadmin-api/v1/tenants/{tenantid}/users',
            path: {
                'tenantid': tenantid,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Creates a new empty user in the store. Duplicates are not allowed
     * @returns User user response
     * @throws ApiError
     */
    public static createMeUser(): CancelablePromise<User> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/me',
        });
    }
    /**
     * Returns current user profile.
     *
     * @returns UserProfileSchema user response
     * @throws ApiError
     */
    public static getMeProfile(): CancelablePromise<UserProfileSchema> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/me/profile',
        });
    }
    /**
     * Updates a user in the store.
     * @param requestBody User to add to the store
     * @returns UserProfileSchema user response
     * @throws ApiError
     */
    public static updateMeProfile(
        requestBody: UserProfileSchema,
    ): CancelablePromise<UserProfileSchema> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/v1/me/profile',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Upload user profile picture
     * @param formData User to add to the store
     * @returns User user response
     * @throws ApiError
     */
    public static uploadProfilePicture(
        formData: {
            file?: Blob;
        },
    ): CancelablePromise<User> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/me/profile/picture',
            formData: formData,
            mediaType: 'multipart/form-data',
        });
    }
    /**
     * Request a password reset
     * @param userid ID of user to fetch
     * @param requestBody email
     * @returns any level response
     * @throws ApiError
     */
    public static resetPasswordRequestByAdmin(
        userid: string,
        requestBody: {
            /**
             * email
             */
            email: string;
        },
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/users/{userid}/password-reset-request',
            path: {
                'userid': userid,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Request a password reset
     * @param userid ID of user to fetch
     * @param tenantid ID of tenant
     * @param requestBody email
     * @returns any level response
     * @throws ApiError
     */
    public static resetPasswordRequestBySuperAdmin(
        userid: string,
        tenantid: string,
        requestBody: {
            /**
             * email
             */
            email: string;
        },
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/superadmin-api/v1/tenants/{tenantid}/users/{userid}/password-reset-request',
            path: {
                'userid': userid,
                'tenantid': tenantid,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Request a password reset
     * @param requestBody email
     * @returns any level response
     * @throws ApiError
     */
    public static resetPasswordRequest(
        requestBody: {
            /**
             * email
             */
            email: string;
        },
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/public-api/v1/password-reset-request',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Returns a user profile picture. Supports ETag-based caching for improved performance.
     * @param userid ID of user to fetch
     * @param ifNoneMatch ETag value for cache validation
     * @returns binary Profile picture response
     * @throws ApiError
     */
    public static getProfilePicture(
        userid: string,
        ifNoneMatch?: string,
    ): CancelablePromise<Blob> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/public-api/v1/users/{userid}/profile/picture',
            path: {
                'userid': userid,
            },
            headers: {
                'If-None-Match': ifNoneMatch,
            },
            errors: {
                304: `Not Modified - cached version is still valid`,
                404: `Profile picture not found`,
            },
        });
    }
    /**
     * Returns current tenant.
     *
     * @returns PublicTenantSchema tenant response
     * @throws ApiError
     */
    public static getPublicTenant(): CancelablePromise<PublicTenantSchema> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/public-api/v1/tenant',
        });
    }
    /**
     * Creates a new user for the current tenant.
     * @param requestBody User to add to the store
     * @returns User user response
     * @throws ApiError
     */
    public static signup(
        requestBody: NewSignUp,
    ): CancelablePromise<User> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/public-api/v1/sign-up',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `Invalid input`,
                403: `Sign up not allowed for this tenant`,
            },
        });
    }
    /**
     * Verify user's email address using verification token
     * @param requestBody Email verification token
     * @returns any Email verified successfully
     * @throws ApiError
     */
    public static verifyEmail(
        requestBody: {
            /**
             * Email verification token received via email
             */
            token: string;
        },
    ): CancelablePromise<{
        message?: string;
        email_verified?: boolean;
    }> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/public-api/v1/verify-email',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `Invalid or expired token`,
                500: `Internal server error`,
            },
        });
    }
    /**
     * Resend email verification link to authenticated user
     * @returns any Verification email sent successfully
     * @throws ApiError
     */
    public static resendEmailVerification(): CancelablePromise<{
        message?: string;
    }> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/me/email-verification/resend',
            errors: {
                400: `Bad request - user already verified or invalid request`,
                401: `Unauthorized - user not authenticated`,
                429: `Too many requests - rate limit exceeded`,
                500: `Internal server error`,
            },
        });
    }
    /**
     * Get current user's email verification status
     * @returns any Email verification status retrieved successfully
     * @throws ApiError
     */
    public static getMyEmailVerificationStatus(): CancelablePromise<{
        email?: string;
        email_verified?: boolean;
        /**
         * Timestamp when last verification email was sent
         */
        verification_sent_at?: string;
    }> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/me/email-verification/status',
            errors: {
                401: `Unauthorized - user not authenticated`,
                500: `Internal server error`,
            },
        });
    }
    /**
     * Returns current tenant profile.
     *
     * @returns TenantProfile tenant response
     * @throws ApiError
     */
    public static getTenantProfile(): CancelablePromise<TenantProfile> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/tenant/profile',
        });
    }
    /**
     * Updates a tenant profile in the store.
     * @param requestBody Tenant profile to update to the store
     * @returns TenantProfile tenant response
     * @throws ApiError
     */
    public static updateTenantProfile(
        requestBody: TenantProfile,
    ): CancelablePromise<TenantProfile> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/v1/tenant/profile',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Returns the tenant logo. Returns 404 if no logo is set. Supports ETag-based caching.
     * @param ifNoneMatch ETag value for cache validation
     * @returns binary Logo response
     * @throws ApiError
     */
    public static getTenantLogo(
        ifNoneMatch?: string,
    ): CancelablePromise<Blob> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/public-api/v1/tenant/pictures/logo',
            headers: {
                'If-None-Match': ifNoneMatch,
            },
            errors: {
                304: `Not Modified - cached version is still valid`,
                404: `Logo not found`,
            },
        });
    }
    /**
     * Returns the tenant background image. Returns 404 if no background image is set. Supports ETag-based caching.
     * @param ifNoneMatch ETag value for cache validation
     * @returns binary Background image response
     * @throws ApiError
     */
    public static getTenantBackground(
        ifNoneMatch?: string,
    ): CancelablePromise<Blob> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/public-api/v1/tenant/pictures/background',
            headers: {
                'If-None-Match': ifNoneMatch,
            },
            errors: {
                304: `Not Modified - cached version is still valid`,
                404: `Background image not found`,
            },
        });
    }
    /**
     * Returns the tenant background mobile image. Returns 404 if no background mobile image is set. Supports ETag-based caching.
     * @param ifNoneMatch ETag value for cache validation
     * @returns binary Background mobile image response
     * @throws ApiError
     */
    public static getTenantBackgroundMobile(
        ifNoneMatch?: string,
    ): CancelablePromise<Blob> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/public-api/v1/tenant/pictures/background-mobile',
            headers: {
                'If-None-Match': ifNoneMatch,
            },
            errors: {
                304: `Not Modified - cached version is still valid`,
                404: `Background mobile image not found`,
            },
        });
    }
    /**
     * Uploads a new tenant logo. Only webp files are accepted.
     * @param formData
     * @returns void
     * @throws ApiError
     */
    public static uploadTenantLogo(
        formData: {
            picture?: Blob;
        },
    ): CancelablePromise<void> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/tenant/pictures/logo',
            formData: formData,
            mediaType: 'multipart/form-data',
            errors: {
                400: `Invalid file format. Only webp files are allowed`,
            },
        });
    }
    /**
     * Uploads a new tenant background image. Only webp files are accepted.
     * @param formData
     * @returns void
     * @throws ApiError
     */
    public static uploadTenantBackground(
        formData: {
            picture?: Blob;
        },
    ): CancelablePromise<void> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/tenant/pictures/background',
            formData: formData,
            mediaType: 'multipart/form-data',
            errors: {
                400: `Invalid file format. Only webp files are allowed`,
            },
        });
    }
    /**
     * Uploads a new tenant background mobile image. Only webp files are accepted.
     * @param formData
     * @returns void
     * @throws ApiError
     */
    public static uploadTenantBackgroundMobile(
        formData: {
            picture?: Blob;
        },
    ): CancelablePromise<void> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/tenant/pictures/background-mobile',
            formData: formData,
            mediaType: 'multipart/form-data',
            errors: {
                400: `Invalid file format. Only webp files are allowed`,
            },
        });
    }
    /**
     * Returns all tenants from the system that the user has access to
     *
     * @param page page number
     * @param pageSize maximum number of results to return
     * @param sortBy field to sort by
     * @param order sort order
     * @param q starts with
     * @returns Tenant tenant response
     * @throws ApiError
     */
    public static listTenants(
        page?: number,
        pageSize?: number,
        sortBy?: string,
        order?: 'asc' | 'desc',
        q?: string,
    ): CancelablePromise<Array<Tenant>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/superadmin-api/v1/tenants',
            query: {
                'page': page,
                'pageSize': pageSize,
                'sortBy': sortBy,
                'order': order,
                'q': q,
            },
        });
    }
    /**
     * Creates a new tenant in the store. Duplicates are allowed
     * @param requestBody Tenant to add to the store
     * @returns Tenant tenant response
     * @throws ApiError
     */
    public static addTenant(
        requestBody: NewTenant,
    ): CancelablePromise<Tenant> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/superadmin-api/v1/tenants',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Returns a tenant based on a single ID, if the user does not have access to the tenant
     * @param tenantid ID of tenant to fetch
     * @returns Tenant tenant response
     * @throws ApiError
     */
    public static getTenantById(
        tenantid: string,
    ): CancelablePromise<Tenant> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/superadmin-api/v1/tenants/{tenantid}',
            path: {
                'tenantid': tenantid,
            },
        });
    }
    /**
     * Updates a tenant in the store.
     * @param tenantid ID of tenant to fetch
     * @param requestBody Tenant to add to the store
     * @returns Tenant tenant response
     * @throws ApiError
     */
    public static updateTenant(
        tenantid: string,
        requestBody: Tenant,
    ): CancelablePromise<Tenant> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/superadmin-api/v1/tenants/{tenantid}',
            path: {
                'tenantid': tenantid,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * deletes a single tenant based on the ID supplied
     * @param tenantid ID of tenant to delete
     * @returns void
     * @throws ApiError
     */
    public static deleteTenant(
        tenantid: string,
    ): CancelablePromise<void> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/superadmin-api/v1/tenants/{tenantid}',
            path: {
                'tenantid': tenantid,
            },
        });
    }
    /**
     * Returns tenant features.
     * @param tenantid ID of tenant to fetch
     * @returns TenantFeatures tenant response
     * @throws ApiError
     */
    public static getTenantFeatures(
        tenantid: string,
    ): CancelablePromise<TenantFeatures> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/superadmin-api/v1/tenant/{tenantid}/features',
            path: {
                'tenantid': tenantid,
            },
        });
    }
    /**
     * Updates a tenant in the store.
     * @param tenantid ID of tenant to fetch
     * @param requestBody Tenant to add to the store
     * @returns TenantFeatures tenant response
     * @throws ApiError
     */
    public static updateTenantFeatures(
        tenantid: string,
        requestBody: TenantFeatures,
    ): CancelablePromise<TenantFeatures> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/superadmin-api/v1/tenant/{tenantid}/features',
            path: {
                'tenantid': tenantid,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Add authorized domains for Firebase Authentication
     * @param requestBody Domains to authorize
     * @returns any Domains successfully authorized
     * @throws ApiError
     */
    public static addAuthorizedDomains(
        requestBody: {
            /**
             * List of domains to authorize
             */
            domains: Array<string>;
        },
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/superadmin-api/v1/config/authorized-domains',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `Invalid request`,
                401: `Unauthorized`,
                403: `Forbidden - requires SUPER_ADMIN role`,
                500: `Internal server error`,
            },
        });
    }
    /**
     * Remove authorized domains for Firebase Authentication
     * @param requestBody Domains to remove
     * @returns any Domains successfully removed
     * @throws ApiError
     */
    public static removeAuthorizedDomains(
        requestBody: {
            /**
             * List of domains to remove
             */
            domains: Array<string>;
        },
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/superadmin-api/v1/config/authorized-domains',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `Invalid request`,
                401: `Unauthorized`,
                403: `Forbidden - requires SUPER_ADMIN role`,
                500: `Internal server error`,
            },
        });
    }
    /**
     * Returns all client applications the user has access to
     * @param page page number
     * @param pageSize maximum number of results to return
     * @param sortBy field to sort by
     * @param order sort order
     * @param q search query
     * @param includeInactive include inactive applications
     * @returns ClientApplication client applications response
     * @throws ApiError
     */
    public static listClientApplications(
        page?: number,
        pageSize?: number,
        sortBy?: string,
        order?: 'asc' | 'desc',
        q?: string,
        includeInactive?: boolean,
    ): CancelablePromise<Array<ClientApplication>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/admin-api/v1/client-applications',
            query: {
                'page': page,
                'pageSize': pageSize,
                'sortBy': sortBy,
                'order': order,
                'q': q,
                'includeInactive': includeInactive,
            },
        });
    }
    /**
     * Creates a new client application
     * @param requestBody Client application to create
     * @returns ClientApplication client application created
     * @throws ApiError
     */
    public static createClientApplication(
        requestBody: NewClientApplication,
    ): CancelablePromise<ClientApplication> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/admin-api/v1/client-applications',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Returns a client application by ID
     * @param id ID of client application to fetch
     * @returns ClientApplication client application response
     * @throws ApiError
     */
    public static getClientApplicationById(
        id: string,
    ): CancelablePromise<ClientApplication> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/admin-api/v1/client-applications/{id}',
            path: {
                'id': id,
            },
        });
    }
    /**
     * Updates a client application
     * @param id ID of client application to update
     * @param requestBody Client application to update
     * @returns ClientApplication client application updated
     * @throws ApiError
     */
    public static updateClientApplication(
        id: string,
        requestBody: NewClientApplication,
    ): CancelablePromise<ClientApplication> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/admin-api/v1/client-applications/{id}',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Deletes a client application
     * @param id ID of client application to delete
     * @returns void
     * @throws ApiError
     */
    public static deleteClientApplication(
        id: string,
    ): CancelablePromise<void> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/admin-api/v1/client-applications/{id}',
            path: {
                'id': id,
            },
        });
    }
    /**
     * Deactivates a client application
     * @param id ID of client application to deactivate
     * @returns void
     * @throws ApiError
     */
    public static deactivateClientApplication(
        id: string,
    ): CancelablePromise<void> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/admin-api/v1/client-applications/{id}/deactivate',
            path: {
                'id': id,
            },
        });
    }
    /**
     * Returns all API tokens for a client application
     * @param id ID of client application
     * @param page page number
     * @param pageSize maximum number of results to return
     * @param sortBy field to sort by
     * @param order sort order
     * @param includeRevoked include revoked tokens
     * @param includeExpired include expired tokens
     * @returns APIToken API tokens response
     * @throws ApiError
     */
    public static listApiTokens(
        id: string,
        page?: number,
        pageSize?: number,
        sortBy?: string,
        order?: 'asc' | 'desc',
        includeRevoked?: boolean,
        includeExpired?: boolean,
    ): CancelablePromise<Array<APIToken>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/admin-api/v1/client-applications/{id}/tokens',
            path: {
                'id': id,
            },
            query: {
                'page': page,
                'pageSize': pageSize,
                'sortBy': sortBy,
                'order': order,
                'includeRevoked': includeRevoked,
                'includeExpired': includeExpired,
            },
        });
    }
    /**
     * Creates a new API token for a client application
     * @param id ID of client application
     * @param requestBody API token to create
     * @returns APITokenCreated API token created
     * @throws ApiError
     */
    public static createApiToken(
        id: string,
        requestBody: NewAPIToken,
    ): CancelablePromise<APITokenCreated> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/admin-api/v1/client-applications/{id}/tokens',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Returns an API token by ID
     * @param id ID of client application
     * @param tokenId ID of API token
     * @returns APIToken API token response
     * @throws ApiError
     */
    public static getApiTokenById(
        id: string,
        tokenId: string,
    ): CancelablePromise<APIToken> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/admin-api/v1/client-applications/{id}/tokens/{tokenId}',
            path: {
                'id': id,
                'tokenId': tokenId,
            },
        });
    }
    /**
     * Deletes an API token
     * @param id ID of client application
     * @param tokenId ID of API token
     * @returns void
     * @throws ApiError
     */
    public static deleteApiToken(
        id: string,
        tokenId: string,
    ): CancelablePromise<void> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/admin-api/v1/client-applications/{id}/tokens/{tokenId}',
            path: {
                'id': id,
                'tokenId': tokenId,
            },
        });
    }
    /**
     * Revokes an API token
     * @param id ID of client application
     * @param tokenId ID of API token
     * @param requestBody Revocation details
     * @returns APIToken API token revoked
     * @throws ApiError
     */
    public static revokeApiToken(
        id: string,
        tokenId: string,
        requestBody?: APITokenRevoke,
    ): CancelablePromise<APIToken> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/admin-api/v1/client-applications/{id}/tokens/{tokenId}/revoke',
            path: {
                'id': id,
                'tokenId': tokenId,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Returns audit logs for an API token
     * @param id ID of client application
     * @param tokenId ID of API token
     * @param page page number
     * @param pageSize maximum number of results to return
     * @returns APITokenAuditLog API token audit logs response
     * @throws ApiError
     */
    public static getApiTokenAuditLogs(
        id: string,
        tokenId: string,
        page?: number,
        pageSize?: number,
    ): CancelablePromise<Array<APITokenAuditLog>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/admin-api/v1/client-applications/{id}/tokens/{tokenId}/audit',
            path: {
                'id': id,
                'tokenId': tokenId,
            },
            query: {
                'page': page,
                'pageSize': pageSize,
            },
        });
    }
    /**
     * Returns all prompts from the system that the user has access to
     *
     * @param page page number
     * @param pageSize maximum number of results to return
     * @param sortBy field to sort by
     * @param order sort order
     * @param tags tags to filter by
     * @param q starts with
     * @param detail basic or full
     * @returns Prompt prompt response
     * @throws ApiError
     */
    public static listPrompts(
        page?: number,
        pageSize?: number,
        sortBy?: string,
        order?: 'asc' | 'desc',
        tags?: Array<string>,
        q?: string,
        detail?: string,
    ): CancelablePromise<Array<Prompt>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/prompts',
            query: {
                'page': page,
                'pageSize': pageSize,
                'sortBy': sortBy,
                'order': order,
                'tags': tags,
                'q': q,
                'detail': detail,
            },
            errors: {
                401: `Unauthorized`,
                403: `Forbidden`,
            },
        });
    }
    /**
     * Creates a new prompt in the store. Duplicates are allowed
     * @param requestBody Prompt to add to the store
     * @returns Prompt prompt response
     * @throws ApiError
     */
    public static addPrompt(
        requestBody: NewPrompt,
    ): CancelablePromise<Prompt> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/prompts',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `Invalid input`,
                401: `Unauthorized`,
                403: `Forbidden`,
            },
        });
    }
    /**
     * Returns a prompt based on a single ID, if the user does not have access to the prompt
     * @param id ID of prompt to fetch
     * @returns Prompt prompt response
     * @throws ApiError
     */
    public static getPromptById(
        id: string,
    ): CancelablePromise<Prompt> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/prompts/{id}',
            path: {
                'id': id,
            },
        });
    }
    /**
     * Updates a prompt in the store.
     * @param id ID of prompt to fetch
     * @param requestBody Prompt to add to the store
     * @returns Prompt prompt response
     * @throws ApiError
     */
    public static updatePrompt(
        id: string,
        requestBody: Prompt,
    ): CancelablePromise<Prompt> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/v1/prompts/{id}',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * deletes a single prompt based on the ID supplied
     * @param id ID of prompt to delete
     * @returns void
     * @throws ApiError
     */
    public static deletePrompt(
        id: string,
    ): CancelablePromise<void> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/v1/prompts/{id}',
            path: {
                'id': id,
            },
        });
    }
    /**
     * Execute a prompt with parameters
     * @param requestBody Parameters for the prompt
     * @param id ID of prompt to execute
     * @param name Name of prompt to execute
     * @returns PromptResponse Prompt execution result
     * @throws ApiError
     */
    public static formatPrompt(
        requestBody: {
            parameters?: Record<string, string>;
        },
        id?: string,
        name?: string,
    ): CancelablePromise<PromptResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/prompts/format',
            query: {
                'id': id,
                'name': name,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `Invalid parameters`,
                404: `Prompt not found`,
            },
        });
    }
    /**
     * Execute a prompt with parameters
     * @param requestBody Optional Overrides for the prompt, except for Parameters Values which will be taken from the request body
     * @param id ID of prompt to execute
     * @param name Name of prompt to execute
     * @param provider LLM Provider
     * @param llm LLM to use for execution
     * @param maxTokens Maximum number of tokens to generate
     * @param temperature Temperature for LLM generation (0.0-1.0)
     * @returns PromptResponse Prompt execution result
     * @throws ApiError
     */
    public static executePrompt(
        requestBody: {
            /**
             * Override the prompt with a custom prompt. Used for tests.
             */
            content?: string;
            /**
             * Override the parameters with a custom list of parameters. Used for tests.
             */
            parameters?: Array<string>;
            /**
             * Override the output format. Used for tests.
             */
            format?: 'json' | 'text' | 'markdown';
            /**
             * Override the format instructions with custom instructions. Used for tests.
             */
            formatInstructions?: string;
            parametersValues?: Record<string, string>;
        },
        id?: string,
        name?: string,
        provider?: 'OPENAI' | 'MISTRAL' | 'GOOGLEAI' | 'ANTHROPIC' | 'OLLAMA',
        llm?: string,
        maxTokens?: number,
        temperature: number = 0.7,
    ): CancelablePromise<PromptResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/prompts/execute',
            query: {
                'id': id,
                'name': name,
                'provider': provider,
                'llm': llm,
                'maxTokens': maxTokens,
                'temperature': temperature,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `Invalid parameters`,
                404: `Prompt not found`,
            },
        });
    }
    /**
     * Returns a list of translations
     * @param page
     * @param pageSize
     * @param sortBy
     * @param order
     * @param q
     * @param lang
     * @param type
     * @param key
     * @returns Translation A list of translations
     * @throws ApiError
     */
    public static listTranslations(
        page: number = 1,
        pageSize: number = 10,
        sortBy: string = 'name',
        order: 'asc' | 'desc' = 'asc',
        q?: string,
        lang: 'en' | 'fr' = 'en',
        type?: string,
        key?: string,
    ): CancelablePromise<Array<Translation>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/translations',
            query: {
                'page': page,
                'page_size': pageSize,
                'sort_by': sortBy,
                'order': order,
                'q': q,
                'lang': lang,
                'type': type,
                'key': key,
            },
            errors: {
                401: `Unauthorized`,
                403: `Forbidden`,
            },
        });
    }
    /**
     * Creates a new translation
     * @param requestBody
     * @returns Translation Translation created
     * @throws ApiError
     */
    public static createTranslation(
        requestBody: NewTranslation,
    ): CancelablePromise<Translation> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/translations',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `Invalid input`,
                401: `Unauthorized`,
                403: `Forbidden`,
            },
        });
    }
    /**
     * Returns a translation
     * @param entityType
     * @param entityId
     * @param field
     * @param language
     * @returns Translation Translation found
     * @throws ApiError
     */
    public static getTranslation(
        entityType: string,
        entityId: string,
        field: string,
        language: 'en' | 'fr',
    ): CancelablePromise<Translation> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/translations/search',
            query: {
                'entityType': entityType,
                'entityId': entityId,
                'field': field,
                'language': language,
            },
            errors: {
                401: `Unauthorized`,
                403: `Forbidden`,
                404: `Translation not found`,
            },
        });
    }
    /**
     * Returns a translation by ID
     * @param id
     * @param lang
     * @returns Translation Translation found
     * @throws ApiError
     */
    public static getTranslationById(
        id: string,
        lang: 'en' | 'fr' = 'en',
    ): CancelablePromise<Translation> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/translations/{id}',
            path: {
                'id': id,
            },
            query: {
                'lang': lang,
            },
            errors: {
                401: `Unauthorized`,
                403: `Forbidden`,
                404: `Translation not found`,
            },
        });
    }
    /**
     * Updates a translation
     * @param id
     * @param requestBody
     * @returns Translation Translation updated
     * @throws ApiError
     */
    public static updateTranslation(
        id: string,
        requestBody: NewTranslation,
    ): CancelablePromise<Translation> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/v1/translations/{id}',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `Invalid input`,
                401: `Unauthorized`,
                403: `Forbidden`,
                404: `Translation not found`,
            },
        });
    }
    /**
     * Deletes a translation
     * @param id
     * @returns void
     * @throws ApiError
     */
    public static deleteTranslation(
        id: string,
    ): CancelablePromise<void> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/v1/translations/{id}',
            path: {
                'id': id,
            },
            errors: {
                401: `Unauthorized`,
                403: `Forbidden`,
                404: `Translation not found`,
            },
        });
    }
    /**
     * Returns core migration information
     * @returns Migration core migration response
     * @throws ApiError
     */
    public static getCoreMigration(): CancelablePromise<Migration> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/superadmin-api/v1/migrations/core',
        });
    }
    /**
     * Updates core migration information
     * @param requestBody Migration information to update
     * @returns void
     * @throws ApiError
     */
    public static updateCoreMigration(
        requestBody: Migration,
    ): CancelablePromise<void> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/superadmin-api/v1/migrations/core/update',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
}
