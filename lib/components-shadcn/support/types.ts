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
}
