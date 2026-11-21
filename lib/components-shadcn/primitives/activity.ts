import type { ActivityEntry } from "../../openapi/core/models/ActivityEntry";

export type Translate = (
  key: string,
  named?: Record<string, unknown>
) => string;

// What an app says about a row in its own words, with the page's translate;
// undefined falls back to the generic wording below (office#201).
export type DescribeActivity = (
  e: ActivityEntry,
  t: Translate
) => string | undefined;

const words = (s: string) => s.replace(/_/g, " ");

// "page.renamed" reads "renamed page": the generic wording an app replaces.
export function actionWords(action: string): string {
  const [kind, ...verb] = action.split(".");
  return verb.length
    ? `${words(verb.join("."))} ${words(kind)}`
    : words(action);
}

const shown = (v: unknown): string =>
  v === null || v === undefined || v === ""
    ? "—"
    : typeof v === "object"
      ? JSON.stringify(v)
      : String(v);

// Each changed field as "field: before → after", or "field: after" when it
// had no value before.
export function changeWords(e: ActivityEntry): string {
  return Object.entries(e.changes ?? {})
    .map(([field, [before, after]]) =>
      before === null || before === undefined
        ? `${words(field)}: ${shown(after)}`
        : `${words(field)}: ${shown(before)} → ${shown(after)}`
    )
    .join(" · ");
}

export function describeActivity(
  e: ActivityEntry,
  t: Translate,
  describe?: DescribeActivity
): string {
  const own = describe?.(e, t);
  if (own) return own;
  const changes = changeWords(e);
  return changes
    ? `${actionWords(e.action)} — ${changes}`
    : actionWords(e.action);
}

// Who acted: their name as it was, or why there is none.
export function actorWords(e: ActivityEntry, t: Translate): string {
  if (e.actorName) return e.actorName;
  if (e.via === "job") return t("core.activity.job");
  return t("core.activity.deletedUser");
}

const VIAS = ["web", "api_key", "mcp", "agent", "voice", "job", "unknown"];

export function viaWords(via: string, t: Translate): string {
  return t(`core.activity.via.${VIAS.includes(via) ? via : "unknown"}`);
}
