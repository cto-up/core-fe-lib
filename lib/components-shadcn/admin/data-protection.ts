import type { RouteLocationRaw } from "vue-router";
import type { Role } from "../../openapi/core/models/Role";

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

/** The lines every app shares; an app concatenates its own sections. */
export function coreDataProtectionSections(
  t: (key: string) => string
): DataProtectionSection[] {
  const k = (key: string) => t(`core.dataProtection.core.${key}`);
  return [
    {
      title: k("rights.title"),
      lines: [
        { label: k("rights.export"), to: ORGANIZATIONS },
        { label: k("rights.leave"), to: ORGANIZATIONS },
        { label: k("rights.close"), to: ORGANIZATIONS },
      ],
    },
    {
      title: k("lifecycle.title"),
      lines: [
        { label: k("lifecycle.leftMembership"), value: k("lifecycle.days90") },
        { label: k("lifecycle.deletionGrace"), value: k("lifecycle.days30") },
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
