<template>
  <Dialog :open="open" @update:open="(v: boolean) => emit('update:open', v)">
    <DialogContent class="sm:max-w-lg">
      <DialogHeader>
        <DialogTitle>{{ t("core.organizations.close.title") }}</DialogTitle>
        <DialogDescription>
          {{ t("core.organizations.close.subtitle", { count: tenantCount }) }}
        </DialogDescription>
      </DialogHeader>

      <div class="space-y-4">
        <p class="text-sm text-muted-foreground">
          {{ t("core.organizations.close.grace") }}
        </p>

        <!-- Closing ends every membership, so the questions leaving ONE
             organization asks are asked here for all of them. Unanswered is a
             valid answer: each module falls back to its own policy 30 days
             later, when there is nobody left to prompt. -->
        <div
          v-if="loadingPreview"
          class="flex items-center gap-2 text-sm text-muted-foreground"
        >
          <Loader2 class="h-4 w-4 animate-spin" />
          {{ t("core.organizations.close.checking") }}
        </div>

        <div
          v-for="tenant in decisionTenants"
          :key="tenant.tenantId"
          class="rounded-md border border-border p-3 space-y-2"
        >
          <p class="text-sm font-medium">{{ tenant.tenantName }}</p>
          <div
            v-for="impact in decisionsOf(tenant)"
            :key="impact.key"
            class="space-y-2"
          >
            <p class="text-sm">{{ impactLabel(impact) }}</p>
            <div class="flex flex-wrap gap-2">
              <Button
                v-for="action in impact.actions ?? []"
                :key="action"
                size="sm"
                :variant="
                  chosen[`${tenant.tenantId}|${impact.key}`] === action
                    ? 'default'
                    : 'outline'
                "
                @click="choose(tenant.tenantId, impact.key, action)"
              >
                {{ t(`core.organizations.leave.actions.${action}`) }}
              </Button>
            </div>
          </div>
          <p class="text-xs text-muted-foreground">
            {{ t("core.organizations.close.defaultPolicy") }}
          </p>
        </div>

        <!-- Offered here rather than buried in a settings page: it covers the
             portability obligation and it is what a good share of the people
             who click delete actually wanted. -->
        <Button
          variant="outline"
          size="sm"
          :disabled="exporting"
          @click="exportData"
        >
          <Loader2 v-if="exporting" class="mr-2 h-4 w-4 animate-spin" />
          <Download v-else class="mr-2 h-4 w-4" />
          {{ t("core.organizations.close.export") }}
        </Button>

        <div class="space-y-2">
          <Label for="confirm-email">{{
            t("core.organizations.close.confirmLabel")
          }}</Label>
          <Input
            id="confirm-email"
            v-model="confirmEmail"
            type="email"
            autocomplete="off"
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
          :disabled="busy || !confirmEmail"
          @click="confirm"
        >
          <Loader2 v-if="busy" class="mr-2 h-4 w-4 animate-spin" />
          {{ t("core.organizations.close.confirm") }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>

<script lang="ts" setup>
import { computed, reactive, ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import { Loader2, Download } from "lucide-vue-next";

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
import { Label } from "../ui/label";
import { MeService } from "../../openapi/core/services/MeService";
import type { AccountClosurePreview } from "../../openapi/core/models/AccountClosurePreview";
import type { TenantClosureImpact } from "../../openapi/core/models/TenantClosureImpact";
import type { TenantLeaveDecision } from "../../openapi/core/models/TenantLeaveDecision";
import type { LeaveImpact } from "../../openapi/core/models/LeaveImpact";

// The generated client throws ApiError; only these two fields are ever read.
type ApiFailure = { status?: number; body?: { message?: string } };

const props = defineProps<{ open: boolean; tenantCount: number }>();
const emit = defineEmits<{
  (e: "update:open", value: boolean): void;
  (e: "scheduled"): void;
}>();

const { t, te } = useI18n();
const confirmEmail = ref("");
const preview = ref<AccountClosurePreview | null>(null);
const loadingPreview = ref(false);
// Keyed "<tenantId>|<impactKey>" so one organization's answer never overwrites
// another's — the same impact key appears in every tenant.
const chosen = reactive<Record<string, TenantLeaveDecision["action"]>>({});

const decisionTenants = computed(() =>
  (preview.value?.tenants ?? []).filter((t) => decisionsOf(t).length > 0)
);

function decisionsOf(tenant: TenantClosureImpact): LeaveImpact[] {
  return tenant.impacts.filter((i) => i.severity === "decision");
}

// A module contributes keys core has never heard of, so an unknown key falls
// back to the server's label rather than rendering a raw i18n path.
function impactLabel(impact: LeaveImpact): string {
  const key = `core.organizations.impacts.${impact.key.replace(/\./g, "_")}`;
  if (te(key)) return t(key, { count: impact.count ?? 0 });
  return impact.label ?? `${impact.key} (${impact.count ?? 0})`;
}

function choose(tenantId: string, key: string, action: string) {
  chosen[`${tenantId}|${key}`] = action as TenantLeaveDecision["action"];
}

async function loadPreview() {
  loadingPreview.value = true;
  try {
    preview.value = await MeService.getMyAccountClosurePreview();
  } catch {
    // The preview is advisory: failing to fetch it must not block somebody from
    // closing their account. The policy fallback still applies.
    preview.value = null;
  } finally {
    loadingPreview.value = false;
  }
}
const busy = ref(false);
const exporting = ref(false);
const error = ref("");

async function exportData() {
  exporting.value = true;
  try {
    const data = await MeService.exportMyData();
    const url = URL.createObjectURL(
      new Blob([JSON.stringify(data, null, 2)], { type: "application/json" })
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = "my-data.json";
    link.click();
    URL.revokeObjectURL(url);
  } catch (e) {
    const err = e as ApiFailure;
    error.value =
      err?.body?.message ?? t("core.organizations.close.exportFailed");
  } finally {
    exporting.value = false;
  }
}

async function confirm() {
  busy.value = true;
  error.value = "";
  try {
    await MeService.scheduleMyAccountDeletion({
      confirmEmail: confirmEmail.value,
      decisions: Object.entries(chosen).map(([composite, action]) => {
        const [tenantId, key] = composite.split("|");
        return { tenantId, key, action };
      }),
    });
    emit("scheduled");
    emit("update:open", false);
  } catch (e) {
    const err = e as ApiFailure;
    // The server checks the typed email against the caller's own. A mismatch is
    // the user's to fix, so it is stated rather than swallowed.
    error.value =
      err?.status === 400
        ? t("core.organizations.close.emailMismatch")
        : (err?.body?.message ?? t("core.organizations.close.failed"));
  } finally {
    busy.value = false;
  }
}
// immediate: the parent may render this already open, and a change-only watcher
// would leave the dialog on an empty preview.
watch(
  () => props.open,
  (isOpen) => {
    if (isOpen) {
      Object.keys(chosen).forEach((k) => delete chosen[k]);
      loadPreview();
    }
  },
  { immediate: true }
);
</script>
