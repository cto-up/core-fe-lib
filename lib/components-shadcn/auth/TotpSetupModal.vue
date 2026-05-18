<template>
  <div
    v-if="show"
    class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
    @click.self="emit('cancel')"
  >
    <div class="bg-white rounded-lg p-8 max-w-md w-full mx-4">
      <h3 class="text-xl font-bold mb-4">
        {{ t("mfa.setup.totp.title") }}
      </h3>

      <!-- Step 1: QR Code -->
      <div v-if="setupStep === 'qr'" class="space-y-4">
        <p class="text-sm text-gray-600">
          {{ t("mfa.setup.totp.scanQR") }}
        </p>
        <div class="qr-code flex justify-center" v-html="qrCode" />
        <div class="text-center">
          <p class="text-xs text-gray-500 mb-2">
            {{ t("mfa.setup.totp.manualEntry") }}
          </p>
          <code class="bg-gray-100 px-3 py-2 rounded text-sm">{{
            secretKey
          }}</code>
        </div>
      </div>

      <!-- Step 2: Verify Code -->
      <div v-if="setupStep === 'verify'" class="space-y-4">
        <p class="text-sm text-gray-600">
          {{ t("mfa.setup.totp.enterCode") }}
        </p>
        <input
          :value="modelValue"
          type="text"
          maxlength="6"
          :placeholder="t('mfa.setup.totp.codePlaceholder')"
          class="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          @input="
            $emit(
              'update:modelValue',
              ($event.target as HTMLInputElement).value
            )
          "
        />
        <p v-if="error" class="text-red-600 text-sm">
          {{ error }}
        </p>
      </div>

      <!-- Step 3: Recovery Codes -->
      <div v-if="setupStep === 'recovery'">
        <RecoveryCodeDisplay
          :recovery-codes="recoveryCodes"
          @copy="emit('copy-recovery')"
          @download="emit('download-recovery')"
        />
      </div>

      <!-- Actions -->
      <div class="flex gap-3 mt-6">
        <Button
          v-if="setupStep !== 'recovery'"
          class="flex-1 px-4 py-2 border rounded hover:bg-gray-50"
          @click="emit('cancel')"
        >
          {{ t("mfa.setup.totp.cancel") }}
        </Button>
        <Button
          v-if="setupStep === 'qr'"
          class="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          @click="emit('next')"
        >
          {{ t("mfa.setup.totp.next") }}
        </Button>
        <Button
          v-if="setupStep === 'verify'"
          class="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          :disabled="!modelValue || modelValue.length !== 6"
          @click="emit('verify')"
        >
          {{ t("mfa.setup.totp.verify") }}
        </Button>
        <Button
          v-if="setupStep === 'recovery'"
          class="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
          :disabled="!recoveryCodesInteracted"
          @click="emit('confirm-recovery')"
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
  setupStep: "qr" | "verify" | "recovery";
  qrCode: string;
  secretKey: string;
  modelValue: string; // for totpCode
  error: string;
  recoveryCodes: string[];
  recoveryCodesInteracted: boolean;
}>();

const emit = defineEmits<{
  (e: "update:modelValue", value: string): void;
  (e: "cancel"): void;
  (e: "next"): void;
  (e: "verify"): void;
  (e: "copy-recovery"): void;
  (e: "download-recovery"): void;
  (e: "confirm-recovery"): void;
}>();
</script>
