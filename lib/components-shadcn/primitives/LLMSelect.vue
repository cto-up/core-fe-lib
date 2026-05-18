<template>
  <div class="space-y-2">
    <Label v-if="label" :for="id">{{ label }}</Label>
    <Select
      :model-value="modelValue"
      @update:model-value="$emit('update:modelValue', $event)"
    >
      <SelectTrigger :id="id" class="w-full">
        <SelectValue :placeholder="placeholder ?? 'Select a model…'" />
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
                <span>{{ m.label }}</span>
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
                    R {{ pct(m.stats.reliability) }}
                  </span>
                  <span
                    v-if="m.stats.formatting !== undefined"
                    class="px-1 rounded bg-muted"
                    :class="scoreClass(m.stats.formatting)"
                  >
                    F {{ pct(m.stats.formatting) }}
                  </span>
                  <span
                    v-if="m.stats.userApproval !== undefined"
                    class="px-1 rounded bg-muted"
                    :class="scoreClass(m.stats.userApproval)"
                  >
                    ★ {{ pct(m.stats.userApproval) }} ({{ m.stats.votes }})
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
          <SelectLabel>Loading…</SelectLabel>
        </SelectGroup>
      </SelectContent>
    </Select>
    <p v-if="hint" class="text-xs text-muted-foreground">
      {{ hint }}
    </p>
  </div>
</template>

<script lang="ts" setup>
import { computed, ref, watch } from "vue";
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
}

export type LLMCapability =
  | "text"
  | "vision"
  | "ocr"
  | "layout"
  | "embedder"
  | "reasoning"
  | "code"
  | "audio"
  | "moderation";

export interface LLMFetcherArgs {
  provider?: string;
  capability?: LLMCapability;
  taskType?: string;
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
  }
);

defineEmits<{
  (e: "update:modelValue", value: string): void;
}>();

const entries = ref<LLMRegistryEntry[]>([]);
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

const groups = computed(() => {
  const byProvider = new Map<string, LLMRegistryEntry[]>();
  for (const e of entries.value) {
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
  if (isLocal) return "local · free";
  if (m.price_input_per_million === 0 && m.price_output_per_million === 0) {
    return "—";
  }
  const c = PROVIDER_CURRENCY[m.provider] ?? "";
  return `${c}${fmtPrice(m.price_input_per_million)} in / ${c}${fmtPrice(
    m.price_output_per_million
  )} out per M`;
}

async function fetchEntries() {
  if (!props.fetcher) return;
  loading.value = true;
  try {
    entries.value = await props.fetcher({
      provider: props.provider || undefined,
      capability: props.capability,
      taskType: props.taskType || undefined,
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
  [() => props.taskType, () => props.capability, () => props.provider],
  () => {
    if (props.fetcher) void fetchEntries();
  },
  { immediate: true }
);

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
  const lines = [`Last 30 days · ${s.samples} call(s) · ${s.votes} vote(s)`];
  if (s.reliability !== undefined) {
    lines.push(`Reliability: ${pct(s.reliability)} (calls that completed)`);
  }
  if (s.formatting !== undefined) {
    lines.push(`Formatting: ${pct(s.formatting)} (clean JSON on first try)`);
  }
  if (s.userApproval !== undefined) {
    lines.push(`User approval: ${pct(s.userApproval)} (👍 ÷ 👍+👎)`);
  }
  return lines.join("\n");
}
</script>
