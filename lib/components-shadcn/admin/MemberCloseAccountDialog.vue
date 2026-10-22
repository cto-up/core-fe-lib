<template>
  <Dialog :open="open" @update:open="(v: boolean) => emit('update:open', v)">
    <DialogContent class="sm:max-w-lg">
      <DialogHeader>
        <DialogTitle>
          {{ t("core.user.dataRights.close.title", { name: member.name }) }}
        </DialogTitle>
        <DialogDescription>
          {{
            t("core.user.dataRights.close.body", {
              name: member.name,
              date: formatDate(deletesOn),
            })
          }}
        </DialogDescription>
      </DialogHeader>

      <div class="space-y-2">
        <Label :for="reasonId">{{
          t("core.user.dataRights.close.reason")
        }}</Label>
        <Textarea :id="reasonId" v-model="reason" maxlength="500" />
      </div>
      <p v-if="error" class="text-sm text-error" role="alert">{{ error }}</p>

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
          :disabled="busy"
          data-testid="member-close-confirm"
          @click="confirm"
        >
          <Loader2 v-if="busy" class="mr-2 h-4 w-4 animate-spin" />
          {{ t("core.user.dataRights.close.confirm") }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>

<script lang="ts" setup>
import { ref, useId, watch } from "vue";
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
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import {
  memberDataRights,
  refusalText,
  type Member,
} from "./member-data-rights";

// The server's grace period (core-be-lib DeletionGrace): the date shown before
// confirming. The confirmation reports the server's own date.
const GRACE_DAYS = 30;

const props = defineProps<{
  open: boolean;
  member: Member;
  tenantId?: string;
}>();
const emit = defineEmits<{
  (e: "update:open", value: boolean): void;
  (e: "closed", deletesOn: string): void;
}>();

const { t, locale } = useI18n();
const reasonId = useId();

const reason = ref("");
const busy = ref(false);
const error = ref("");
const deletesOn = ref("");

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString(locale.value, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

async function confirm() {
  busy.value = true;
  error.value = "";
  try {
    const status = await memberDataRights(props.tenantId).closeAccount(
      props.member.id,
      reason.value.trim() || undefined
    );
    emit("closed", status.scheduledFor ?? deletesOn.value);
    emit("update:open", false);
  } catch (e) {
    error.value =
      refusalText(t, e, props.member.name) ??
      (e as { body?: { message?: string } })?.body?.message ??
      t("core.user.dataRights.close.failed");
  } finally {
    busy.value = false;
  }
}

watch(
  () => props.open,
  (isOpen) => {
    if (!isOpen) return;
    reason.value = "";
    error.value = "";
    deletesOn.value = new Date(
      Date.now() + GRACE_DAYS * 24 * 3600_000
    ).toISOString();
  },
  { immediate: true }
);
</script>
