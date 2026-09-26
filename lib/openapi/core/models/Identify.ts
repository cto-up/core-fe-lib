/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type Identify = {
    email: string;
    /**
     * Where the emailed link lands once the password is set — an app path (`/lms/courses/x`) or an absolute URL on the caller's base domain. Anything else is dropped silently and the link lands on the default home.
     *
     */
    returnTo?: string;
};

