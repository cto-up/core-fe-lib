/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type SocialSignInResult = {
    /**
     * True when this call created the tenant membership, false when the identity was already a member. Callers use it only for telemetry — either way the session is usable once the response is 200, though the client must re-read the session before relying on its roles.
     *
     */
    provisioned: boolean;
};

