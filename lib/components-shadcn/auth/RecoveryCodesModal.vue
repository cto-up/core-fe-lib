<template>
  <div
    v-if="show"
    class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
    @click.self="emit('cancel')"
  >
    <div class="bg-white rounded-lg p-8 max-w-md w-full mx-4">
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
        <Button
          class="flex-1 px-4 py-2 border rounded hover:bg-gray-50"
          @click="emit('cancel')"
        >
          {{ t("mfa.setup.totp.cancel") }}
        </Button>
        <Button
          class="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
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
