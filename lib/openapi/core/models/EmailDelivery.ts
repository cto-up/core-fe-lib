/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { EmailDeliveryStatus } from './EmailDeliveryStatus';
export type EmailDelivery = {
    id: string;
    createdAt: string;
    /**
     * what the mail was, e.g. "core.password_reset"
     */
    kind: string;
    /**
     * workflow_run | agent_run
     */
    originType?: string | null;
    originId?: string | null;
    /**
     * "system" for the platform relay, else the mail connection id
     */
    account: string;
    /**
     * e.g. "j***@acme.com"
     */
    recipientMasked: string;
    recipientRole: EmailDelivery.recipientRole;
    status: EmailDeliveryStatus;
    smtpCode?: number | null;
    /**
     * compose | dial | tls | auth | timeout | connection | sender_rejected | recipient_rejected | message_rejected
     */
    errorClass?: string | null;
    messageId?: string | null;
};
export namespace EmailDelivery {
    export enum recipientRole {
        EmailDeliveryRecipientRoleTo = 'to',
        EmailDeliveryRecipientRoleCc = 'cc',
        EmailDeliveryRecipientRoleBcc = 'bcc',
    }
}

