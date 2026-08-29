/** Which desk a message goes to. `technical` is the only one that collects
 *  diagnostics (screenshot + recent console lines). */
export type SupportTopic = "technical" | "sales" | "enterprise" | "other";

/** The compose target the user picks; remembered across sessions. */
export type SupportProvider = "mailto" | "gmail" | "outlook";

export interface SupportConfig {
  /** Mailbox for everything that isn't a technical problem. */
  contactEmail: string;
  /** Mailbox for technical problems. Falls back to `contactEmail`. */
  supportEmail?: string;
  /** Product name used in the subject tag, e.g. `[Acme support]`. */
  appName?: string;
  /** Explicit domain to derive the mailboxes from. Overrides every other
   *  source; leave unset to derive from the deployment. */
  domain?: string;
}

/** What an error-triggered report carries into the draft. Built by `useErrors`
 *  at the moment of failure, so the user only has to write what they were
 *  trying to do. */
export interface SupportErrorContext {
  /** Short, human-quotable id shown in the toast, e.g. `ERR-8F3A21C0`. */
  reference: string;
  /** Sentry's own event id when Sentry accepted the event — the full id, so a
   *  report can be matched to the event even though the toast shows a prefix. */
  eventId?: string;
  /** HTTP status, when the failure came from the API. */
  status?: number;
  /** `METHOD /route/{template}` — the route template, not the concrete URL, so
   *  no ids leak into the draft. */
  endpoint?: string;
  /** The server's own message, when it sent one. */
  serverMessage?: string;
  /** The toast this report was launched from. It stays on screen while the
   *  dialog is open — so the screenshot shows the error the user actually saw —
   *  and is dismissed when the dialog closes. */
  toastId?: string;
}

/** What a host app passes as the `support` prop. `true` derives everything
 *  from the deployment's domain; an object overrides individual fields. */
export type SupportConfigInput = boolean | Partial<SupportConfig>;
