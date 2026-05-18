<template>
  <div class="flex flex-col gap-2">
    <Label
      v-if="label"
      class="text-xs font-semibold uppercase tracking-wider text-muted-foreground/80"
    >
      {{ label }}
    </Label>
    <div class="flex gap-2">
      <Popover v-model:open="showPicker">
        <PopoverTrigger as-child>
          <Button
            variant="outline"
            class="flex-1 justify-start text-left font-normal h-11 border-muted-foreground/20 hover:border-primary/50 transition-colors shadow-sm"
          >
            <div class="flex items-center gap-3 w-full">
              <div
                class="h-6 w-6 rounded-md border shadow-inner shrink-0 relative overflow-hidden"
                :style="modelValue ? { backgroundColor: modelValue } : {}"
              >
                <div
                  v-if="!modelValue"
                  class="absolute inset-0 bg-[url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAQAAAAECAYAAACp8Z5+AAAAAXNSR0IArs4c6QAAACBJREFUGFdjZEADJgY0QCmYwYCOwYCOAY6BJYAGmIAHAA6oAgU8oE9hAAAAAElFTkSuQmCC')] bg-repeat"
                />
              </div>
              <span class="font-mono text-sm uppercase">{{
                modelValue || "None"
              }}</span>
              <div class="ml-auto opacity-40">
                <Pipette class="h-4 w-4" />
              </div>
            </div>
          </Button>
        </PopoverTrigger>
        <PopoverContent
          class="w-80 p-0 shadow-2xl border-muted/40 overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        >
          <div class="p-4 space-y-4">
            <!-- SV Selector -->
            <div
              ref="svArea"
              class="relative w-full h-40 rounded-lg cursor-crosshair overflow-hidden border border-muted/20"
              :style="{ backgroundColor: `hsl(${hsv.h}, 100%, 50%)` }"
              @mousedown="startDraggingSV"
            >
              <div
                class="absolute inset-0 bg-gradient-to-r from-white to-transparent"
              />
              <div
                class="absolute inset-0 bg-gradient-to-t from-black to-transparent"
              />
              <div
                class="absolute h-4 w-4 rounded-full border-2 border-white shadow-md -translate-x-2 -translate-y-2 pointer-events-none"
                :style="{ left: `${hsv.s}%`, bottom: `${hsv.v}%` }"
              />
            </div>

            <div class="flex gap-4 items-center">
              <div
                class="h-10 w-10 rounded-full border shadow-inner shrink-0 relative overflow-hidden"
                :style="modelValue ? { backgroundColor: modelValue } : {}"
              >
                <div
                  v-if="!modelValue"
                  class="absolute inset-0 bg-[url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAQAAAAECAYAAACp8Z5+AAAAAXNSR0IArs4c6QAAACBJREFUGFdjZEADJgY0QCmYwYCOwYCOAY6BJYAGmIAHAA6oAgU8oE9hAAAAAElFTkSuQmCC')] bg-repeat"
                />
              </div>

              <div
                ref="hueSlider"
                class="flex-1 h-3 rounded-full cursor-pointer relative border border-muted/20"
                style="
                  background: linear-gradient(
                    to right,
                    #ff0000 0%,
                    #ffff00 17%,
                    #00ff00 33%,
                    #00ffff 50%,
                    #0000ff 67%,
                    #ff00ff 83%,
                    #ff0000 100%
                  );
                "
                @mousedown="startDraggingHue"
              >
                <div
                  class="absolute top-1/2 -mt-2.5 h-5 w-5 rounded-full border-2 border-white shadow-lg -translate-x-2.5 bg-white pointer-events-none"
                  :style="{ left: `${(hsv.h / 360) * 100}%` }"
                >
                  <div
                    class="w-full h-full rounded-full"
                    :style="{ backgroundColor: `hsl(${hsv.h}, 100%, 50%)` }"
                  />
                </div>
              </div>
            </div>

            <!-- Manual Input Group (Simplified to avoid nested Radix Tabs conflict) -->
            <div class="space-y-3">
              <div class="flex p-1 bg-muted/30 rounded-lg gap-1">
                <button
                  v-for="tab in ['HEX', 'RGB', 'HSL']"
                  :key="tab"
                  class="flex-1 py-1 text-[10px] font-bold rounded-md transition-all uppercase tracking-wider"
                  :class="
                    manualTab === tab
                      ? 'bg-background shadow-sm text-foreground'
                      : 'text-muted-foreground hover:bg-muted/50'
                  "
                  @click="manualTab = tab"
                >
                  {{ tab }}
                </button>
              </div>

              <div
                v-if="manualTab === 'HEX'"
                class="relative animate-in fade-in slide-in-from-top-1 duration-200"
              >
                <span
                  class="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-mono text-sm leading-none"
                  >#</span
                >
                <Input
                  :model-value="modelValue ? modelValue.replace('#', '') : ''"
                  placeholder="000000"
                  class="h-9 pl-7 font-mono text-sm uppercase focus-visible:ring-1"
                  @update:model-value="(val) => updateFromHex(val.toString())"
                />
              </div>

              <div
                v-else-if="manualTab === 'RGB'"
                class="grid grid-cols-3 gap-2 animate-in fade-in slide-in-from-top-1 duration-200"
              >
                <div class="space-y-1 text-center">
                  <Input
                    :model-value="rgb.r"
                    type="number"
                    min="0"
                    max="255"
                    class="h-8 px-1 text-center text-xs font-mono"
                    @update:model-value="
                      (val) => updateFromRgb('r', val.toString())
                    "
                  />
                  <Label class="text-[9px] uppercase text-muted-foreground"
                    >RED</Label
                  >
                </div>
                <div class="space-y-1 text-center">
                  <Input
                    :model-value="rgb.g"
                    type="number"
                    min="0"
                    max="255"
                    class="h-8 px-1 text-center text-xs font-mono"
                    @update:model-value="
                      (val) => updateFromRgb('g', val.toString())
                    "
                  />
                  <Label class="text-[9px] uppercase text-muted-foreground"
                    >GREEN</Label
                  >
                </div>
                <div class="space-y-1 text-center">
                  <Input
                    :model-value="rgb.b"
                    type="number"
                    min="0"
                    max="255"
                    class="h-8 px-1 text-center text-xs font-mono"
                    @update:model-value="
                      (val) => updateFromRgb('b', val.toString())
                    "
                  />
                  <Label class="text-[9px] uppercase text-muted-foreground"
                    >BLUE</Label
                  >
                </div>
              </div>

              <div
                v-else
                class="grid grid-cols-3 gap-2 animate-in fade-in slide-in-from-top-1 duration-200"
              >
                <div class="space-y-1 text-center">
                  <Input
                    :model-value="Math.round(hsv.h)"
                    type="number"
                    min="0"
                    max="360"
                    class="h-8 px-1 text-center text-xs font-mono"
                    @update:model-value="
                      (val) => updateFromHsv('h', val.toString())
                    "
                  />
                  <Label class="text-[9px] uppercase text-muted-foreground"
                    >HUE</Label
                  >
                </div>
                <div class="space-y-1 text-center">
                  <Input
                    :model-value="Math.round(hsv.s)"
                    type="number"
                    min="0"
                    max="100"
                    class="h-8 px-1 text-center text-xs font-mono"
                    @update:model-value="
                      (val) => updateFromHsv('s', val.toString())
                    "
                  />
                  <Label class="text-[9px] uppercase text-muted-foreground"
                    >SAT</Label
                  >
                </div>
                <div class="space-y-1 text-center">
                  <Input
                    :model-value="Math.round(hsv.v)"
                    type="number"
                    min="0"
                    max="100"
                    class="h-8 px-1 text-center text-xs font-mono"
                    @update:model-value="
                      (val) => updateFromHsv('v', val.toString())
                    "
                  />
                  <Label class="text-[9px] uppercase text-muted-foreground"
                    >BRT</Label
                  >
                </div>
              </div>
            </div>

            <!-- Presets -->
            <div class="pt-2 border-t border-muted">
              <div class="flex items-center justify-between mb-2 px-1">
                <p
                  class="text-[10px] font-bold uppercase tracking-widest text-muted-foreground"
                >
                  Presets
                </p>
                <Button
                  variant="ghost"
                  size="xs"
                  class="h-5 text-[10px] hover:text-destructive p-0"
                  @click="clearColor"
                >
                  Clear All
                </Button>
              </div>
              <ScrollArea class="h-24 w-full">
                <div class="grid grid-cols-8 gap-1.5 pr-3 pb-2">
                  <button
                    v-for="color in presets"
                    :key="color"
                    class="h-6 w-6 rounded-md border border-muted/30 cursor-pointer hover:scale-110 active:scale-95 transition-all duration-200 shadow-sm relative group"
                    :style="{ backgroundColor: color }"
                    @click="updateColor(color)"
                  >
                    <Check
                      v-if="modelValue === color"
                      class="h-2 w-2 absolute inset-0 m-auto text-white drop-shadow-md"
                    />
                    <Check
                      v-if="modelValue === color && isBright(color)"
                      class="h-2 w-2 absolute inset-0 m-auto text-black"
                    />
                  </button>
                </div>
              </ScrollArea>
            </div>
          </div>
        </PopoverContent>
      </Popover>

      <Button
        v-if="modelValue"
        variant="ghost"
        size="icon"
        class="h-11 w-11 shrink-0 border border-muted-foreground/20 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
        title="Clear color"
        @click="clearColor"
      >
        <X class="h-4 w-4" />
      </Button>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, reactive, watch, onMounted, onUnmounted } from "vue";
import { Button } from "../ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "../ui/popover";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { ScrollArea } from "../ui/scroll-area";
import { Pipette, Check, X } from "lucide-vue-next";

const props = defineProps({
  label: { type: String, required: false },
  modelValue: { type: String, default: "" },
});

const emit = defineEmits(["update:modelValue"]);

const showPicker = ref(false);
const manualTab = ref("HEX");
const hsv = reactive({ h: 0, s: 100, v: 100 });
const rgb = reactive({ r: 255, g: 255, b: 255 });

const svArea = ref<HTMLElement | null>(null);
const hueSlider = ref<HTMLElement | null>(null);

// Presets
const presets = [
  "#6366f1",
  "#3b82f6",
  "#0ea5e9",
  "#10b981",
  "#84cc16",
  "#eab308",
  "#f59e0b",
  "#f97316",
  "#ef4444",
  "#dc2626",
  "#b91c1c",
  "#991b1b",
  "#8b5cf6",
  "#d946ef",
  "#ec4899",
  "#f43f5e",
  "#71717a",
  "#3f3f46",
  "#18181b",
  "#000000",
  "#ffffff",
  "#4ade80",
  "#2dd4bf",
  "#22d3ee",
];

// Dragging Logic
const dragging = ref(false);
const currentDrag = ref<"sv" | "hue" | null>(null);

// Initialize from prop
watch(
  () => props.modelValue,
  (val) => {
    if (!dragging.value) {
      if (val) {
        const parsed = hexToRgb(val);
        if (parsed) {
          Object.assign(rgb, parsed);
          const parsedHsv = rgbToHsv(rgb.r, rgb.g, rgb.b);
          Object.assign(hsv, parsedHsv);
        }
      } else {
        // Deep clear - reset to a default white state for the UI
        rgb.r = 255;
        rgb.g = 255;
        rgb.b = 255;
        hsv.h = 0;
        hsv.s = 0;
        hsv.v = 100;
      }
    }
  },
  { immediate: true }
);

function updateColor(hex: string) {
  emit("update:modelValue", hex);
  // Immediate local sync for responsiveness
  const parsed = hexToRgb(hex);
  if (parsed) {
    Object.assign(rgb, parsed);
    const parsedHsv = rgbToHsv(rgb.r, rgb.g, rgb.b);
    Object.assign(hsv, parsedHsv);
  }
}

function clearColor() {
  emit("update:modelValue", "");
  rgb.r = 255;
  rgb.g = 255;
  rgb.b = 255;
  hsv.h = 0;
  hsv.s = 0;
  hsv.v = 100;
}

function startDraggingSV(e: MouseEvent) {
  currentDrag.value = "sv";
  handleDrag(e);
  window.addEventListener("mousemove", handleDrag);
  window.addEventListener("mouseup", stopDragging);
}

function startDraggingHue(e: MouseEvent) {
  currentDrag.value = "hue";
  handleDrag(e);
  window.addEventListener("mousemove", handleDrag);
  window.addEventListener("mouseup", stopDragging);
}

function handleDrag(e: MouseEvent) {
  dragging.value = true;
  if (currentDrag.value === "sv" && svArea.value) {
    const rect = svArea.value.getBoundingClientRect();
    let s = ((e.clientX - rect.left) / rect.width) * 100;
    let v = 100 - ((e.clientY - rect.top) / rect.height) * 100;
    hsv.s = Math.max(0, Math.min(100, s));
    hsv.v = Math.max(0, Math.min(100, v));
    commitHsv();
  } else if (currentDrag.value === "hue" && hueSlider.value) {
    const rect = hueSlider.value.getBoundingClientRect();
    let h = ((e.clientX - rect.left) / rect.width) * 360;
    hsv.h = Math.max(0, Math.min(360, h));
    commitHsv();
  }
}

function stopDragging() {
  dragging.value = false;
  currentDrag.value = null;
  window.removeEventListener("mousemove", handleDrag);
  window.removeEventListener("mouseup", stopDragging);
}

function commitHsv() {
  const result = hsvToRgb(hsv.h, hsv.s, hsv.v);
  rgb.r = result.r;
  rgb.g = result.g;
  rgb.b = result.b;
  emit("update:modelValue", rgbToHex(rgb.r, rgb.g, rgb.b));
}

// Update From Manual
function updateFromHex(val: string) {
  let hex = val.trim();
  if (!hex.startsWith("#")) hex = "#" + hex;

  // Validate 3 or 6 digit hex
  if (/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(hex)) {
    emit("update:modelValue", hex);

    // Sync local state immediately for instant visual feedback on sliders/wheel
    const parsed = hexToRgb(hex);
    if (parsed) {
      Object.assign(rgb, parsed);
      const newHsv = rgbToHsv(rgb.r, rgb.g, rgb.b);
      Object.assign(hsv, newHsv);
    }
  }
}

function updateFromRgb(key: "r" | "g" | "b", val: string) {
  const num = parseInt(val) || 0;
  rgb[key] = Math.max(0, Math.min(255, num));
  const newHsv = rgbToHsv(rgb.r, rgb.g, rgb.b);
  hsv.h = newHsv.h;
  hsv.s = newHsv.s;
  hsv.v = newHsv.v;
  emit("update:modelValue", rgbToHex(rgb.r, rgb.g, rgb.b));
}

function updateFromHsv(key: "h" | "s" | "v", val: string) {
  const num = parseInt(val) || 0;
  hsv[key] = Math.max(0, Math.min(key === "h" ? 360 : 100, num));
  commitHsv();
}

// Helpers
function isBright(hex: string) {
  const r = hexToRgb(hex);
  if (!r) return false;
  return r.r * 0.299 + r.g * 0.587 + r.b * 0.114 > 186;
}

function rgbToHex(r: number, g: number, b: number) {
  return (
    "#" +
    ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase()
  );
}

function hexToRgb(hex: string) {
  const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
  hex = hex.replace(shorthandRegex, (m, r, g, b) => r + r + g + g + b + b);
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
}

function rgbToHsv(r: number, g: number, b: number) {
  ((r /= 255), (g /= 255), (b /= 255));
  const max = Math.max(r, g, b),
    min = Math.min(r, g, b);
  let h,
    s,
    v = max;
  const d = max - min;
  s = max === 0 ? 0 : d / max;
  if (max === min) {
    h = 0;
  } else {
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h /= 6;
  }
  return { h: h * 360, s: s * 100, v: v * 100 };
}

function hsvToRgb(h: number, s: number, v: number) {
  ((h /= 360), (s /= 100), (v /= 100));
  let r, g, b;
  const i = Math.floor(h * 6);
  const f = h * 6 - i;
  const p = v * (1 - s);
  const q = v * (1 - f * s);
  const t = v * (1 - (1 - f) * s);
  switch (i % 6) {
    case 0:
      ((r = v), (g = t), (b = p));
      break;
    case 1:
      ((r = q), (g = v), (b = p));
      break;
    case 2:
      ((r = p), (g = v), (b = t));
      break;
    case 3:
      ((r = p), (g = q), (b = v));
      break;
    case 4:
      ((r = t), (g = p), (b = v));
      break;
    case 5:
      ((r = v), (g = p), (b = q));
      break;
  }
  return {
    r: Math.round(r * 255),
    g: Math.round(g * 255),
    b: Math.round(b * 255),
  };
}
</script>
