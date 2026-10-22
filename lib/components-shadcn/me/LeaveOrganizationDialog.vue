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
        <LeaveImpactList
          v-model:decisions="decisions"
          v-model:ready="ready"
          :preview="preview"
        />
        <p v-if="error" class="text-sm text-error">{{ error }}</p>
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
import { ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import { Loader2 } from "lucide-vue-next";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Button } from "../ui/button";
import LeaveImpactList from "./LeaveImpactList.vue";
import { MeService } from "../../openapi/core/services/MeService";
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

const { t } = useI18n();

const preview = ref<LeaveTenantPreview | null>(null);
const loading = ref(false);
const busy = ref(false);
const error = ref("");
const decisions = ref<LeaveDecision[]>([]);
const ready = ref(false);

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
    await MeService.leaveTenant({ decisions: decisions.value });
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
      preview.value = null;
      load();
    }
  },
  { immediate: true }
);
</script>
