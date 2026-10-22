/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type PersonalDataAccess = {
    tenantId?: string;
    actorUserId: string;
    subjectUserId: string;
    /**
     * what was read, as "<module>.<kind>", e.g. "aiemployee.run"
     */
    resource: string;
    resourceId?: string | null;
    accessedAt: string;
};

