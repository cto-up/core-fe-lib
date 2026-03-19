/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type UserProfileSchema = {
    name: string;
    title?: string;
    about?: string;
    pictureURL?: string;
    backgroundPictureURL?: string;
    socialMedias?: Array<string>;
    interests?: Array<string>;
    skills?: Array<string>;
    /**
     * Whether the current tenant is a reseller (read-only, derived from auth claims)
     */
    is_reseller?: boolean;
    /**
     * Whether the current tenant is a reseller of a the tenant (read-only, derived from auth claims)
     */
    is_acting_reseller?: boolean;
};

