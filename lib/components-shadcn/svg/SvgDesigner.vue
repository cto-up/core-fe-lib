<!--
  SvgDesigner — a small visual editor for themed SVG drawings. Shapes are
  coloured by ROLE (svgTheme.ts), never by value, so the drawing follows any
  theme it is shown in. Knows nothing about lessons: the host persists the
  `save` payload. Built on EditorShell (save/cancel/dirty, phone bottom sheet).
-->
<template>
  <EditorShell
    :title="title ?? t('svgDesigner.title')"
    :dirty="dirty"
    :saving="saving"
    :error="error"
    :panel-label="t('svgDesigner.properties')"
    @save="onSave"
    @cancel="emit('cancel')"
  >
    <template #toolbar>
      <div class="hidden items-center gap-1 sm:flex">
        <slot name="toolbar" />
      </div>
    </template>

    <div class="flex h-full min-h-0 flex-col">
      <!-- Tools -->
      <div
        class="flex flex-wrap items-center gap-1 border-b px-2 py-1"
        role="toolbar"
        :aria-label="t('svgDesigner.title')"
      >
        <Button
          v-for="tl in toolList"
          :key="tl.id"
          type="button"
          size="icon"
          :variant="tool === tl.id ? 'secondary' : 'ghost'"
          class="h-11 w-11 sm:h-9 sm:w-9"
          :aria-pressed="tool === tl.id"
          :aria-label="t(`svgDesigner.tools.${tl.id}`)"
          :title="t(`svgDesigner.tools.${tl.id}`)"
          @click="pickTool(tl.id)"
        >
          <component :is="tl.icon" class="h-4 w-4" aria-hidden="true" />
        </Button>
        <span class="mx-1 h-6 w-px bg-border" aria-hidden="true" />
        <Button
          type="button"
          size="icon"
          variant="ghost"
          class="h-11 w-11 sm:h-9 sm:w-9"
          :disabled="!history.canUndo"
          :aria-label="t('svgDesigner.undo')"
          :title="t('svgDesigner.undo')"
          @click="undo"
        >
          <Undo2 class="h-4 w-4" aria-hidden="true" />
        </Button>
        <Button
          type="button"
          size="icon"
          variant="ghost"
          class="h-11 w-11 sm:h-9 sm:w-9"
          :disabled="!history.canRedo"
          :aria-label="t('svgDesigner.redo')"
          :title="t('svgDesigner.redo')"
          @click="redo"
        >
          <Redo2 class="h-4 w-4" aria-hidden="true" />
        </Button>
        <div v-if="themes?.length" class="ml-auto">
          <ThemePreviewSwitcher
            v-model:theme="themeId"
            v-model:dark="previewDark"
            :themes="themes.map((th) => ({ id: th.name, label: th.label }))"
          />
        </div>
      </div>

      <!-- Notices -->
      <div
        v-if="notice"
        role="status"
        class="flex flex-wrap items-center gap-2 border-b px-3 py-2 text-sm"
        :class="
          notice.kind === 'error' ? 'bg-error/10 text-error' : 'bg-muted/50'
        "
      >
        <TriangleAlert
          v-if="notice.kind === 'error'"
          class="h-4 w-4"
          aria-hidden="true"
        />
        <span class="min-w-0 flex-1">{{ notice.text }}</span>
        <Button
          v-if="notice.action"
          type="button"
          size="sm"
          variant="outline"
          @click="notice.action.run()"
        >
          {{ notice.action.label }}
        </Button>
        <button
          type="button"
          class="inline-flex h-8 w-8 items-center justify-center rounded"
          :aria-label="t('actions.close')"
          @click="notice = null"
        >
          <X class="h-4 w-4" aria-hidden="true" />
        </button>
      </div>

      <!-- Icon picker -->
      <div v-if="tool === 'icon'" class="border-b p-2">
        <Input
          v-model="iconQuery"
          :placeholder="t('svgDesigner.iconSearch')"
          :aria-label="t('svgDesigner.iconSearch')"
          class="mb-2 h-9"
        />
        <div class="flex max-h-28 flex-wrap gap-1 overflow-y-auto">
          <button
            v-for="ic in filteredIcons"
            :key="ic.name"
            type="button"
            class="inline-flex h-11 w-11 items-center justify-center rounded hover:bg-muted"
            :aria-label="ic.name"
            :title="ic.name"
            @click="insertIcon(ic)"
          >
            <component :is="ic.icon" class="h-5 w-5" aria-hidden="true" />
          </button>
          <p v-if="!filteredIcons.length" class="text-sm text-muted-foreground">
            {{ t("svgDesigner.noIcons") }}
          </p>
        </div>
      </div>

      <!-- Canvas -->
      <div
        ref="stage"
        class="relative min-h-0 flex-1 overflow-auto bg-muted/40 p-3 outline-none sm:p-6"
        :class="previewDark ? 'dark' : ''"
        tabindex="0"
        role="application"
        :aria-label="t('svgDesigner.title')"
        @keydown="onKeydown"
        @paste="onPaste"
      >
        <div
          class="themed-svg relative mx-auto w-full max-w-4xl"
          :data-svg-scope="scopeId"
          :style="{ aspectRatio: `${artboard.width} / ${artboard.height}` }"
        >
          <component :is="'style'">{{ canvasCss }}</component>
          <svg
            ref="svgEl"
            class="block h-full w-full touch-none select-none rounded-lg bg-card shadow-ambient"
            :viewBox="`0 0 ${artboard.width} ${artboard.height}`"
            @pointerdown="onCanvasDown"
            @pointermove="onPointerMove"
            @pointerup="onPointerUp"
            @pointercancel="onPointerUp"
            @dblclick="onDblClick"
          >
            <defs>
              <pattern
                :id="`${scopeId}-grid`"
                :width="GRID * 4"
                :height="GRID * 4"
                patternUnits="userSpaceOnUse"
              >
                <path
                  :d="`M ${GRID * 4} 0 L 0 0 0 ${GRID * 4}`"
                  fill="none"
                  class="t-stroke-line"
                  stroke-width="0.5"
                  opacity="0.5"
                />
              </pattern>
            </defs>
            <rect
              :width="artboard.width"
              :height="artboard.height"
              :fill="`url(#${scopeId}-grid)`"
              pointer-events="none"
            />
            <g pointer-events="none" v-html="shapesMarkup" />
            <text
              v-if="!shapes.length"
              :x="artboard.width / 2"
              :y="artboard.height / 2"
              text-anchor="middle"
              class="t-fill-muted"
              :font-size="minText * 0.8"
              pointer-events="none"
            >
              {{ t("svgDesigner.empty") }}
            </text>
            <!-- Hit areas -->
            <rect
              v-for="s in visibleShapes"
              :key="`hit-${s.id}`"
              :x="Math.min(s.x, s.x + s.w) - hitPad(s)"
              :y="Math.min(s.y, s.y + s.h) - hitPad(s)"
              :width="Math.abs(s.w) + hitPad(s) * 2"
              :height="Math.abs(s.h) + hitPad(s) * 2"
              fill="transparent"
              class="cursor-move"
              @pointerdown.stop="onShapeDown($event, s)"
            />
            <!-- Guides -->
            <line
              v-for="(g, i) in guideLines"
              :key="`g${i}`"
              v-bind="g"
              stroke="hsl(330 85% 60%)"
              stroke-width="1"
              pointer-events="none"
            />
            <!-- Selection -->
            <g
              v-for="s in selectedShapes"
              :key="`sel-${s.id}`"
              pointer-events="none"
            >
              <rect
                :x="Math.min(s.x, s.x + s.w)"
                :y="Math.min(s.y, s.y + s.h)"
                :width="Math.abs(s.w)"
                :height="Math.abs(s.h)"
                fill="none"
                stroke="hsl(var(--ring, 215 20% 65%))"
                stroke-width="1.5"
                stroke-dasharray="4 3"
              />
            </g>
            <template v-if="selectedShapes.length === 1">
              <rect
                v-for="hd in handles"
                :key="hd.id"
                :x="hd.x - handleSize / 2"
                :y="hd.y - handleSize / 2"
                :width="handleSize"
                :height="handleSize"
                rx="2"
                class="t-fill-surface"
                stroke="hsl(var(--ring, 215 20% 65%))"
                stroke-width="1.5"
                :style="{ cursor: hd.cursor }"
                @pointerdown.stop="onHandleDown($event, hd.id)"
              />
            </template>
          </svg>
          <input
            v-if="editingText"
            ref="textInput"
            v-model="editingText.value"
            class="absolute rounded border bg-background px-1 text-center text-sm"
            :style="editingText.style"
            :aria-label="t('svgDesigner.text')"
            @keydown.enter.prevent.stop="commitText"
            @keydown.esc.prevent.stop="cancelText"
            @blur="commitText"
          />
        </div>
      </div>
      <div class="sr-only" aria-live="polite">{{ announcement }}</div>
    </div>

    <template #panel>
      <div :data-svg-scope="scopeId">
        <div class="flex border-b" role="tablist">
          <button
            v-for="tab in ['properties', 'layers'] as const"
            :key="tab"
            type="button"
            role="tab"
            class="min-h-11 flex-1 px-3 text-sm"
            :class="
              panelTab === tab
                ? 'border-b-2 border-primary font-medium'
                : 'text-muted-foreground'
            "
            :aria-selected="panelTab === tab"
            @click="panelTab = tab"
          >
            {{ t(`svgDesigner.${tab}`) }}
          </button>
        </div>

        <!-- Properties -->
        <div v-if="panelTab === 'properties'" class="space-y-4 p-4 text-sm">
          <template v-if="!selectedShapes.length">
            <p class="text-muted-foreground">
              {{ t("svgDesigner.noSelection") }}
            </p>
            <section
              v-if="shapes.length"
              :aria-label="t('svgDesigner.contrast')"
            >
              <h3 class="mb-1 font-medium">{{ t("svgDesigner.contrast") }}</h3>
              <p
                v-if="!contrastIssues.length"
                class="flex items-center gap-1 text-muted-foreground"
              >
                <Check class="h-4 w-4" aria-hidden="true" />{{
                  t("svgDesigner.contrastOk")
                }}
              </p>
              <ul v-else class="space-y-1">
                <li v-for="iss in contrastIssues" :key="iss.id">
                  <button
                    type="button"
                    class="flex min-h-11 w-full items-center gap-2 rounded px-2 text-left text-error hover:bg-error/10"
                    @click="selectOnly(iss.id)"
                  >
                    <TriangleAlert
                      class="h-4 w-4 shrink-0"
                      aria-hidden="true"
                    />
                    <span class="min-w-0 flex-1 truncate">{{ iss.name }}</span>
                    <span class="font-mono text-xs"
                      >{{ iss.ratio.toFixed(1) }}:1</span
                    >
                  </button>
                  <button
                    v-if="iss.fix"
                    type="button"
                    class="ml-8 text-xs underline underline-offset-2"
                    @click="applyContrastFix(iss.id, iss.fix)"
                  >
                    {{
                      t("svgDesigner.useRole", { role: roleLabels[iss.fix] })
                    }}
                  </button>
                </li>
              </ul>
            </section>
          </template>
          <template v-else>
            <div v-if="single && single.type === 'text'">
              <label class="mb-1 block font-medium" :for="`${scopeId}-text`">{{
                t("svgDesigner.text")
              }}</label>
              <Input
                :id="`${scopeId}-text`"
                :model-value="single.text ?? ''"
                @update:model-value="(v) => patchSelected({ text: String(v) })"
              />
            </div>
            <fieldset v-if="!single || single.type !== 'line'">
              <legend class="mb-1 font-medium">
                {{ t("svgDesigner.fill") }}
              </legend>
              <RoleSwatches
                :value="common('fill')"
                :labels="roleLabels"
                :none-label="t('svgDesigner.none')"
                :scope="scopeSel"
                @pick="(r) => patchSelected({ fill: r })"
              />
            </fieldset>
            <fieldset v-if="!single || single.type !== 'text'">
              <legend class="mb-1 font-medium">
                {{ t("svgDesigner.stroke") }}
              </legend>
              <RoleSwatches
                :value="common('stroke')"
                :labels="roleLabels"
                :none-label="t('svgDesigner.none')"
                :scope="scopeSel"
                @pick="(r) => patchSelected({ stroke: r })"
              />
            </fieldset>
            <div
              v-if="
                single && single.stroke !== 'none' && single.type !== 'text'
              "
            >
              <label class="mb-1 block font-medium" :for="`${scopeId}-sw`">{{
                t("svgDesigner.strokeWidth")
              }}</label>
              <input
                :id="`${scopeId}-sw`"
                type="range"
                min="1"
                max="16"
                class="w-full"
                :value="single.strokeWidth"
                @input="
                  patchSelected({
                    strokeWidth: Number(
                      ($event.target as HTMLInputElement).value
                    ),
                  })
                "
              />
            </div>
            <div v-if="single && single.type === 'rect'">
              <label class="mb-1 block font-medium" :for="`${scopeId}-rx`">{{
                t("svgDesigner.radius")
              }}</label>
              <input
                :id="`${scopeId}-rx`"
                type="range"
                min="0"
                max="64"
                step="4"
                class="w-full"
                :value="single.rx ?? 0"
                @input="
                  patchSelected({
                    rx: Number(($event.target as HTMLInputElement).value),
                  })
                "
              />
            </div>
            <div v-if="single && single.type === 'text'" class="space-y-2">
              <label class="block font-medium" :for="`${scopeId}-fs`">{{
                t("svgDesigner.fontSize")
              }}</label>
              <Input
                :id="`${scopeId}-fs`"
                type="number"
                min="8"
                max="200"
                :model-value="single.fontSize ?? minText"
                @update:model-value="
                  (v) => patchSelected({ fontSize: Number(v) })
                "
              />
              <p
                v-if="(single.fontSize ?? minText) < minText"
                class="text-error"
              >
                {{ t("svgDesigner.tooSmall", { min: Math.round(minText) }) }}
              </p>
              <label class="flex min-h-11 items-center gap-2">
                <input
                  type="checkbox"
                  :checked="!!single.bold"
                  @change="
                    patchSelected({
                      bold: ($event.target as HTMLInputElement).checked,
                    })
                  "
                />
                {{ t("svgDesigner.bold") }}
              </label>
            </div>
            <label
              v-if="single && single.type === 'line'"
              class="flex min-h-11 items-center gap-2"
            >
              <input
                type="checkbox"
                :checked="!!single.arrow"
                @change="
                  patchSelected({
                    arrow: ($event.target as HTMLInputElement).checked,
                  })
                "
              />
              {{ t("svgDesigner.arrow") }}
            </label>
            <div v-if="selectedShapes.length > 1">
              <p class="mb-1 font-medium">{{ t("svgDesigner.align") }}</p>
              <div class="flex flex-wrap gap-1">
                <Button
                  v-for="a in alignActions"
                  :key="a.how"
                  type="button"
                  size="icon"
                  variant="outline"
                  class="h-11 w-11 sm:h-9 sm:w-9"
                  :aria-label="t(a.label)"
                  :title="t(a.label)"
                  @click="doAlign(a.how)"
                >
                  <component :is="a.icon" class="h-4 w-4" aria-hidden="true" />
                </Button>
              </div>
              <div v-if="selectedShapes.length > 2" class="mt-2 flex gap-1">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  @click="doDistribute('x')"
                >
                  {{ t("svgDesigner.distributeH") }}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  @click="doDistribute('y')"
                >
                  {{ t("svgDesigner.distributeV") }}
                </Button>
              </div>
            </div>
            <div class="flex flex-wrap gap-2 border-t pt-3">
              <Button
                type="button"
                size="sm"
                variant="outline"
                @click="duplicate"
              >
                <Copy class="mr-1 h-4 w-4" aria-hidden="true" />{{
                  t("svgDesigner.duplicate")
                }}
              </Button>
              <Button
                type="button"
                size="sm"
                variant="destructive"
                @click="removeSelected"
              >
                <Trash2 class="mr-1 h-4 w-4" aria-hidden="true" />{{
                  t("svgDesigner.delete")
                }}
              </Button>
            </div>
          </template>
        </div>

        <!-- Layers -->
        <ul
          v-else
          class="p-2 text-sm"
          role="listbox"
          :aria-label="t('svgDesigner.layers')"
          aria-multiselectable="true"
        >
          <li
            v-for="s in [...shapes].reverse()"
            :key="`layer-${s.id}`"
            role="option"
            :aria-selected="selected.has(s.id)"
            class="flex min-h-11 items-center gap-1 rounded px-2"
            :class="selected.has(s.id) ? 'bg-muted' : ''"
            tabindex="0"
            @click="selectOnly(s.id)"
            @keydown.enter.prevent="selectOnly(s.id)"
          >
            <span
              class="min-w-0 flex-1 truncate"
              :class="s.hidden ? 'text-muted-foreground line-through' : ''"
            >
              {{ s.type === "text" && s.text ? s.text : s.name }}
            </span>
            <button
              type="button"
              class="inline-flex h-9 w-9 items-center justify-center rounded"
              :aria-label="t('svgDesigner.bringForward')"
              @click.stop="reorder(s.id, 1)"
            >
              <ChevronUp class="h-4 w-4" aria-hidden="true" />
            </button>
            <button
              type="button"
              class="inline-flex h-9 w-9 items-center justify-center rounded"
              :aria-label="t('svgDesigner.sendBackward')"
              @click.stop="reorder(s.id, -1)"
            >
              <ChevronDown class="h-4 w-4" aria-hidden="true" />
            </button>
            <button
              type="button"
              class="inline-flex h-9 w-9 items-center justify-center rounded"
              :aria-label="
                s.hidden ? t('svgDesigner.show') : t('svgDesigner.hide')
              "
              @click.stop="toggleHidden(s.id)"
            >
              <EyeOff v-if="s.hidden" class="h-4 w-4" aria-hidden="true" />
              <Eye v-else class="h-4 w-4" aria-hidden="true" />
            </button>
          </li>
        </ul>
      </div>
    </template>
  </EditorShell>
</template>

<script lang="ts" setup>
import {
  computed,
  h,
  nextTick,
  reactive,
  ref,
  render,
  shallowRef,
  watch,
  type Component,
} from "vue";
import { useI18n } from "vue-i18n";
import {
  AlignCenterHorizontal,
  AlignCenterVertical,
  AlignEndHorizontal,
  AlignEndVertical,
  AlignStartHorizontal,
  AlignStartVertical,
  ArrowRight,
  BookOpen,
  Check,
  ChevronDown,
  ChevronUp,
  Circle,
  Clock,
  Cloud,
  Code,
  Copy,
  Database,
  Eye,
  EyeOff,
  File,
  Flag,
  Globe,
  Heart,
  Key,
  Lightbulb,
  Lock,
  Mail,
  MessageCircle,
  MousePointer2,
  Redo2,
  Search,
  Server,
  Settings,
  Shield,
  Square,
  Star,
  Target,
  Trash2,
  TrendingUp,
  TriangleAlert,
  Type,
  Undo2,
  User,
  Users,
  X,
  Zap,
  Smile,
  type LucideIcon,
} from "lucide-vue-next";
import EditorShell from "../editor/EditorShell.vue";
import ThemePreviewSwitcher from "../editor/ThemePreviewSwitcher.vue";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import RoleSwatches from "./designer/RoleSwatches.vue";
import {
  DEFAULT_ARTBOARD,
  GRID,
  History,
  align,
  applyRoleMapping,
  distribute,
  guidesOf,
  minTextUnits,
  nearestRole,
  newId,
  parse,
  serialize,
  snap,
  snapTo,
  type Artboard,
  type Shape,
  type ShapeType,
} from "./designer/model";
import { contrastRatio, parseColor, passes } from "./contrast";
import { exceededLimit } from "./svgLimits";
import { scopeCss } from "./svgSanitize";
import {
  SVG_ROLES,
  roleClassesCss,
  type SvgRole,
  type SvgTheme,
} from "./svgTheme";

type Tool = "select" | "rect" | "ellipse" | "line" | "text" | "icon";

const props = defineProps<{
  modelValue: string;
  themes?: SvgTheme[];
  title?: string;
  saving?: boolean;
  error?: string;
  readonly?: boolean;
}>();

const emit = defineEmits<{
  "update:modelValue": [svg: string];
  save: [svg: string];
  cancel: [];
  dirty: [isDirty: boolean];
}>();

const { t } = useI18n();

let instance = 0;
const scopeId = `sd${Date.now().toString(36)}${(instance++).toString(36)}`;
const scopeSel = `[data-svg-scope="${scopeId}"]`;

const initial = parse(props.modelValue ?? "");
const shapes = shallowRef<Shape[]>(initial.shapes);
const artboard = ref<Artboard>(
  initial.shapes.length ? initial.artboard : { ...DEFAULT_ARTBOARD }
);
const savedMarkup = ref(serialize(initial.shapes, artboard.value));
const history = reactive(new History<Shape[]>()) as History<Shape[]>;
const selected = ref<Set<string>>(new Set());
const tool = ref<Tool>("select");
const panelTab = ref<"properties" | "layers">("properties");
const themeId = ref(props.themes?.[0]?.name ?? "");
const previewDark = ref(false);
const announcement = ref("");
const notice = ref<{
  kind: "info" | "error";
  text: string;
  action?: { label: string; run: () => void };
} | null>(null);
const guideLines = ref<{ x1: number; y1: number; x2: number; y2: number }[]>(
  []
);
const stage = ref<HTMLElement | null>(null);
const svgEl = ref<SVGSVGElement | null>(null);
const textInput = ref<HTMLInputElement | null>(null);
const editingText = ref<{
  id: string;
  value: string;
  style: Record<string, string>;
} | null>(null);
const iconQuery = ref("");

const minText = computed(() => minTextUnits(artboard.value));
const handleSize = computed(() => artboard.value.width / 80);
const markup = computed(() => serialize(shapes.value, artboard.value));
const dirty = computed(() => markup.value !== savedMarkup.value);
const shapesMarkup = computed(() =>
  markup.value.replace(/^<svg[^>]*>/, "").replace(/<\/svg>$/, "")
);
const visibleShapes = computed(() => shapes.value.filter((s) => !s.hidden));
const selectedShapes = computed(() =>
  shapes.value.filter((s) => selected.value.has(s.id))
);
const single = computed(() =>
  selectedShapes.value.length === 1 ? selectedShapes.value[0] : null
);
const activeTheme = computed(() =>
  props.themes?.find((th) => th.name === themeId.value)
);
const canvasCss = computed(
  () =>
    `${roleClassesCss(scopeSel)}\n${activeTheme.value ? scopeCss(activeTheme.value.css, scopeSel) : ""}`
);
const roleLabels = computed(
  () =>
    Object.fromEntries(
      SVG_ROLES.map((r) => [r, t(`svgDesigner.roles.${r}`)])
    ) as Record<SvgRole, string>
);

watch(dirty, (d) => emit("dirty", d), { immediate: true });
watch(markup, (m) => emit("update:modelValue", m));

const toolList: { id: Tool; icon: Component }[] = [
  { id: "select", icon: MousePointer2 },
  { id: "rect", icon: Square },
  { id: "ellipse", icon: Circle },
  { id: "line", icon: ArrowRight },
  { id: "text", icon: Type },
  { id: "icon", icon: Smile },
];

const alignActions = [
  { how: "left", icon: AlignStartVertical, label: "svgDesigner.alignLeft" },
  {
    how: "center",
    icon: AlignCenterVertical,
    label: "svgDesigner.alignCenter",
  },
  { how: "right", icon: AlignEndVertical, label: "svgDesigner.alignRight" },
  { how: "top", icon: AlignStartHorizontal, label: "svgDesigner.alignTop" },
  {
    how: "middle",
    icon: AlignCenterHorizontal,
    label: "svgDesigner.alignMiddle",
  },
  { how: "bottom", icon: AlignEndHorizontal, label: "svgDesigner.alignBottom" },
] as const;

const ICONS: { name: string; icon: LucideIcon }[] = Object.entries({
  ArrowRight,
  BookOpen,
  Check,
  Clock,
  Cloud,
  Code,
  Database,
  File,
  Flag,
  Globe,
  Heart,
  Key,
  Lightbulb,
  Lock,
  Mail,
  MessageCircle,
  Search,
  Server,
  Settings,
  Shield,
  Star,
  Target,
  TrendingUp,
  TriangleAlert,
  User,
  Users,
  Zap,
}).map(([name, icon]) => ({ name, icon: icon as LucideIcon }));
const filteredIcons = computed(() => {
  const q = iconQuery.value.trim().toLowerCase();
  return q ? ICONS.filter((i) => i.name.toLowerCase().includes(q)) : ICONS;
});

// ---------- document edits ----------

function commit(next: Shape[]) {
  history.push(shapes.value);
  shapes.value = next;
}

function patchSelected(patch: Partial<Shape>) {
  if (props.readonly) return;
  commit(
    shapes.value.map((s) => (selected.value.has(s.id) ? { ...s, ...patch } : s))
  );
}

function common<K extends "fill" | "stroke">(key: K): Shape[K] | null {
  const vals = new Set(selectedShapes.value.map((s) => s[key]));
  return vals.size === 1 ? (selectedShapes.value[0][key] as Shape[K]) : null;
}

function selectOnly(id: string) {
  selected.value = new Set([id]);
  const s = shapes.value.find((x) => x.id === id);
  if (s)
    announce(
      t("svgDesigner.announce.selected", {
        name: s.type === "text" && s.text ? s.text : s.name,
      })
    );
}

function announce(text: string) {
  announcement.value = "";
  void nextTick(() => (announcement.value = text));
}

function undo() {
  const prev = history.undo(shapes.value);
  if (prev) shapes.value = prev;
}

function redo() {
  const next = history.redo(shapes.value);
  if (next) shapes.value = next;
}

function duplicate() {
  const copies = selectedShapes.value.map((s) => ({
    ...s,
    id: newId(),
    x: s.x + GRID * 2,
    y: s.y + GRID * 2,
  }));
  commit([...shapes.value, ...copies]);
  selected.value = new Set(copies.map((c) => c.id));
}

function removeSelected() {
  if (!selected.value.size) return;
  commit(shapes.value.filter((s) => !selected.value.has(s.id)));
  selected.value = new Set();
  announce(t("svgDesigner.announce.deleted"));
}

function reorder(id: string, dir: 1 | -1) {
  const i = shapes.value.findIndex((s) => s.id === id);
  const j = i + dir;
  if (i < 0 || j < 0 || j >= shapes.value.length) return;
  const next = [...shapes.value];
  [next[i], next[j]] = [next[j], next[i]];
  commit(next);
}

function toggleHidden(id: string) {
  commit(
    shapes.value.map((s) => (s.id === id ? { ...s, hidden: !s.hidden } : s))
  );
}

function doAlign(how: (typeof alignActions)[number]["how"]) {
  commit(align(shapes.value, selected.value, how));
}

function doDistribute(axis: "x" | "y") {
  commit(distribute(shapes.value, selected.value, axis));
}

function pickTool(next: Tool) {
  tool.value = next;
}

function addShape(
  type: ShapeType,
  box: { x: number; y: number; w: number; h: number },
  extra: Partial<Shape> = {}
): Shape {
  const base: Shape = {
    id: newId(),
    type,
    name: t(`svgDesigner.tools.${type === "group" ? "icon" : type}`).replace(
      /\s*\(.\)$/,
      ""
    ),
    ...box,
    fill:
      type === "line" || type === "group"
        ? "none"
        : type === "text"
          ? "ink"
          : "accent-1",
    stroke: type === "line" || type === "group" ? "ink" : "none",
    strokeWidth: type === "line" ? 4 : 2,
    rx: type === "rect" ? 16 : undefined,
    fontSize: type === "text" ? Math.round(minText.value * 1.15) : undefined,
    ...extra,
  };
  commit([...shapes.value, base]);
  selected.value = new Set([base.id]);
  announce(t("svgDesigner.announce.added", { name: base.name }));
  return base;
}

// ---------- pointer interactions ----------

type Drag =
  | { kind: "draw"; id: string; x0: number; y0: number }
  | {
      kind: "move";
      x0: number;
      y0: number;
      start: Map<string, { x: number; y: number }>;
      moved: boolean;
      before: Shape[];
    }
  | {
      kind: "resize";
      id: string;
      handle: string;
      start: Shape;
      before: Shape[];
    };
let drag: Drag | null = null;

function toSvg(e: PointerEvent | MouseEvent): { x: number; y: number } {
  const svg = svgEl.value;
  const ctm = svg?.getScreenCTM();
  if (!svg || !ctm) return { x: 0, y: 0 };
  const p = new DOMPoint(e.clientX, e.clientY).matrixTransform(ctm.inverse());
  return { x: p.x, y: p.y };
}

function hitPad(s: Shape): number {
  return s.type === "line" ? 8 : 0;
}

function onCanvasDown(e: PointerEvent) {
  if (props.readonly) return;
  // The canvas manages focus itself: the browser's mousedown focus would land
  // after a just-opened label input took focus, and blank it.
  e.preventDefault();
  stage.value?.focus();
  const p = toSvg(e);
  if (tool.value === "select" || tool.value === "icon") {
    if (!e.shiftKey) selected.value = new Set();
    return;
  }
  const x = snap(p.x);
  const y = snap(p.y);
  if (tool.value === "text") {
    const w = 240;
    const hgt = minText.value * 1.8;
    const s = addShape(
      "text",
      { x: x - w / 2, y: y - hgt / 2, w, h: hgt },
      { text: "" }
    );
    tool.value = "select";
    void nextTick(() => startTextEdit(s.id));
    return;
  }
  const s = addShape(tool.value as ShapeType, { x, y, w: 0, h: 0 });
  drag = { kind: "draw", id: s.id, x0: x, y0: y };
  svgEl.value?.setPointerCapture(e.pointerId);
}

function onShapeDown(e: PointerEvent, s: Shape) {
  if (props.readonly) return;
  e.preventDefault();
  stage.value?.focus();
  if (tool.value !== "select") {
    onCanvasDown(e);
    return;
  }
  if (e.shiftKey) {
    const next = new Set(selected.value);
    if (next.has(s.id)) next.delete(s.id);
    else next.add(s.id);
    selected.value = next;
  } else if (!selected.value.has(s.id)) {
    selectOnly(s.id);
  }
  const p = toSvg(e);
  const start = new Map(
    selectedShapes.value.map((x) => [x.id, { x: x.x, y: x.y }])
  );
  drag = {
    kind: "move",
    x0: p.x,
    y0: p.y,
    start,
    moved: false,
    before: shapes.value,
  };
  svgEl.value?.setPointerCapture(e.pointerId);
}

const handles = computed(() => {
  const s = single.value;
  if (!s) return [];
  if (s.type === "line") {
    return [
      { id: "start", x: s.x, y: s.y, cursor: "crosshair" },
      { id: "end", x: s.x + s.w, y: s.y + s.h, cursor: "crosshair" },
    ];
  }
  return [
    { id: "nw", x: s.x, y: s.y, cursor: "nwse-resize" },
    { id: "ne", x: s.x + s.w, y: s.y, cursor: "nesw-resize" },
    { id: "sw", x: s.x, y: s.y + s.h, cursor: "nesw-resize" },
    { id: "se", x: s.x + s.w, y: s.y + s.h, cursor: "nwse-resize" },
  ];
});

function onHandleDown(e: PointerEvent, handle: string) {
  if (!single.value || props.readonly) return;
  drag = {
    kind: "resize",
    id: single.value.id,
    handle,
    start: { ...single.value },
    before: shapes.value,
  };
  svgEl.value?.setPointerCapture(e.pointerId);
}

function onPointerMove(e: PointerEvent) {
  if (!drag) return;
  const p = toSvg(e);
  if (drag.kind === "draw") {
    const d = drag;
    const constrain = e.shiftKey;
    shapes.value = shapes.value.map((s) => {
      if (s.id !== d.id) return s;
      let w = snap(p.x) - d.x0;
      let hh = snap(p.y) - d.y0;
      if (constrain && s.type !== "line") hh = Math.sign(hh || 1) * Math.abs(w);
      if (s.type === "line") return { ...s, w, h: hh };
      return {
        ...s,
        x: Math.min(d.x0, d.x0 + w),
        y: Math.min(d.y0, d.y0 + hh),
        w: Math.abs(w),
        h: Math.abs(hh),
      };
    });
    return;
  }
  if (drag.kind === "move") {
    const d = drag;
    const dx = p.x - d.x0;
    const dy = p.y - d.y0;
    d.moved = d.moved || Math.abs(dx) > 1 || Math.abs(dy) > 1;
    const lead = shapes.value.find((s) => d.start.has(s.id));
    if (!lead) return;
    const ls = d.start.get(lead.id)!;
    const { xs, ys } = guidesOf(shapes.value, new Set(d.start.keys()));
    xs.push(0, artboard.value.width / 2, artboard.value.width);
    ys.push(0, artboard.value.height / 2, artboard.value.height);
    const sx = [ls.x + dx, ls.x + dx + lead.w / 2, ls.x + dx + lead.w].map(
      (v, i) => ({ ...snapTo(v, xs), off: [0, lead.w / 2, lead.w][i] })
    );
    const sy = [ls.y + dy, ls.y + dy + lead.h / 2, ls.y + dy + lead.h].map(
      (v, i) => ({ ...snapTo(v, ys), off: [0, lead.h / 2, lead.h][i] })
    );
    const gx = sx.find((c) => c.guide !== null) ?? sx[0];
    const gy = sy.find((c) => c.guide !== null) ?? sy[0];
    const ox = gx.value - gx.off - ls.x;
    const oy = gy.value - gy.off - ls.y;
    guideLines.value = [
      ...(gx.guide !== null
        ? [{ x1: gx.guide, y1: 0, x2: gx.guide, y2: artboard.value.height }]
        : []),
      ...(gy.guide !== null
        ? [{ x1: 0, y1: gy.guide, x2: artboard.value.width, y2: gy.guide }]
        : []),
    ];
    shapes.value = shapes.value.map((s) => {
      const st = d.start.get(s.id);
      return st ? { ...s, x: st.x + ox, y: st.y + oy } : s;
    });
    return;
  }
  const d = drag;
  const st = d.start;
  shapes.value = shapes.value.map((s) => {
    if (s.id !== d.id) return s;
    const px = snap(p.x);
    const py = snap(p.y);
    if (s.type === "line") {
      if (d.handle === "start")
        return { ...s, x: px, y: py, w: st.x + st.w - px, h: st.y + st.h - py };
      return { ...s, w: px - st.x, h: py - st.y };
    }
    const left = d.handle.includes("w")
      ? Math.min(px, st.x + st.w - GRID)
      : st.x;
    const right = d.handle.includes("e")
      ? Math.max(px, st.x + GRID)
      : st.x + st.w;
    const top = d.handle.includes("n")
      ? Math.min(py, st.y + st.h - GRID)
      : st.y;
    const bottom = d.handle.includes("s")
      ? Math.max(py, st.y + GRID)
      : st.y + st.h;
    return { ...s, x: left, y: top, w: right - left, h: bottom - top };
  });
}

function onPointerUp() {
  if (!drag) return;
  if (drag.kind === "draw") {
    const d = drag;
    const s = shapes.value.find((x) => x.id === d.id);
    // A click without a drag drops a default-sized shape.
    if (s && Math.abs(s.w) < GRID && Math.abs(s.h) < GRID) {
      const def = s.type === "line" ? { w: 160, h: 0 } : { w: 160, h: 96 };
      shapes.value = shapes.value.map((x) =>
        x.id === d.id ? { ...x, ...def } : x
      );
    }
    tool.value = "select";
  } else if (drag.kind === "move" && drag.moved) {
    history.push(drag.before);
    announce(t("svgDesigner.announce.moved"));
  } else if (drag.kind === "resize") {
    history.push(drag.before);
  }
  guideLines.value = [];
  drag = null;
}

function onDblClick(e: MouseEvent) {
  const p = toSvg(e);
  const hit = [...visibleShapes.value]
    .reverse()
    .find(
      (s) => p.x >= s.x && p.x <= s.x + s.w && p.y >= s.y && p.y <= s.y + s.h
    );
  if (hit?.type === "text") startTextEdit(hit.id);
}

// ---------- text editing ----------

function startTextEdit(id: string) {
  const s = shapes.value.find((x) => x.id === id);
  if (!s || !svgEl.value) return;
  const rect = svgEl.value.getBoundingClientRect();
  const k = rect.width / artboard.value.width;
  editingText.value = {
    id,
    value: s.text ?? "",
    style: {
      left: `${s.x * k}px`,
      top: `${s.y * k + (s.h * k) / 2 - 18}px`,
      width: `${Math.max(s.w * k, 120)}px`,
      height: "36px",
    },
  };
  void nextTick(() => textInput.value?.focus());
}

function commitText() {
  const ed = editingText.value;
  if (!ed) return;
  editingText.value = null;
  const value = ed.value.trim();
  if (!value) {
    shapes.value = shapes.value.filter(
      (s) => s.id !== ed.id || (s.text ?? "") !== ""
    );
    if (!shapes.value.find((s) => s.id === ed.id)) return;
  }
  patchTextById(ed.id, value);
  stage.value?.focus();
}

function patchTextById(id: string, text: string) {
  commit(shapes.value.map((s) => (s.id === id ? { ...s, text } : s)));
}

function cancelText() {
  editingText.value = null;
  stage.value?.focus();
}

// ---------- keyboard ----------

function onKeydown(e: KeyboardEvent) {
  if (editingText.value || props.readonly) return;
  const mod = e.metaKey || e.ctrlKey;
  const key = e.key;
  if (mod && key.toLowerCase() === "z") {
    e.preventDefault();
    if (e.shiftKey) redo();
    else undo();
    return;
  }
  if (mod && key.toLowerCase() === "d") {
    e.preventDefault();
    duplicate();
    return;
  }
  if (mod && key.toLowerCase() === "a") {
    e.preventDefault();
    selected.value = new Set(shapes.value.map((s) => s.id));
    announce(
      t("svgDesigner.announce.selectedMany", { count: shapes.value.length })
    );
    return;
  }
  if (key === "Escape" && (tool.value !== "select" || selected.value.size)) {
    e.preventDefault();
    tool.value = "select";
    selected.value = new Set();
    return;
  }
  if ((key === "Delete" || key === "Backspace") && selected.value.size) {
    e.preventDefault();
    removeSelected();
    return;
  }
  if (key.startsWith("Arrow") && selected.value.size) {
    e.preventDefault();
    const step = e.shiftKey ? 10 : 1;
    const dx = key === "ArrowLeft" ? -step : key === "ArrowRight" ? step : 0;
    const dy = key === "ArrowUp" ? -step : key === "ArrowDown" ? step : 0;
    commit(
      shapes.value.map((s) =>
        selected.value.has(s.id) ? { ...s, x: s.x + dx, y: s.y + dy } : s
      )
    );
    return;
  }
  if (key === "Enter" && single.value?.type === "text") {
    e.preventDefault();
    startTextEdit(single.value.id);
    return;
  }
  if (!mod && !e.altKey && key.length === 1) {
    const s = single.value;
    // Typing on a selected box writes a centred label inside it.
    if (s && (s.type === "rect" || s.type === "ellipse")) {
      e.preventDefault();
      const label = addShape(
        "text",
        { x: s.x, y: s.y, w: s.w, h: s.h },
        { text: key }
      );
      void nextTick(() => startTextEdit(label.id));
      return;
    }
    const map: Record<string, Tool> = {
      v: "select",
      r: "rect",
      o: "ellipse",
      a: "line",
      t: "text",
      i: "icon",
    };
    const next = map[key.toLowerCase()];
    if (next) {
      e.preventDefault();
      tool.value = next;
    }
  }
}

// ---------- paste / icons ----------

function resolvedRoles(): Partial<
  Record<SvgRole, { r: number; g: number; b: number }>
> {
  const out: Partial<Record<SvgRole, { r: number; g: number; b: number }>> = {};
  const host = svgEl.value;
  if (!host) return out;
  for (const role of SVG_ROLES) {
    const probe = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "rect"
    );
    probe.setAttribute("class", `t-fill-${role}`);
    host.appendChild(probe);
    const rgb = parseColor(getComputedStyle(probe).fill);
    probe.remove();
    if (rgb) out[role] = rgb;
  }
  return out;
}

function onPaste(e: ClipboardEvent) {
  if (props.readonly) return;
  const text =
    e.clipboardData?.getData("text/plain") ??
    e.clipboardData?.getData("image/svg+xml") ??
    "";
  if (!/<svg[\s>]/i.test(text)) return;
  e.preventDefault();
  const tooComplex = exceededLimit(text);
  if (tooComplex) {
    notice.value = {
      kind: "error",
      text: t("svgDesigner.tooComplex", { detail: tooComplex }),
    };
    return;
  }
  const res = parse(text);
  if (!res.shapes.length) {
    notice.value = {
      kind: "error",
      text: t("svgDesigner.pasteFailed", {
        reason: res.removed.join(", ") || "empty",
      }),
    };
    return;
  }
  // Fit the pasted drawing into the artboard, keeping its proportions.
  const k = Math.min(
    artboard.value.width / res.artboard.width,
    artboard.value.height / res.artboard.height,
    1
  );
  const pasted = res.shapes.map((s) => ({
    ...s,
    id: newId(),
    x: s.x * k,
    y: s.y * k,
    w: s.w * k,
    h: s.h * k,
  }));
  commit([...shapes.value, ...pasted]);
  selected.value = new Set(pasted.map((s) => s.id));
  const parts: string[] = [t("svgDesigner.pasted")];
  if (res.removed.length)
    parts.push(t("svgDesigner.pasteRemoved", { list: res.removed.join(", ") }));
  if (res.literalColours.length) {
    parts.push(
      t("svgDesigner.matchColoursHint", { count: res.literalColours.length })
    );
    notice.value = {
      kind: res.removed.length ? "error" : "info",
      text: parts.join(" "),
      action: {
        label: t("svgDesigner.matchColours"),
        run: () =>
          matchColours(
            pasted.map((s) => s.id),
            res.literalColours
          ),
      },
    };
  } else {
    notice.value = {
      kind: res.removed.length ? "error" : "info",
      text: parts.join(" "),
    };
  }
}

function matchColours(ids: string[], colours: string[]) {
  const roles = resolvedRoles();
  const mapping: Record<string, SvgRole> = {};
  for (const c of colours) {
    const r = nearestRole(c, roles, parseColor);
    if (r) mapping[c] = r;
  }
  const set = new Set(ids);
  commit(
    shapes.value.map((s) =>
      set.has(s.id) && s.inner
        ? { ...s, inner: applyRoleMapping(s.inner, mapping) }
        : s
    )
  );
  notice.value = { kind: "info", text: t("svgDesigner.colourMatched") };
}

function insertIcon(ic: { name: string; icon: LucideIcon }) {
  const holder = document.createElement("div");
  render(h(ic.icon, { size: 24 }), holder);
  const inner = holder.querySelector("svg")?.innerHTML ?? "";
  render(null, holder);
  const size = 96;
  const s = addShape(
    "group",
    {
      x: snap(artboard.value.width / 2 - size / 2),
      y: snap(artboard.value.height / 2 - size / 2),
      w: size,
      h: size,
    },
    {
      name: ic.name,
      inner,
      innerW: 24,
      innerH: 24,
      stroke: "ink",
      strokeWidth: 2,
    }
  );
  tool.value = "select";
  selectOnly(s.id);
}

// ---------- contrast (#274) ----------

interface ContrastIssue {
  id: string;
  name: string;
  ratio: number;
  fix: SvgRole | null;
}
const contrastIssues = ref<ContrastIssue[]>([]);

function cardColour(): { r: number; g: number; b: number } | null {
  return svgEl.value
    ? parseColor(getComputedStyle(svgEl.value).backgroundColor)
    : null;
}

/** Text must reach 4.5:1 and lines 3:1 against what is behind them, in the previewed theme. */
function computeContrast() {
  const roles = resolvedRoles();
  const card = cardColour();
  if (!card) return;
  const out: ContrastIssue[] = [];
  const list = visibleShapes.value;
  for (const [i, s] of list.entries()) {
    const role =
      s.type === "text" ? s.fill : s.type === "line" ? s.stroke : "none";
    if (role === "none" || !roles[role]) continue;
    const cx = s.x + s.w / 2;
    const cy = s.y + s.h / 2;
    const under = list
      .slice(0, i)
      .reverse()
      .find(
        (b) =>
          b.type !== "text" &&
          b.type !== "line" &&
          b.fill !== "none" &&
          cx >= b.x &&
          cx <= b.x + b.w &&
          cy >= b.y &&
          cy <= b.y + b.h
      );
    const bg =
      under && under.fill !== "none" ? (roles[under.fill] ?? card) : card;
    const kind = s.type === "text" ? "text" : "shape";
    const ratio = contrastRatio(roles[role]!, bg);
    if (passes(ratio, kind)) continue;
    const fix =
      (["ink", "surface", "accent-1", "muted"] as SvgRole[]).find(
        (r) => roles[r] && passes(contrastRatio(roles[r]!, bg), kind)
      ) ?? null;
    out.push({
      id: s.id,
      name: s.type === "text" && s.text ? s.text : s.name,
      ratio,
      fix,
    });
  }
  contrastIssues.value = out;
}

watch([shapes, themeId, previewDark], () => void nextTick(computeContrast), {
  immediate: true,
});

function applyContrastFix(id: string, role: SvgRole) {
  commit(
    shapes.value.map((s) =>
      s.id !== id
        ? s
        : s.type === "line"
          ? { ...s, stroke: role }
          : { ...s, fill: role }
    )
  );
}

// ---------- save ----------

// The document counts as saved only once the host's save succeeded: the
// host drives `saving` true → false, and leaves `error` empty on success.
let pendingSave = "";
watch(
  () => props.saving,
  (now, was) => {
    if (was && !now && !props.error && pendingSave)
      savedMarkup.value = pendingSave;
  }
);

function onSave() {
  pendingSave = markup.value;
  emit("save", pendingSave);
}

/** For hosts that save synchronously or without a `saving` flag. */
function markSaved() {
  savedMarkup.value = markup.value;
}

defineExpose({ markSaved });
</script>
