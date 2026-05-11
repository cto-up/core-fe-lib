/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { Role } from './Role';
export type NewUser = {
    name: string;
    email: string;
    roles: Array<Role>;
    /**
     * When true, suppress invitation and welcome emails (both the synchronous Kratos welcome and any asynchronous onboarding follow-up).
     */
    silent?: boolean;
};

