<template>
  <Badge v-if="count" :variant="badgeVariant" class="flex items-center gap-1">
    <component :is="iconComponent" class="h-3 w-3" />
    {{ label }}
    <Tooltip>
      <TooltipTrigger as-child>
        <span class="sr-only">{{ tooltip }}</span>
      </TooltipTrigger>
      <TooltipContent>
        <p>{{ tooltip }}</p>
      </TooltipContent>
    </Tooltip>
  </Badge>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { Badge } from "../ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";
import { CheckCircle, RefreshCw } from "lucide-vue-next";

const props = withDefaults(
  defineProps<{
    count: number;
    savedLabel?: string;
    savingLabel?: (n: number) => string;
    savedTooltip?: string;
    pendingTooltip?: (n: number) => string;
  }>(),
  {
    savedLabel: "Saved",
    savingLabel: (n: number) => `Saving ${n} item${n > 1 ? "s" : ""}`,
    savedTooltip: "All changes are saved",
    pendingTooltip: (n: number) => `${n} change${n > 1 ? "s" : ""} pending`,
  }
);

const badgeVariant = computed(() => {
  if (props.count === 0) return "default";
  if (props.count < 5) return "secondary";
  return "destructive";
});

const iconComponent = computed(() =>
  props.count === 0 ? CheckCircle : RefreshCw
);

const label = computed(() =>
  props.count === 0 ? props.savedLabel : props.savingLabel(props.count)
);

const tooltip = computed(() =>
  props.count === 0 ? props.savedTooltip : props.pendingTooltip(props.count)
);
</script>
