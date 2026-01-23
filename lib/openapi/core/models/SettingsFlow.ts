/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Kratos settings flow object (simplified representation)
 */
export type SettingsFlow = {
    /**
     * Flow ID
     */
    id?: string;
    /**
     * UI configuration for the flow
     */
    ui?: {
        /**
         * URL to submit the flow to
         */
        action?: string;
        /**
         * HTTP method to use
         */
        method?: string;
        /**
         * Form nodes for the UI
         */
        nodes?: Array<Record<string, any>>;
    };
    /**
     * When the flow expires
     */
    expires_at?: string;
    /**
     * When the flow was issued
     */
    issued_at?: string;
};

