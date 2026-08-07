/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type LeaveTenantResult = {
    /**
     * The row is kept, not deleted. Reactivating it is how a returning user gets their history back.
     *
     */
    membershipStatus: LeaveTenantResult.membershipStatus;
    dormantUntil?: string;
    seatReleased?: boolean;
};
export namespace LeaveTenantResult {
    /**
     * The row is kept, not deleted. Reactivating it is how a returning user gets their history back.
     *
     */
    export enum membershipStatus {
        INACTIVE = 'inactive',
    }
}

