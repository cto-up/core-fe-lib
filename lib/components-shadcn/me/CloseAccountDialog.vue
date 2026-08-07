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
import { ref } from "vue";
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

// The generated client throws ApiError; only these two fields are ever read.
type ApiFailure = { status?: number; body?: { message?: string } };

defineProps<{ open: boolean; tenantCount: number }>();
const emit = defineEmits<{
  (e: "update:open", value: boolean): void;
  (e: "scheduled"): void;
}>();

const { t } = useI18n();
const confirmEmail = ref("");
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
</script>
