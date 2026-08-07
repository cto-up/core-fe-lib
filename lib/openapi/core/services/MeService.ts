/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { AccountDeletion } from '../models/AccountDeletion';
import type { AccountDeletionRequest } from '../models/AccountDeletionRequest';
import type { LeaveTenantPreview } from '../models/LeaveTenantPreview';
import type { LeaveTenantRequest } from '../models/LeaveTenantRequest';
import type { LeaveTenantResult } from '../models/LeaveTenantResult';
import type { TenantMembership } from '../models/TenantMembership';
import type { UserDataExport } from '../models/UserDataExport';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class MeService {
    /**
     * The tenants the caller belongs to
     * Active memberships only. Scoped to the caller from the auth context, never from the path, so one user cannot read another's. Backs the Organizations page, where each row carries its own Leave action.
     *
     * @returns TenantMembership Memberships
     * @throws ApiError
     */
    public static listMyTenants(): CancelablePromise<Array<TenantMembership>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/users/me/tenants',
            errors: {
                401: `Unauthorized`,
                500: `Internal server error`,
            },
        });
    }
    /**
     * Invitations awaiting the caller's answer
     * Pending memberships, with expired ones filtered out server-side: accepting an expired invitation fails, and offering something that cannot be taken is worse than showing nothing.
     *
     * @returns TenantMembership Pending invitations
     * @throws ApiError
     */
    public static listMyPendingInvitations(): CancelablePromise<Array<TenantMembership>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/users/me/tenants/pending',
            errors: {
                401: `Unauthorized`,
                500: `Internal server error`,
            },
        });
    }
    /**
     * What leaving this tenant would cost the caller
     * Returns the impacts of leaving, so the confirmation dialog can state real numbers instead of a generic warning. The tenant is the one the request is addressed to — resolved from Origin/Host by TenantMiddleware, like every other tenant-scoped call — never a caller-supplied id: you can only preview leaving the organization you are currently signed in to.
     *
     * Impacts are contributed by the modules that own user-attributed data (core knows nothing about enrollments or authored courses), so the set of keys is open-ended: render a known key from its translation, and fall back to `label` for anything else. An impact with severity `decision` must be resolved by the matching entry in the leave request; while one is outstanding, `canLeaveNow` is false and POST .../leave answers 409.
     *
     * @returns LeaveTenantPreview Leave preview
     * @throws ApiError
     */
    public static getMyLeaveTenantPreview(): CancelablePromise<LeaveTenantPreview> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/users/me/leave-preview',
            errors: {
                401: `Unauthorized`,
                500: `Internal server error`,
            },
        });
    }
    /**
     * Leave the current tenant (self-service)
     * The caller ends their own membership of the tenant this request is addressed to — resolved from Origin/Host by TenantMiddleware, never named in the path or the body. You leave the organization you are signed in to; the Organizations page sends the browser to that organization's host first. Distinct from closing an account: the identity survives, every other membership survives, and the membership row survives as `inactive` — that row is the return path, so a later invitation or self-service signup reactivates it with the original joined_at and the learner's history intact.
     *
     * Order matters. The tenant is removed from the identity's `metadata_public.tenant_memberships` FIRST, because that claim — not the membership row — is what VerifyTokenWithTenantID reads, and it is re-read from Kratos on every request, so the next call is already refused. The row is then set to `inactive` and the seat released. A row-only update would report success and revoke nothing.
     *
     * The Kratos session is left alone on purpose: it belongs to the identity, not to a tenant, so revoking it would sign the member out of the organizations they did not leave.
     *
     * Any impact the preview reported with severity `decision` (authored published courses, an active paid subscription) must be answered in `decisions`, or the call is refused with 409 rather than silently orphaning content learners are enrolled in. Leaving is deliberately NOT blocked on being the tenant's last administrator.
     *
     * @param requestBody
     * @returns LeaveTenantResult Membership ended
     * @throws ApiError
     */
    public static leaveTenant(
        requestBody?: LeaveTenantRequest,
    ): CancelablePromise<LeaveTenantResult> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/users/me/leave',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                401: `Unauthorized`,
                409: `An impact of severity \`decision\` is unresolved`,
                429: `Rate limited — leave/rejoin is capped per tenant per day`,
                500: `Internal server error`,
            },
        });
    }
    /**
     * Whether the caller's account is scheduled for deletion
     * Read by the SPA on sign-in so a returning user is intercepted before the app loads and offered the chance to keep their account. `status` is `none` when nothing is scheduled.
     *
     * @returns AccountDeletion Deletion status
     * @throws ApiError
     */
    public static getMyAccountDeletion(): CancelablePromise<AccountDeletion> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/users/me/deletion',
            errors: {
                401: `Unauthorized`,
            },
        });
    }
    /**
     * Schedule deletion of the caller's account
     * Closes the account across every tenant. Nothing is deleted, ended or revoked synchronously: the account is stamped with a deletion date 30 days out, and a daily sweeper performs the deletion — memberships, sessions and identity — once that date passes. The grace period is what makes an account takeover non-destructive and a change of mind cheap; signing in during the window surfaces the cancel path.
     *
     * Ending memberships now would make cancelling impossible: this endpoint's DELETE sits behind the auth middleware, which rejects a session whose identity holds no membership claim for the host tenant. To lose access immediately, leave each organization instead.
     *
     * `confirmEmail` must equal the caller's own email; the server checks it rather than trusting the client's typed-confirmation dialog.
     *
     * @param requestBody
     * @returns AccountDeletion Deletion scheduled
     * @throws ApiError
     */
    public static scheduleMyAccountDeletion(
        requestBody: AccountDeletionRequest,
    ): CancelablePromise<AccountDeletion> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/users/me/deletion',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `confirmEmail does not match the caller`,
                401: `Unauthorized`,
                409: `A deletion is already scheduled`,
                500: `Internal server error`,
            },
        });
    }
    /**
     * Cancel a scheduled account deletion
     * Keeps the account. There is nothing to restore — scheduling ended no membership, precisely so this call is reachable — so clearing the stamp is the whole cancellation. Idempotent: with nothing scheduled, answers 200 with status `none`.
     *
     * @returns AccountDeletion Deletion cancelled
     * @throws ApiError
     */
    public static cancelMyAccountDeletion(): CancelablePromise<AccountDeletion> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/v1/users/me/deletion',
            errors: {
                401: `Unauthorized`,
                500: `Internal server error`,
            },
        });
    }
    /**
     * Export the caller's own data
     * One JSON document: what core owns (identity, profile, memberships) plus one section per module that registered a data contributor at boot. Core assembles it and knows nothing about what the sections contain — an LMS fills in enrollments, progress and certificates because the LMS registered a contributor, not because core has heard of them.
     *
     * Offered inside the close-account dialog rather than buried in a settings page: it covers the portability obligation and it is what a good share of the people who click delete actually wanted.
     *
     * A module that registers nothing contributes no section. That is silent, and unlike the seat guard it is not benign — an unregistered module means personal data this document does not show and the erase path will not reach.
     *
     * @returns UserDataExport Export document
     * @throws ApiError
     */
    public static exportMyData(): CancelablePromise<UserDataExport> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/users/me/export',
            errors: {
                401: `Unauthorized`,
                500: `Internal server error`,
            },
        });
    }
}
