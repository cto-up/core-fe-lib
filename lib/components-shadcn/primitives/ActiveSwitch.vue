<script setup lang="ts">
import { ref, watch } from "vue";
import { Switch } from "core-fe-lib/components-shadcn/ui/switch";
import { useToast } from "core-fe-lib/components-shadcn/ui/toast/use-toast";
import { useErrors } from "core-fe-lib/components-shadcn/composables/useErrors";

/**
 * One control for every activate/deactivate toggle on the platform. Flips
 * instantly via the caller-supplied `toggle` (a dedicated PUT …/{id}/active
 * endpoint), optimistic with revert + toast on failure. `variant="row"` is the
 * framed status block used in editors; `variant="inline"` is the bare Switch
 * for list rows and card headers.
 *
 * It lives HERE rather than in the module that first needed it, because the
 * second consumer was the workflow editor — and a workflow importing from the
 * AI employee's frontend would be the one edge no fe-lib draws: they all reach
 * into core, never sideways into another engine. That is the same separation
 * ADR 055 §7 enforces on the backend with `go list -deps`.
 */
const props = withDefaults(
  defineProps<{
    modelValue: boolean;
    toggle: (next: boolean) => Promise<void>;
    variant?: "row" | "inline";
    disabled?: boolean;
    onLabel?: string;
    offLabel?: string;
    onHint?: string;
    offHint?: string;
    successMessage?: string;
  }>(),
  {
    variant: "inline",
    disabled: false,
    onLabel: "Active",
    offLabel: "Inactive",
    onHint: "",
    offHint: "",
    successMessage: "",
  }
);

const emit = defineEmits<{
  (e: "update:modelValue", value: boolean): void;
}>();

const { toast } = useToast();
const { handleError } = useErrors();

const internal = ref(props.modelValue);
const pending = ref(false);

watch(
  () => props.modelValue,
  (v) => {
    if (!pending.value) internal.value = v;
  }
);

async function onChange(next: boolean) {
  if (pending.value) return;
  internal.value = next; // optimistic
  pending.value = true;
  try {
    await props.toggle(next);
    emit("update:modelValue", next);
    if (props.successMessage) toast({ title: props.successMessage });
  } catch (e) {
    internal.value = !next; // revert
    handleError(e);
  } finally {
    pending.value = false;
  }
}
</script>

<template>
  <!-- Framed status row for editors: the whole frame flips to a warning tint
       when off, so the disabled state reads at a glance. -->
  <div
    v-if="variant === 'row'"
    class="rounded-xl border p-4 transition-colors"
    :class="
      internal
        ? 'border-primary/30 bg-primary/5'
        : 'border-warning/50 bg-warning/10'
    "
  >
    <div class="flex items-start justify-between gap-4">
      <div class="space-y-1">
        <div class="flex items-center gap-2">
          <span
            class="inline-block h-2.5 w-2.5 rounded-full shrink-0"
            :class="internal ? 'bg-primary' : 'bg-warning'"
          />
          <span
            class="text-sm font-semibold"
            :class="internal ? '' : 'text-warning'"
          >
            {{ internal ? onLabel : offLabel }}
          </span>
        </div>
        <p
          v-if="onHint || offHint"
          class="text-xs text-muted-foreground leading-tight"
        >
          {{ internal ? onHint : offHint }}
        </p>
      </div>
      <Switch
        :checked="internal"
        :disabled="disabled || pending"
        class="mt-1 shrink-0"
        @update:checked="onChange"
      />
    </div>
  </div>

  <!-- Bare inline Switch for list rows / card headers. -->
  <Switch
    v-else
    :checked="internal"
    :disabled="disabled || pending"
    :aria-label="internal ? onLabel : offLabel"
    @update:checked="onChange"
  />
</template>
