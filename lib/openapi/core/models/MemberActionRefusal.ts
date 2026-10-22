/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Why an action on a member was refused. `reason` is stable, for the client to word in the reader's language; `message` is an English fallback. Neither names the member's other organizations.
 *
 */
export type MemberActionRefusal = {
    reason: MemberActionRefusal.reason;
    message: string;
};
export namespace MemberActionRefusal {
    export enum reason {
        MEMBER_OF_OTHER_TENANTS = 'member_of_other_tenants',
        DELETION_ALREADY_SCHEDULED = 'deletion_already_scheduled',
    }
}

