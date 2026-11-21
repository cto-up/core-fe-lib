/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ActivityRef } from './ActivityRef';
export type ActivityEntry = {
    id: string;
    occurredAt: string;
    /**
     * absent for a job, or once the person's account is deleted
     */
    actorId?: string;
    /**
     * the person's name when they acted
     */
    actorName?: string;
    /**
     * web, api_key, mcp, agent, voice, job or unknown
     */
    via: string;
    /**
     * the credential used, for api_key and mcp
     */
    keyId?: string;
    /**
     * "<kind>.<past tense>", e.g. "page.moved"
     */
    action: string;
    target: ActivityRef;
    scope?: ActivityRef;
    /**
     * each changed field as [before, after]
     */
    changes?: Record<string, Array<any>>;
};

