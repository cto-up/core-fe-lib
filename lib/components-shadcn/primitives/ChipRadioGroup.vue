<template>
  <div class="min-w-0 space-y-2">
    <template v-if="searchOptions">
      <div class="relative">
        <Search
          class="pointer-events-none absolute left-3 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden="true"
        />
        <Input
          :id="`${idPrefix}-search`"
          v-model="query"
          type="search"
          autocomplete="off"
          class="min-h-11 pl-9 pr-10"
          :aria-label="searchPlaceholder"
          :placeholder="searchPlaceholder"
          :aria-keyshortcuts="shortcut"
          :aria-controls="`${idPrefix}-results`"
          :data-test="`${idPrefix}-search`"
          @keydown.down.prevent="move(0)"
          @keydown.enter.prevent="pickFirst"
        />
        <kbd
          v-if="shortcut && !query"
          class="pointer-events-none absolute right-3 top-1/2 z-10 -translate-y-1/2 rounded bg-muted px-1.5 font-mono text-xs text-muted-foreground"
          aria-hidden="true"
          >{{ shortcut }}</kbd
        >
      </div>
      <div
        v-if="query.trim()"
        :id="`${idPrefix}-results`"
        ref="results"
        class="space-y-1"
        :data-test="`${idPrefix}-results`"
        @keydown="onResultsKeydown"
      >
        <button
          v-for="o in matches"
          :key="o.value"
          type="button"
          class="flex min-h-11 w-full items-center justify-between gap-3 rounded-md px-3 text-left text-sm hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          data-chip-result
          :data-test="`${idPrefix}-result-${o.key ?? o.value}`"
          @click="pickResult(o)"
        >
          <span class="min-w-0 truncate">{{ o.label }}</span>
          <span
            v-if="o.hint"
            class="shrink-0 font-mono text-xs text-muted-foreground"
            >{{ o.hint }}</span
          >
        </button>
        <p
          v-if="!matches.length"
          role="status"
          class="py-2 text-sm text-muted-foreground"
          :data-test="`${idPrefix}-none`"
        >
          {{ noMatchLabel?.(query.trim()) }}
        </p>
      </div>
    </template>
    <div
      :class="
        scroll
          ? '-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0'
          : 'flex flex-wrap gap-2'
      "
    >
      <RadioGroup
        :model-value="modelValue ?? ''"
        class="contents"
        :aria-label="label"
        :aria-describedby="describedBy"
        @update:model-value="(v) => emit('update:modelValue', String(v))"
      >
        <Label
          v-for="o in options"
          :key="o.value"
          :for="`${idPrefix}-${o.key ?? o.value}`"
          :class="[CHIP, mono ? 'min-w-16 font-mono' : '']"
        >
          <RadioGroupItem
            :id="`${idPrefix}-${o.key ?? o.value}`"
            :value="o.value"
            class="sr-only"
            :data-test="`${idPrefix}-${o.key ?? o.value}`"
          />
          {{ o.label }}
        </Label>
      </RadioGroup>
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, ref } from "vue";
import { Search } from "lucide-vue-next";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { RadioGroup, RadioGroupItem } from "../ui/radio-group";
import { startsAWord, type ChipOption } from "./chip-radio-group";

/**
 * One choice among a few, as a row of chips (a radio group: arrows move,
 * the label names it). With `searchOptions` a search field above reaches
 * every option, not only the chips; a result picked becomes the value and
 * its chip is focused. The slot follows the chips ("More…").
 */
const CHIP =
  "flex min-h-11 shrink-0 cursor-pointer items-center justify-center whitespace-nowrap rounded-full border px-4 font-normal has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:bg-primary has-[[data-state=checked]]:text-primary-foreground";

const props = withDefaults(
  defineProps<{
    options: ChipOption[];
    modelValue?: string;
    /** What the group is, for a screen reader. */
    label: string;
    /** Prefix of every id and data-test. */
    idPrefix: string;
    describedBy?: string;
    /** Numbers and durations: the mono face, a minimum width. */
    mono?: boolean;
    /** On a phone the row scrolls sideways instead of wrapping. */
    scroll?: boolean;
    /** Every option the search reaches; no search field without it. */
    searchOptions?: ChipOption[];
    searchPlaceholder?: string;
    /** The key that focuses the search, shown in the field ("/"). */
    shortcut?: string;
    noMatchLabel?: (query: string) => string;
  }>(),
  {
    modelValue: undefined,
    describedBy: undefined,
    mono: false,
    scroll: false,
    searchOptions: undefined,
    searchPlaceholder: undefined,
    shortcut: undefined,
    noMatchLabel: undefined,
  }
);
const emit = defineEmits<{ "update:modelValue": [value: string] }>();

const query = ref("");
const results = ref<HTMLElement | null>(null);

const matches = computed(() =>
  (props.searchOptions ?? []).filter((o) => startsAWord(o.label, query.value))
);

function pickResult(o: ChipOption) {
  emit("update:modelValue", o.value);
  query.value = "";
  nextTick(() =>
    document.getElementById(`${props.idPrefix}-${o.key ?? o.value}`)?.focus()
  );
}

function pickFirst() {
  const first = matches.value[0];
  if (first) pickResult(first);
}

const resultButtons = () =>
  Array.from(
    results.value?.querySelectorAll<HTMLElement>("[data-chip-result]") ?? []
  );

function move(i: number) {
  resultButtons()[i]?.focus();
}

/** Up and Down walk the results; Up from the first goes back to the search. */
function onResultsKeydown(e: KeyboardEvent) {
  if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return;
  e.preventDefault();
  const all = resultButtons();
  const at = all.indexOf(document.activeElement as HTMLElement);
  const next = at + (e.key === "ArrowDown" ? 1 : -1);
  if (next < 0) document.getElementById(`${props.idPrefix}-search`)?.focus();
  else all[Math.min(next, all.length - 1)]?.focus();
}
</script>
