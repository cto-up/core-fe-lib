<template>
  <div class="space-y-4">
    <!-- What they lose. Real counts, never a generic warning: a warning that
         says nothing specific is one people learn to click through. -->
    <ul v-if="infoImpacts.length" class="space-y-1 text-sm">
      <li
        v-for="impact in infoImpacts"
        :key="impact.key"
        class="flex items-center gap-2"
      >
        <Info class="h-4 w-4 shrink-0 text-muted-foreground" />
        <span>{{ impactLabel(impact) }}</span>
      </li>
    </ul>

    <p v-if="preview?.dormantUntil" class="text-sm text-muted-foreground">
      {{
        t(dormancyKey, {
          date: formatDate(preview.dormantUntil),
          name: name ?? "",
        })
      }}
    </p>

    <!-- What must be decided. Leaving without answering would orphan content
         other learners are enrolled in, or keep charging a card. -->
    <div
      v-for="impact in decisionImpacts"
      :key="impact.key"
      class="rounded-md border border-border p-3 space-y-2"
    >
      <p class="text-sm font-medium">{{ impactLabel(impact) }}</p>
      <div class="flex flex-wrap gap-2">
        <Button
          v-for="action in impact.actions ?? []"
          :key="action"
          size="sm"
          :variant="
            chosen[impact.key]?.action === action ? 'default' : 'outline'
          "
          @click="choose(impact.key, action)"
        >
          {{ t(`core.organizations.leave.actions.${action}`) }}
        </Button>
      </div>
      <Input
        v-if="chosen[impact.key]?.action === 'transfer'"
        v-model="chosen[impact.key].targetUserId"
        :placeholder="t('core.organizations.leave.transferTarget')"
      />
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed, reactive, watch } from "vue";
import { useI18n } from "vue-i18n";
import { Info } from "lucide-vue-next";

import { Button } from "../ui/button";
import { Input } from "../ui/input";
import type { LeaveImpact } from "../../openapi/core/models/LeaveImpact";
import type { LeaveTenantPreview } from "../../openapi/core/models/LeaveTenantPreview";
import type { LeaveDecision } from "../../openapi/core/models/LeaveDecision";

/**
 * A leave preview's impacts and the decisions they ask for, shared by the
 * member's own leave dialog and the admin's "Remove from the organisation".
 * `decisions` and `ready` are what the confirm button needs. The admin words
 * the dormancy line about the member: `dormancyKey`, with `name`.
 */
const props = withDefaults(
  defineProps<{
    preview: LeaveTenantPreview | null;
    dormancyKey?: string;
    name?: string;
  }>(),
  { dormancyKey: "core.organizations.leave.dormancy", name: undefined }
);
const decisions = defineModel<LeaveDecision[]>("decisions", { default: [] });
const ready = defineModel<boolean>("ready", { default: false });

const { t, te, locale } = useI18n();

const chosen = reactive<
  Record<string, { action: LeaveDecision["action"]; targetUserId?: string }>
>({});

const infoImpacts = computed(() =>
  (props.preview?.impacts ?? []).filter((i) => i.severity === "info")
);
const decisionImpacts = computed(() =>
  (props.preview?.impacts ?? []).filter((i) => i.severity === "decision")
);

// A module contributes impact keys core has never heard of, so an unknown key
// falls back to the server's label rather than rendering a raw i18n path.
function impactLabel(impact: LeaveImpact): string {
  // Impact keys are dotted ("lms.enrollments") and vue-i18n resolves dotted
  // paths by splitting them, so a literal dot can never be matched inside a
  // nested catalog. Underscore it to address one leaf.
  const key = `core.organizations.impacts.${impact.key.replace(/\./g, "_")}`;
  if (te(key)) return t(key, { count: impact.count ?? 0 });
  return impact.label ?? `${impact.key} (${impact.count ?? 0})`;
}

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString(locale.value, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function choose(key: string, action: string) {
  chosen[key] = {
    action: action as LeaveDecision["action"],
    targetUserId: chosen[key]?.targetUserId,
  };
}

// A new preview (a reopened dialog, or the one a 409 carries) keeps the answers
// to the questions it still asks and drops the rest.
watch(
  () => props.preview,
  () => {
    const asked = new Set(decisionImpacts.value.map((i) => i.key));
    Object.keys(chosen).forEach((k) => {
      if (!asked.has(k)) delete chosen[k];
    });
  }
);

// Every decision needs an answer, and a transfer needs somewhere to transfer to.
watch(
  [chosen, decisionImpacts],
  () => {
    ready.value = decisionImpacts.value.every((i) => {
      const d = chosen[i.key];
      if (!d) return false;
      return d.action !== "transfer" || !!d.targetUserId;
    });
    decisions.value = Object.entries(chosen).map(([key, d]) => ({
      key,
      action: d.action,
      targetUserId: d.targetUserId,
    }));
  },
  { deep: true, immediate: true }
);
</script>
