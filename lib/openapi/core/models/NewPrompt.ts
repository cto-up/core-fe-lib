/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type NewPrompt = {
    name: string;
    content: string;
    tags: Array<string>;
    parameters: Array<string>;
    /**
     * Example parameter values for the prompt
     */
    sampleParameters?: Record<string, string>;
    /**
     * Output format of the prompt execution
     */
    format: NewPrompt.format;
    /**
     * Instructions for the LLM on how to format the output
     */
    formatInstructions: string;
};
export namespace NewPrompt {
    /**
     * Output format of the prompt execution
     */
    export enum format {
        JSON = 'json',
        TEXT = 'text',
        MARKDOWN = 'markdown',
    }
}

