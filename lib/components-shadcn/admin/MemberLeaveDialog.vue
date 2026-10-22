<template>
  <Dialog :open="open" @update:open="(v: boolean) => emit('update:open', v)">
    <DialogContent class="sm:max-w-lg">
      <DialogHeader>
        <DialogTitle>
          {{ t("core.user.dataRights.leave.title", { name: member.name }) }}
        </DialogTitle>
        <DialogDescription>
          {{ t("core.user.dataRights.leave.subtitle", { name: member.name }) }}
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
          dormancy-key="core.user.dataRights.leave.dormancy"
          :name="member.name"
        />
        <p v-if="error" class="text-sm text-error" role="alert">{{ error }}</p>
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
          :disabled="busy || loading || !preview || !ready"
          data-testid="member-leave-confirm"
          @click="confirm"
        >
          <Loader2 v-if="busy" class="mr-2 h-4 w-4 animate-spin" />
          {{ t("core.user.dataRights.leave.confirm") }}
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
import LeaveImpactList from "../me/LeaveImpactList.vue";
import {
  memberDataRights,
  refusalText,
  type Member,
} from "./member-data-rights";
import type { LeaveTenantPreview } from "../../openapi/core/models/LeaveTenantPreview";
import type { LeaveDecision } from "../../openapi/core/models/LeaveDecision";

type ApiFailure = {
  status?: number;
  body?: { message?: string; impacts?: unknown };
};

const props = defineProps<{
  open: boolean;
  member: Member;
  tenantId?: string;
}>();
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
  preview.value = null;
  try {
    preview.value = await memberDataRights(props.tenantId).leavePreview(
      props.member.id
    );
  } catch (e) {
    error.value =
      refusalText(t, e, props.member.name) ??
      (e as ApiFailure)?.body?.message ??
      t("core.organizations.leave.previewFailed");
  } finally {
    loading.value = false;
  }
}

async function confirm() {
  busy.value = true;
  error.value = "";
  try {
    await memberDataRights(props.tenantId).leave(
      props.member.id,
      decisions.value
    );
    emit("left");
    emit("update:open", false);
  } catch (e) {
    const err = e as ApiFailure;
    // A 409 carries the member's current preview: re-render from it.
    if (err?.status === 409 && err.body?.impacts) {
      preview.value = err.body as unknown as LeaveTenantPreview;
      error.value = t("core.organizations.leave.decisionsOutstanding");
    } else {
      error.value = err?.body?.message ?? t("core.organizations.leave.failed");
    }
  } finally {
    busy.value = false;
  }
}

watch(
  () => props.open,
  (isOpen) => {
    if (isOpen) load();
  },
  { immediate: true }
);
</script>
