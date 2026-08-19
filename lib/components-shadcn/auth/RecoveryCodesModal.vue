<template>
  <div
    v-if="show"
    class="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
    @click.self="emit('cancel')"
  >
    <div
      class="bg-background text-foreground border border-border rounded-lg p-8 max-w-md w-full mx-4 shadow-lg"
    >
      <h3 class="text-xl font-bold mb-4">
        {{ t("mfa.setup.recovery.title") }}
      </h3>

      <RecoveryCodeDisplay
        :recovery-codes="recoveryCodes"
        class="mb-4"
        @copy="emit('copy')"
        @download="emit('download')"
      />

      <div class="flex gap-3">
        <Button variant="outline" class="flex-1" @click="emit('cancel')">
          {{ t("mfa.setup.totp.cancel") }}
        </Button>
        <Button
          class="flex-1 font-semibold"
          :disabled="!recoveryCodesInteracted"
          @click="emit('confirm')"
        >
          {{ t("mfa.setup.recovery.confirm") }}
        </Button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from "vue-i18n";
import { Button } from "../ui/button";
import RecoveryCodeDisplay from "./RecoveryCodeDisplay.vue";

const { t } = useI18n();

defineProps<{
  show: boolean;
  recoveryCodes: string[];
  recoveryCodesInteracted: boolean;
}>();

const emit = defineEmits<{
  (e: "cancel"): void;
  (e: "copy"): void;
  (e: "download"): void;
  (e: "confirm"): void;
}>();
</script>
