<template>
  <div class="space-y-2">
    <!-- The three ways to say how far something reaches, in one vocabulary.
         It is the same question on a guard rule ("whose runs") and on a fact
         snippet ("whose prompts"), and it was three different controls: a
         single-select on one screen, chips where naming nobody meant everybody
         on another, and all/only/except on a third. A person should learn this
         once. -->
    <div class="flex flex-wrap gap-1">
      <button
        v-for="m in modes"
        :key="m"
        type="button"
        class="rounded border px-2 py-0.5 text-xs transition-colors"
        :class="
          mode === m
            ? 'border-primary text-primary bg-primary/5 font-medium'
            : 'text-muted-foreground hover:border-foreground/40'
        "
        :disabled="disabled"
        @click="setMode(m)"
      >
        {{ labels[m] }}
      </button>
    </div>

    <!-- Only where it can matter. Under "all" this is a list somebody fills in
         and then wonders why nothing changed. -->
    <template v-if="mode !== 'all'">
      <div v-if="selected.length" class="flex flex-wrap gap-1">
        <button
          v-for="o in selectedOptions"
          :key="o.id"
          type="button"
          class="inline-flex items-center gap-1 rounded border border-primary/40 bg-primary/5 px-2 py-0.5 text-xs text-primary"
          :disabled="disabled"
          :title="removeLabel"
          @click="toggle(o.id)"
        >
          {{ o.label }}
          <span v-if="o.hint" class="text-primary/60">· {{ o.hint }}</span>
          <X class="h-3 w-3" />
        </button>
      </div>

      <!-- Filterable, because the list is long and the names repeat. A
           workspace with three people called the same thing renders as a wall
           of identical chips, and the two you want are the two you scroll
           past. -->
      <Input
        v-model="filter"
        class="h-7 text-xs"
        :placeholder="filterPlaceholder"
        :disabled="disabled"
      />
      <div class="flex flex-wrap gap-1">
        <button
          v-for="o in shown"
          :key="o.id"
          type="button"
          class="rounded border px-2 py-0.5 text-xs text-muted-foreground hover:text-foreground hover:border-foreground/40"
          :disabled="disabled"
          @click="toggle(o.id)"
        >
          {{ o.label }}
          <!-- The disambiguator. Two rows with the same name are not a
               rendering problem, they are two different things, and a picker
               that cannot tell them apart is one nobody can use. -->
          <span v-if="o.hint" class="text-muted-foreground/60">
            · {{ o.hint }}
          </span>
        </button>
        <button
          v-if="hidden > 0"
          type="button"
          class="self-center text-[11px] text-primary hover:underline"
          @click="expanded = true"
        >
          {{ moreLabel(hidden) }}
        </button>
      </div>
      <p
        v-if="filter && !available.length"
        class="text-[11px] text-muted-foreground"
      >
        {{ noMatchLabel }}
      </p>
      <p v-if="!selected.length" class="text-[11px] text-warning">
        {{ emptyLabels[mode] }}
      </p>
    </template>

    <p class="text-[11px] text-muted-foreground">{{ hints[mode] }}</p>
  </div>
</template>

<script lang="ts" setup>
import { computed, ref } from "vue";
import { Input } from "../ui/input";
import { X } from "lucide-vue-next";

export type ReachMode = "all" | "only" | "except";
export interface ReachOption {
  id: string;
  label: string;
  /** Told apart from a namesake by this — a role, a team, an id fragment. */
  hint?: string;
}

const props = withDefaults(
  defineProps<{
    options: ReachOption[];
    /** Words for the three modes, the empty-list warnings and the hints. The
     *  caller owns them because "every employee" and "every call" are the same
     *  shape and different sentences. */
    labels: Record<ReachMode, string>;
    hints: Record<ReachMode, string>;
    emptyLabels: Record<ReachMode, string>;
    filterPlaceholder: string;
    noMatchLabel: string;
    removeLabel: string;
    moreLabel: (count: number) => string;
    /** Drop "except" where excepting would mean something the product refuses
     *  to store. */
    allowExcept?: boolean;
    /** Drop "all" where it is already said somewhere else — a guard binding
     *  says "every run in this workspace" one control up, and offering it
     *  twice would be two paths writing one row. */
    allowAll?: boolean;
    disabled?: boolean;
    shownWhenCollapsed?: number;
  }>(),
  { allowExcept: true, allowAll: true, disabled: false, shownWhenCollapsed: 8 }
);

const mode = defineModel<ReachMode>("mode", { required: true });
const selected = defineModel<string[]>("selected", { required: true });

const filter = ref("");
const expanded = ref(false);

const modes = computed<ReachMode[]>(() => {
  const out: ReachMode[] = props.allowAll ? ["all"] : [];
  out.push("only");
  if (props.allowExcept) out.push("except");
  return out;
});

const byId = computed(
  () => new Map(props.options.map((o) => [o.id, o] as const))
);
// An id with no option still renders: a chip that vanished because we could
// not name it would understate the reach, which is the one thing this must
// never do.
const selectedOptions = computed(() =>
  selected.value.map((id) => byId.value.get(id) ?? { id, label: id })
);

const available = computed(() => {
  const q = filter.value.trim().toLowerCase();
  return props.options.filter(
    (o) =>
      !selected.value.includes(o.id) &&
      (!q ||
        o.label.toLowerCase().includes(q) ||
        (o.hint ?? "").toLowerCase().includes(q))
  );
});
// Filtering is its own expansion: somebody who typed a name wants everything
// matching it, not the first page of it.
const shown = computed(() =>
  expanded.value || filter.value
    ? available.value
    : available.value.slice(0, props.shownWhenCollapsed)
);
const hidden = computed(() =>
  Math.max(0, available.value.length - shown.value.length)
);

function setMode(m: ReachMode) {
  mode.value = m;
  // "All" names nobody by definition. Keeping a stale list would mean a
  // selection that does nothing today and reappears the moment somebody
  // switches back.
  if (m === "all") selected.value = [];
}

function toggle(id: string) {
  const at = selected.value.indexOf(id);
  if (at >= 0) selected.value = selected.value.filter((x) => x !== id);
  else selected.value = [...selected.value, id];
  filter.value = "";
}
</script>
