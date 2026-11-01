/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * accepted = the relay took it (not "delivered"); rejected = the relay refused it; failed = it never reached a relay
 */
export enum EmailDeliveryStatus {
    EmailDeliveryStatusAccepted = 'accepted',
    EmailDeliveryStatusRejected = 'rejected',
    EmailDeliveryStatusFailed = 'failed',
}
