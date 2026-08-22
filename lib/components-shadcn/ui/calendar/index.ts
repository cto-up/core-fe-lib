export { default as Calendar } from "./Calendar.vue";
// Declared here rather than imported. v-calendar exports this union only from a
// deep dist path, and the one this file used ("dist/types/@/components/...")
// contained "@/", its internal build alias, which does not exist in the
// published package — so the guard below was checking against an unresolved
// type. The real path is not reachable under Bundler resolution either, so the
// union is stated locally and kept in step with validSlots below.
export type CalendarSlotName =
  | "day-content"
  | "day-popover"
  | "dp-footer"
  | "footer"
  | "header-title-wrapper"
  | "header-title"
  | "header-prev-button"
  | "header-next-button"
  | "nav"
  | "nav-prev-button"
  | "nav-next-button"
  | "page"
  | "time-header";

export function isVCalendarSlot(
  slotName: string
): slotName is CalendarSlotName {
  const validSlots: CalendarSlotName[] = [
    "day-content",
    "day-popover",
    "dp-footer",
    "footer",
    "header-title-wrapper",
    "header-title",
    "header-prev-button",
    "header-next-button",
    "nav",
    "nav-prev-button",
    "nav-next-button",
    "page",
    "time-header",
  ];

  return validSlots.includes(slotName as CalendarSlotName);
}
