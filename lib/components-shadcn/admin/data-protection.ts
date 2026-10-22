import type { RouteLocationRaw } from "vue-router";
import { Role } from "../../openapi/core/models/Role";

/**
 * One line of the Data protection page: a feature, its current value or
 * status, and where it is set or read. `to` is an in-app route, `href` opens
 * in a new tab. A line whose `requires` the viewer lacks shows no link.
 */
export type DataProtectionLine = {
  label: string;
  value?: string;
  to?: RouteLocationRaw;
  href?: string;
  requires?: Role;
};

export type DataProtectionSection = {
  title: string;
  lines: DataProtectionLine[];
};

const ORGANIZATIONS = "/user/me/organizations";
const PENDING_DELETIONS = "/admin/pending-deletions";
const USERS = "/users";

/** The lines every app shares; an app concatenates its own sections. */
export function coreDataProtectionSections(
  t: (key: string) => string
): DataProtectionSection[] {
  const k = (key: string) => t(`core.dataProtection.core.${key}`);
  return [
    {
      title: k("yourself.title"),
      lines: (["export", "leave", "close"] as const).map((right) => ({
        label: k(`yourself.${right}`),
        value: k("yourself.where"),
        to: ORGANIZATIONS,
      })),
    },
    {
      title: k("member.title"),
      lines: (["export", "leave", "close"] as const).map((right) => ({
        label: k(`member.${right}`),
        value: k("member.where"),
        to: USERS,
        requires: Role.ADMIN,
      })),
    },
    {
      title: k("lifecycle.title"),
      lines: [
        { label: k("lifecycle.leftMembership"), value: k("lifecycle.days90") },
        { label: k("lifecycle.deletionGrace"), value: k("lifecycle.days30") },
        {
          label: k("lifecycle.pendingDeletions"),
          to: PENDING_DELETIONS,
          requires: Role.ADMIN,
        },
      ],
    },
    {
      title: k("legal.title"),
      lines: [
        { label: k("legal.privacy"), href: "/privacy" },
        { label: k("legal.terms"), href: "/terms" },
        { label: k("legal.cookies"), href: "/cookies" },
      ],
    },
  ];
}
