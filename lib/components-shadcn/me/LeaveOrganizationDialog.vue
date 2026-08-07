<template>
  <Dialog :open="open" @update:open="(v: boolean) => emit('update:open', v)">
    <DialogContent class="sm:max-w-lg">
      <DialogHeader>
        <DialogTitle>
          {{
            t("core.organizations.leave.title", {
              name: membership.tenant_name,
            })
          }}
        </DialogTitle>
        <DialogDescription>
          {{ t("core.organizations.leave.subtitle") }}
        </DialogDescription>
      </DialogHeader>

      <div
        v-if="loading"
        class="flex items-center gap-2 py-6 text-sm text-muted-foreground"
      >
        <Loader2 class="h-4 w-4 animate-spin" />
        {{ t("core.organizations.leave.loading") }}
      </div>

      <div v-else class="space-y-4">
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
            t("core.organizations.leave.dormancy", {
              date: formatDate(preview.dormantUntil),
            })
          }}
        </p>

        <!-- What they must decide. Leaving without answering would orphan
             content other learners are enrolled in, or keep charging a card. -->
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

        <p v-if="error" class="text-sm text-destructive">{{ error }}</p>
      </div>

      <DialogFooter>
        <Button
          variant="outline"
          :disabled="busy"
          @click="emit('update:open', false)"
        >
          {{ t("actions.cancel") }}
        </Button>
        <Button
          variant="destructive"
          :disabled="busy || loading || !ready"
          @click="confirm"
        >
          <Loader2 v-if="busy" class="mr-2 h-4 w-4 animate-spin" />
          {{ t("core.organizations.leave.confirm") }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>

<script lang="ts" setup>
import { computed, reactive, ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import { Loader2, Info } from "lucide-vue-next";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { MeService } from "../../openapi/core/services/MeService";
import type { LeaveImpact } from "../../openapi/core/models/LeaveImpact";
import type { LeaveTenantPreview } from "../../openapi/core/models/LeaveTenantPreview";
import type { LeaveDecision } from "../../openapi/core/models/LeaveDecision";
import type { TenantMembership } from "../../openapi/core/models/TenantMembership";

// The generated client throws ApiError; only these two fields are ever read.
type ApiFailure = { status?: number; body?: { message?: string } };

const props = defineProps<{ open: boolean; membership: TenantMembership }>();
const emit = defineEmits<{
  (e: "update:open", value: boolean): void;
  (e: "left"): void;
}>();

const { t, te, locale } = useI18n();

const preview = ref<LeaveTenantPreview | null>(null);
const loading = ref(false);
const busy = ref(false);
const error = ref("");
const chosen = reactive<
  Record<string, { action: LeaveDecision["action"]; targetUserId?: string }>
>({});

const infoImpacts = computed(() =>
  (preview.value?.impacts ?? []).filter((i) => i.severity === "info")
);
const decisionImpacts = computed(() =>
  (preview.value?.impacts ?? []).filter((i) => i.severity === "decision")
);

// Every decision needs an answer, and a transfer needs somewhere to transfer to.
const ready = computed(() =>
  decisionImpacts.value.every((i) => {
    const d = chosen[i.key];
    if (!d) return false;
    return d.action !== "transfer" || !!d.targetUserId;
  })
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

async function load() {
  loading.value = true;
  error.value = "";
  try {
    preview.value = await MeService.getMyLeaveTenantPreview();
  } catch (e) {
    const err = e as ApiFailure;
    error.value =
      err?.body?.message ?? t("core.organizations.leave.previewFailed");
  } finally {
    loading.value = false;
  }
}

async function confirm() {
  busy.value = true;
  error.value = "";
  try {
    await MeService.leaveTenant({
      decisions: Object.entries(chosen).map(([key, d]) => ({
        key,
        action: d.action,
        targetUserId: d.targetUserId,
      })),
    });
    emit("left");
    emit("update:open", false);
  } catch (e) {
    const err = e as ApiFailure;
    // A 409 carries the CURRENT preview, so the dialog re-renders from the
    // error instead of making a second call to find out what changed.
    if (
      err?.status === 409 &&
      (err as { body?: { impacts?: unknown } })?.body?.impacts
    ) {
      preview.value = err.body as unknown as LeaveTenantPreview;
      error.value = t("core.organizations.leave.decisionsOutstanding");
    } else {
      error.value = err?.body?.message ?? t("core.organizations.leave.failed");
    }
  } finally {
    busy.value = false;
  }
}

// immediate, because the parent renders this component with v-if AND open=true
// in the same tick: it mounts already open, so a change-only watcher never
// fires and the dialog sits on an empty preview forever.
watch(
  () => props.open,
  (isOpen) => {
    if (isOpen) {
      Object.keys(chosen).forEach((k) => delete chosen[k]);
      load();
    }
  },
  { immediate: true }
);
</script>
