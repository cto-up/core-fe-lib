import { ref } from "vue";
import type { FloatPosition } from "../composables/useDraggableFloat";

// The update and install banners take turns in ONE bottom slot — never
// stacked, update first. Sharing the dragged position keeps that slot where
// the user moved it, whichever banner occupies it next.
export const pwaPromptPosition = ref<FloatPosition>(null);
