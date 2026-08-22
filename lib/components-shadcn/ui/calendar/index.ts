export { default as Calendar } from "./Calendar.vue";
// v-calendar ships this type at dist/types/src/...; the "@/" in the old path was
// its internal build alias, which never existed on disk in the published package.
import type { CalendarSlotName } from "v-calendar/dist/types/src/components/Calendar/CalendarSlot.vue";

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
