<template>
  <div class="space-y-2">
    <Label v-if="label" :for="id">{{ label }}</Label>
    <Select
      :model-value="modelValue"
      @update:model-value="$emit('update:modelValue', $event)"
    >
      <SelectTrigger :id="id" class="w-full">
        <SelectValue
          :placeholder="placeholder ?? t('llm.select.placeholder')"
        />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup v-for="group in groups" :key="group.provider">
          <SelectLabel>{{ providerLabel(group.provider) }}</SelectLabel>
          <SelectItem
            v-for="m in group.models"
            :key="m.llm_key"
            :value="m.llm_key"
          >
            <span class="flex items-center justify-between gap-3 w-full">
              <span class="flex items-center gap-2">
                <span
                  :class="m.reachable === false ? 'text-muted-foreground' : ''"
                >
                  {{ m.label }}
                </span>
                <span
                  v-if="m.reachable === false"
                  class="px-1 rounded bg-amber-100 text-amber-900 dark:bg-amber-950/60 dark:text-amber-200 text-[10px]"
                  :title="t('llm.select.noKey.tooltip')"
                >
                  {{ t("llm.select.noKey.badge") }}
                </span>
                <span
                  v-if="m.effective_input_modalities?.length"
                  class="flex items-center gap-0.5 text-muted-foreground/70"
                  :title="modalityTitle(m)"
                >
                  <component
                    :is="MODALITY_ICONS[x]"
                    v-for="x in m.effective_input_modalities"
                    :key="`in-${x}`"
                    class="h-3 w-3"
                    :data-test="`llm-option-in-${x}`"
                  />
                  <template v-if="producesMedia(m)">
                    <ArrowRight class="h-3 w-3 text-muted-foreground/50" />
                    <component
                      :is="MODALITY_ICONS[x]"
                      v-for="x in m.effective_output_modalities"
                      :key="`out-${x}`"
                      class="h-3 w-3"
                      :data-test="`llm-option-out-${x}`"
                    />
                  </template>
                </span>
                <span
                  v-if="m.stats && (m.stats.samples > 0 || m.stats.votes > 0)"
                  class="flex items-center gap-1 text-[10px] font-mono"
                  :title="statsTooltip(m.stats)"
                >
                  <span
                    v-if="m.stats.reliability !== undefined"
                    class="px-1 rounded bg-muted"
                    :class="scoreClass(m.stats.reliability)"
                  >
                    {{ t("llm.select.stats.reliability") }}
                    {{ pct(m.stats.reliability) }}
                  </span>
                  <span
                    v-if="m.stats.formatting !== undefined"
                    class="px-1 rounded bg-muted"
                    :class="scoreClass(m.stats.formatting)"
                  >
                    {{ t("llm.select.stats.formatting") }}
                    {{ pct(m.stats.formatting) }}
                  </span>
                  <span
                    v-if="m.stats.userApproval !== undefined"
                    class="px-1 rounded bg-muted"
                    :class="scoreClass(m.stats.userApproval)"
                  >
                    {{ t("llm.select.stats.approval") }}
                    {{ pct(m.stats.userApproval) }} ({{ m.stats.votes }})
                  </span>
                </span>
              </span>
              <span class="text-xs text-muted-foreground font-mono">
                {{ priceLabel(m) }}
              </span>
            </span>
          </SelectItem>
        </SelectGroup>
        <SelectGroup v-if="loading">
          <SelectLabel>{{ t("llm.select.loading") }}</SelectLabel>
        </SelectGroup>
        <SelectGroup v-else-if="!groups.length">
          <SelectLabel>{{ t("llm.select.empty") }}</SelectLabel>
        </SelectGroup>
      </SelectContent>
    </Select>
    <!--
      The list shows only models this workspace holds a credential for, with
      one exception: the currently-saved value is always kept, flagged, so a
      key removed after the fact cannot silently rewrite the stored model. That
      exception is why one unusable model can appear while others are absent —
      say so, rather than leaving the user to infer it from a bare chip.
    -->
    <p
      v-if="selectedUnreachable"
      class="text-xs text-amber-700 dark:text-amber-400"
    >
      {{ t("llm.select.noKey.selected", { provider: selectedProvider }) }}
    </p>
    <p v-if="hint" class="text-xs text-muted-foreground">
      {{ hint }}
    </p>
  </div>
</template>

<script lang="ts" setup>
import { computed, ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import { Label } from "../ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import type { Component } from "vue";
import {
  ArrowRight,
  AudioLines,
  FileText,
  Film,
  Image,
  Type,
} from "lucide-vue-next";
import {
  filterByModalities,
  producesMedia,
  type Modality,
} from "./llm-modalities";

export interface LLMStats {
  samples: number;
  votes: number;
  reliability?: number;
  formatting?: number;
  userApproval?: number;
}

export interface LLMRegistryEntry {
  llm_key: string;
  provider: string;
  label: string;
  capabilities: string[];
  active: boolean;
  price_input_per_million: number;
  price_output_per_million: number;
  stats?: LLMStats;
  /**
   * False when no credential resolves for this model's provider. Such an entry
   * is shown flagged rather than hidden, so a value stored before the key was
   * revoked stays visible and explains itself.
   */
  reachable?: boolean;
  /** Declared inputs cut down to what hub's adapter for the provider carries. */
  effective_input_modalities?: Modality[];
  effective_output_modalities?: Modality[];
}

export type LLMCapability =
  | "text"
  | "ocr"
  | "layout"
  | "embedder"
  | "reasoning"
  | "code"
  | "moderation";

export interface LLMFetcherArgs {
  provider?: string;
  capability?: LLMCapability;
  taskType?: string;
  /**
   * The selector's current value. Strategies that filter the catalogue (e.g.
   * to models the workspace holds a credential for) must still return this
   * one, flagged `reachable: false` — dropping it would render the picker
   * empty and let the next save silently rewrite the stored model.
   */
  currentKey?: string;
  /** The model must read every one of these, on its effective list. */
  inputModalities?: Modality[];
  /** The model must be able to produce every one of these. */
  outputModalities?: Modality[];
  /**
   * Keep only models whose PROVIDER serves this endpoint family — `chat`,
   * `embed`, `image` or `audio`.
   *
   * A different axis from `capability`, which describes the model. A picker
   * choosing what an image tool should call wants whatever the box can render;
   * such a model is tagged `text`, because a provider's /v1/models publishes an
   * id and nothing else.
   */
  providerEndpoint?: string;
}

const props = withDefaults(
  defineProps<{
    modelValue: string;
    /**
     * Strategy prop — caller supplies the registry fetch. The component does
     * not know about any specific API; the hub wires PipelineService here.
     * If omitted, `items` must be provided instead.
     */
    fetcher?: (args: LLMFetcherArgs) => Promise<LLMRegistryEntry[]>;
    /**
     * Static items — alternative to `fetcher` for pre-loaded data.
     */
    items?: LLMRegistryEntry[];
    id?: string;
    label?: string;
    hint?: string;
    placeholder?: string;
    capability?: LLMCapability;
    provider?: string;
    taskType?: string;
    /** AND: offer only models that read all of these. */
    inputModalities?: Modality[];
    /** AND: offer only models that can produce all of these. */
    outputModalities?: Modality[];
    /**
     * Offer only models whose PROVIDER serves this endpoint family — `chat`,
     * `embed`, `image`, `audio`.
     *
     * The axis to filter a drawing picker on, and not `capability`: a box that
     * only draws publishes its models through /v1/models, which carries an id
     * and nothing else, so every one of them arrives tagged `text`. Filtering
     * on the model would offer a list of things that cannot draw and hide the
     * one that can.
     */
    providerEndpoint?: string;
  }>(),
  {
    id: "llm_key",
    label: "",
    hint: "",
    placeholder: undefined,
    capability: "text",
    provider: "",
    taskType: "",
    fetcher: undefined,
    items: undefined,
    inputModalities: undefined,
    outputModalities: undefined,
    providerEndpoint: undefined,
  }
);

defineEmits<{
  (e: "update:modelValue", value: string): void;
}>();

const { t } = useI18n();

const entries = ref<LLMRegistryEntry[]>([]);

/** The entry matching the current value, when the strategy returned one. */
const selectedEntry = computed(() =>
  entries.value.find((e) => e.llm_key === props.modelValue)
);
const selectedUnreachable = computed(
  () => selectedEntry.value?.reachable === false
);
const selectedProvider = computed(() => selectedEntry.value?.provider ?? "");
const loading = ref(false);

const PROVIDER_ORDER = [
  "googleai",
  "anthropic",
  "openai",
  "scaleway",
  "ovh",
  "mistral",
  "private",
];

const PROVIDER_LABELS: Record<string, string> = {
  googleai: "Google AI",
  anthropic: "Anthropic",
  openai: "OpenAI",
  scaleway: "Scaleway",
  ovh: "OVH AI Endpoints",
  mistral: "Mistral",
  private: "Private (in-house vLLM)",
  ollama: "Ollama (local)",
};

/**
 * The fetcher is asked for the modalities and filters server-side; filtering
 * again here keeps static `items`, and a host whose fetcher ignores the
 * arguments, from offering a model that cannot serve.
 */
const visibleEntries = computed(() =>
  filterByModalities(
    entries.value,
    props.inputModalities,
    props.outputModalities,
    props.modelValue || undefined
  )
);

const groups = computed(() => {
  const byProvider = new Map<string, LLMRegistryEntry[]>();
  for (const e of visibleEntries.value) {
    if (!byProvider.has(e.provider)) byProvider.set(e.provider, []);
    byProvider.get(e.provider)!.push(e);
  }
  const ordered: { provider: string; models: LLMRegistryEntry[] }[] = [];
  for (const p of PROVIDER_ORDER) {
    const models = byProvider.get(p);
    if (models?.length) {
      ordered.push({ provider: p, models });
      byProvider.delete(p);
    }
  }
  for (const [provider, models] of [...byProvider.entries()].sort()) {
    ordered.push({ provider, models });
  }
  return ordered;
});

function providerLabel(p: string): string {
  return PROVIDER_LABELS[p] ?? p;
}

const PROVIDER_CURRENCY: Record<string, string> = {
  ovh: "€",
  scaleway: "€",
  googleai: "$",
  anthropic: "$",
  openai: "$",
  mistral: "$",
};

function fmtPrice(v: number): string {
  if (v === 0) return "0";
  return v.toFixed(2).replace(/\.?0+$/, "");
}

function priceLabel(m: LLMRegistryEntry): string {
  const isLocal = m.provider === "private" || m.provider === "ollama";
  if (isLocal) return t("llm.select.price.free");
  if (m.price_input_per_million === 0 && m.price_output_per_million === 0) {
    return t("llm.select.price.unknown");
  }
  const c = PROVIDER_CURRENCY[m.provider] ?? "";
  return t("llm.select.price.perMillion", {
    input: `${c}${fmtPrice(m.price_input_per_million)}`,
    output: `${c}${fmtPrice(m.price_output_per_million)}`,
  });
}

async function fetchEntries() {
  if (!props.fetcher) return;
  loading.value = true;
  try {
    entries.value = await props.fetcher({
      provider: props.provider || undefined,
      capability: props.capability,
      taskType: props.taskType || undefined,
      currentKey: props.modelValue || undefined,
      inputModalities: props.inputModalities?.length
        ? [...props.inputModalities]
        : undefined,
      outputModalities: props.outputModalities?.length
        ? [...props.outputModalities]
        : undefined,
      providerEndpoint: props.providerEndpoint || undefined,
    });
  } catch {
    entries.value = [];
  } finally {
    loading.value = false;
  }
}

watch(
  () => props.items,
  (newItems) => {
    if (newItems) entries.value = newItems;
  },
  { immediate: true }
);

watch(
  [
    () => props.taskType,
    () => props.capability,
    () => props.provider,
    () => props.inputModalities?.join(","),
    () => props.outputModalities?.join(","),
    () => props.providerEndpoint,
  ],
  () => {
    if (props.fetcher) void fetchEntries();
  },
  { immediate: true }
);

const MODALITY_ICONS: Record<Modality, Component> = {
  text: Type,
  image: Image,
  audio: AudioLines,
  video: Film,
  file: FileText,
};

function modalityTitle(m: LLMRegistryEntry): string {
  const names = (ms?: Modality[]) =>
    (ms ?? []).map((x) => t(`llm.select.modalities.${x}`)).join(", ");
  return t("llm.select.modalities.tooltip", {
    input: names(m.effective_input_modalities),
    output: names(m.effective_output_modalities),
  });
}

function scoreClass(v: number | undefined): string {
  if (v === undefined) return "text-muted-foreground";
  if (v >= 0.85) return "text-emerald-600 dark:text-emerald-400";
  if (v >= 0.6) return "text-amber-600 dark:text-amber-400";
  return "text-red-600 dark:text-red-400";
}

function pct(v: number | undefined): string {
  if (v === undefined) return "—";
  return `${Math.round(v * 100)}%`;
}

function statsTooltip(s: LLMStats): string {
  const lines = [
    t("llm.select.stats.tooltip.header", {
      samples: s.samples,
      votes: s.votes,
    }),
  ];
  if (s.reliability !== undefined) {
    lines.push(
      t("llm.select.stats.tooltip.reliability", { value: pct(s.reliability) })
    );
  }
  if (s.formatting !== undefined) {
    lines.push(
      t("llm.select.stats.tooltip.formatting", { value: pct(s.formatting) })
    );
  }
  if (s.userApproval !== undefined) {
    lines.push(
      t("llm.select.stats.tooltip.approval", { value: pct(s.userApproval) })
    );
  }
  return lines.join("\n");
}
</script>
