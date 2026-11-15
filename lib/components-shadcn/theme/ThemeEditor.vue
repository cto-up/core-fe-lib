<!--
  ThemeEditor — edit one tier's theme override on top of the tiers below it.
  Authors see the basics (main colour, fonts, corner radius) and can open "More
  colours"; admins also get the CSS view. Every inherited value names where it
  comes from; dark values derive from light ones unless set; a live preview in
  light and dark shows contrast for the pairs that matter.
-->
<template>
  <div class="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,22rem)]">
    <div class="min-w-0 space-y-4">
      <div v-if="advanced" class="flex border-b" role="tablist">
        <button
          v-for="tab in ['form', 'css'] as const"
          :key="tab"
          type="button"
          role="tab"
          class="min-h-11 px-4 text-sm"
          :class="
            view === tab
              ? 'border-b-2 border-primary font-medium'
              : 'text-muted-foreground'
          "
          :aria-selected="view === tab"
          @click="view = tab"
        >
          {{
            tab === "form"
              ? t("theme.form")
              : `${t("theme.css")} · ${t("theme.advanced")}`
          }}
        </button>
      </div>

      <template v-if="view === 'form'">
        <section
          v-for="group in visibleGroups"
          :key="group.id"
          class="space-y-2"
        >
          <h3 class="text-sm font-medium">
            {{ t(`theme.groups.${group.id}`) }}
          </h3>
          <div
            v-for="tok in group.tokens"
            :key="tok.name"
            class="rounded-lg bg-muted/30 p-3"
          >
            <div class="flex flex-wrap items-center gap-2">
              <label :for="fieldId(tok.name)" class="min-w-0 flex-1 text-sm">{{
                t(`theme.tokens.${tok.label}`)
              }}</label>
              <template v-if="tok.kind === 'triplet' || tok.kind === 'colour'">
                <input
                  :id="fieldId(tok.name)"
                  type="color"
                  class="h-9 w-11 cursor-pointer rounded border bg-transparent"
                  :value="toHex(effective(tok.name) ?? '#000000')"
                  :disabled="readonly"
                  @input="
                    setToken(
                      tok.name,
                      ($event.target as HTMLInputElement).value
                    )
                  "
                />
                <Input
                  class="h-9 w-28 font-mono text-xs"
                  :model-value="
                    light[tok.name] !== undefined ? toHex(light[tok.name]) : ''
                  "
                  :placeholder="
                    inheritedValue(tok.name)
                      ? toHex(inheritedValue(tok.name)!)
                      : t('theme.notSet')
                  "
                  :aria-label="t(`theme.tokens.${tok.label}`)"
                  :disabled="readonly"
                  @change="
                    (e: Event) =>
                      setToken(tok.name, (e.target as HTMLInputElement).value)
                  "
                />
              </template>
              <select
                v-else-if="tok.kind === 'font'"
                :id="fieldId(tok.name)"
                class="h-9 rounded-md border bg-background px-2 text-sm"
                :value="light[tok.name] ?? ''"
                :disabled="readonly"
                @change="
                  setToken(tok.name, ($event.target as HTMLSelectElement).value)
                "
              >
                <option value="">{{ t("theme.inheritFont") }}</option>
                <option v-for="f in THEME_FONTS" :key="f" :value="fontValue(f)">
                  {{ f }}
                </option>
              </select>
              <select
                v-else
                :id="fieldId(tok.name)"
                class="h-9 rounded-md border bg-background px-2 text-sm"
                :value="light[tok.name] ?? ''"
                :disabled="readonly"
                @change="
                  setToken(tok.name, ($event.target as HTMLSelectElement).value)
                "
              >
                <option value="">{{ t("theme.inheritFont") }}</option>
                <option v-for="r in RADII" :key="r" :value="r">{{ r }}</option>
              </select>
              <Button
                v-if="light[tok.name] !== undefined && !readonly"
                variant="ghost"
                size="sm"
                type="button"
                @click="resetToken(tok.name)"
              >
                {{ t("theme.reset") }}
              </Button>
            </div>
            <p
              v-if="light[tok.name] === undefined && inheritedFrom(tok.name)"
              class="mt-1 text-xs text-muted-foreground/70"
            >
              {{ t("theme.inherited", { source: inheritedFrom(tok.name) }) }}
            </p>
            <div
              v-if="tok.kind === 'triplet' && light[tok.name] !== undefined"
              class="mt-2 flex items-center gap-2 text-xs"
            >
              <template v-if="dark[tok.name] === undefined">
                <span class="text-muted-foreground">{{
                  t("theme.darkAuto")
                }}</span>
                <button
                  v-if="!readonly"
                  type="button"
                  class="underline underline-offset-2"
                  @click="
                    setDark(
                      tok.name,
                      deriveDark(light, {})[tok.name] ?? light[tok.name]
                    )
                  "
                >
                  {{ t("theme.darkSet") }}
                </button>
              </template>
              <template v-else>
                <label :for="`${fieldId(tok.name)}-dark`">{{
                  t("theme.darkValue")
                }}</label>
                <input
                  :id="`${fieldId(tok.name)}-dark`"
                  type="color"
                  class="h-8 w-10 rounded border"
                  :value="toHex(tripletColour(dark[tok.name]))"
                  :disabled="readonly"
                  @input="
                    setDark(tok.name, ($event.target as HTMLInputElement).value)
                  "
                />
                <button
                  v-if="!readonly"
                  type="button"
                  class="underline underline-offset-2"
                  @click="clearDark(tok.name)"
                >
                  {{ t("theme.darkAuto") }}
                </button>
              </template>
            </div>
          </div>
        </section>
        <button
          v-if="!showAll"
          type="button"
          class="flex min-h-11 items-center gap-1 text-sm underline underline-offset-2"
          @click="showAll = true"
        >
          <ChevronDown class="h-4 w-4" aria-hidden="true" />{{
            t("theme.moreColours")
          }}
        </button>
        <Button
          v-if="Object.keys(light).length && !readonly"
          variant="outline"
          size="sm"
          type="button"
          @click="resetAll"
        >
          {{ t("theme.resetAll") }}
        </Button>
      </template>

      <template v-else>
        <textarea
          v-model="cssDraft"
          class="h-72 w-full rounded-md border bg-background p-3 font-mono text-xs"
          :aria-label="t('theme.css')"
          spellcheck="false"
          :readonly="readonly"
          @input="onCssInput"
        />
        <ul v-if="cssErrors.length" class="space-y-1" role="alert">
          <li v-for="(e, i) in cssErrors" :key="i" class="text-sm text-error">
            {{
              t("theme.refused", {
                line: e.line,
                rule: e.rule,
                reason: e.reason,
              })
            }}
          </li>
        </ul>
      </template>
    </div>

    <aside class="min-w-0 space-y-3" :aria-label="t('theme.preview')">
      <h3 class="text-sm font-medium">{{ t("theme.preview") }}</h3>
      <component :is="'style'">{{ previewCss }}</component>
      <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
        <div
          v-for="mode in ['light', 'dark'] as const"
          :key="mode"
          :data-theme-scope="scopeId"
          :class="mode === 'dark' ? 'dark' : ''"
          class="rounded-xl bg-background p-4 text-foreground shadow-ambient"
        >
          <p
            class="mb-2 font-mono text-[10px] uppercase tracking-wide text-muted-foreground"
          >
            {{ t(`theme.${mode}`) }}
          </p>
          <slot name="sample" :mode="mode">
            <h4
              class="font-display text-lg font-bold"
              style="font-family: var(--font-display)"
            >
              {{ t("theme.sample.heading") }}
            </h4>
            <p class="text-sm" style="font-family: var(--font-sans)">
              {{ t("theme.sample.body") }}
            </p>
            <div
              class="mt-2 rounded-[var(--radius)] bg-card p-3 text-card-foreground"
            >
              <p class="text-xs text-muted-foreground">
                {{ t("theme.sample.muted") }}
              </p>
              <div class="mt-2 rounded-[var(--radius)] border p-2 text-sm">
                {{ t("theme.sample.option") }}
              </div>
            </div>
            <span
              class="mt-3 inline-flex rounded-[var(--radius)] bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground"
            >
              {{ t("theme.sample.button") }}
            </span>
          </slot>
        </div>
      </div>
      <div class="space-y-1">
        <p class="text-xs font-medium">{{ t("theme.contrast") }}</p>
        <div
          v-for="pair in contrastPairs"
          :key="pair.label"
          class="flex items-center justify-between gap-2 text-xs"
        >
          <span class="text-muted-foreground">{{ t(pair.label) }}</span>
          <ContrastBadge
            :fg="pair.fg"
            :bg="pair.bg"
            :kind="pair.kind"
            hide-fix
          />
        </div>
      </div>
    </aside>
  </div>
</template>

<script lang="ts" setup>
import { computed, ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import { ChevronDown } from "lucide-vue-next";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { useDialog } from "../composables/useDialog";
import ContrastBadge from "../svg/ContrastBadge.vue";
import {
  THEME_FONTS,
  THEME_TOKENS,
  checkValue,
  deriveDark,
  parseThemeCss,
  scopeThemeCss,
  serializeThemeCss,
  toHex,
  type TokenMap,
} from "./themeTokens";

const props = defineProps<{
  /** This tier's override stylesheet. */
  modelValue: string;
  /** Inherited layers, lowest first. */
  base: { tier: string; label: string; css: string }[];
  /** Show the CSS view (admins). */
  advanced?: boolean;
  readonly?: boolean;
}>();

const emit = defineEmits<{
  "update:modelValue": [css: string];
  valid: [ok: boolean];
}>();

const { t } = useI18n();
const { dialog } = useDialog();
const RADII = ["0rem", "0.25rem", "0.5rem", "0.75rem", "1rem", "1.5rem"];

let seq = 0;
const scopeId = `te${Date.now().toString(36)}${(seq++).toString(36)}`;
const scopeSel = `[data-theme-scope="${scopeId}"]`;

const view = ref<"form" | "css">("form");
const showAll = ref(false);
const light = ref<TokenMap>({});
const dark = ref<TokenMap>({});
const cssDraft = ref("");
const cssErrors = ref<{ line: number; rule: string; reason: string }[]>([]);

/** Load a stylesheet; dark values equal to the automatic ones count as automatic. */
function load(css: string) {
  const p = parseThemeCss(css);
  const auto = deriveDark(p.light, {});
  light.value = p.light;
  dark.value = Object.fromEntries(
    Object.entries(p.dark).filter(([k, v]) => auto[k] !== v)
  );
  cssDraft.value = css;
  cssErrors.value = p.errors;
}
load(props.modelValue ?? "");
watch(
  () => props.modelValue,
  (css) => {
    if (css !== current()) load(css ?? "");
  }
);

function current(): string {
  return serializeThemeCss(light.value, deriveDark(light.value, dark.value));
}

function commit() {
  const css = current();
  cssDraft.value = css;
  cssErrors.value = [];
  emit("valid", true);
  emit("update:modelValue", css);
}

const visibleGroups = computed(() =>
  showAll.value ? THEME_TOKENS : THEME_TOKENS.filter((g) => g.basic)
);

function fieldId(name: string) {
  return `${scopeId}${name}`;
}

const baseParsed = computed(() =>
  props.base.map((l) => ({ label: l.label, ...parseThemeCss(l.css) }))
);

function inheritedValue(name: string): string | undefined {
  for (let i = baseParsed.value.length - 1; i >= 0; i--) {
    const v = baseParsed.value[i].light[name];
    if (v !== undefined) return v;
  }
  return undefined;
}

function inheritedFrom(name: string): string | undefined {
  for (let i = baseParsed.value.length - 1; i >= 0; i--) {
    if (baseParsed.value[i].light[name] !== undefined)
      return baseParsed.value[i].label;
  }
  return undefined;
}

function tripletColour(v: string | undefined): string {
  if (!v) return "#000000";
  return /^[\d.]+\s+[\d.]+%\s+[\d.]+%$/.test(v.trim()) ? `hsl(${v})` : v;
}

function effective(name: string): string | undefined {
  const v = light.value[name] ?? inheritedValue(name);
  return v === undefined ? undefined : tripletColour(v);
}

function setToken(name: string, raw: string) {
  if (raw === "") {
    resetToken(name);
    return;
  }
  const res = checkValue(name, raw);
  if (!res.value) return;
  light.value = { ...light.value, [name]: res.value };
  commit();
}

function resetToken(name: string) {
  const { [name]: _l, ...restL } = light.value;
  const { [name]: _d, ...restD } = dark.value;
  light.value = restL;
  dark.value = restD;
  commit();
}

function setDark(name: string, raw: string) {
  const res = checkValue(name, raw);
  if (!res.value) return;
  dark.value = { ...dark.value, [name]: res.value };
  commit();
}

function clearDark(name: string) {
  const { [name]: _d, ...rest } = dark.value;
  dark.value = rest;
  commit();
}

async function resetAll() {
  const ok = await dialog({
    title: t("theme.resetAllTitle"),
    message: t("theme.resetAllMessage"),
    ok: t("theme.resetAll"),
  });
  if (!ok) return;
  light.value = {};
  dark.value = {};
  commit();
}

function onCssInput() {
  const p = parseThemeCss(cssDraft.value);
  cssErrors.value = p.errors;
  emit("valid", !p.errors.length);
  if (p.errors.length) return;
  const auto = deriveDark(p.light, {});
  light.value = p.light;
  dark.value = Object.fromEntries(
    Object.entries(p.dark).filter(([k, v]) => auto[k] !== v)
  );
  emit("update:modelValue", current());
}

const previewCss = computed(() =>
  [...props.base.map((l) => l.css), current()]
    .map((css) => scopeThemeCss(css, scopeSel))
    .join("\n")
);

/** The merged light value of a token, as a colour, for contrast. */
function merged(name: string): string | undefined {
  return effective(name);
}

const contrastPairs = computed(() => {
  const pairs = [
    {
      label: "theme.pairs.text",
      fg: merged("--foreground"),
      bg: merged("--background"),
      kind: "text" as const,
    },
    {
      label: "theme.pairs.button",
      fg: merged("--primary-foreground"),
      bg: merged("--primary"),
      kind: "text" as const,
    },
    {
      label: "theme.pairs.muted",
      fg: merged("--muted-foreground"),
      bg: merged("--card"),
      kind: "text" as const,
    },
    {
      label: "theme.pairs.drawing",
      fg: merged("--svg-ink") ?? merged("--foreground"),
      bg: merged("--svg-surface") ?? merged("--card"),
      kind: "text" as const,
    },
  ];
  return pairs.filter(
    (p): p is { label: string; fg: string; bg: string; kind: "text" } =>
      !!p.fg && !!p.bg
  );
});

function fontValue(f: string): string {
  return f.includes(" ") ? `"${f}"` : f;
}
</script>
