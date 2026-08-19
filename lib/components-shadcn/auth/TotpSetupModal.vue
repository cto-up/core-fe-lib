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
        {{ t("mfa.setup.totp.title") }}
      </h3>

      <!-- Step 1: QR Code -->
      <div v-if="setupStep === 'qr'" class="space-y-4">
        <p class="text-sm text-muted-foreground">
          {{ t("mfa.setup.totp.scanQR") }}
        </p>
        <div class="qr-code flex justify-center" v-html="qrCode" />
        <div class="text-center">
          <p class="text-xs text-muted-foreground mb-2">
            {{ t("mfa.setup.totp.manualEntry") }}
          </p>
          <code class="bg-muted text-foreground px-3 py-2 rounded text-sm">{{
            secretKey
          }}</code>
        </div>
      </div>

      <!-- Step 2: Verify Code -->
      <div v-if="setupStep === 'verify'" class="space-y-4">
        <p class="text-sm text-muted-foreground">
          {{ t("mfa.setup.totp.enterCode") }}
        </p>
        <input
          :value="modelValue"
          type="text"
          maxlength="6"
          :placeholder="t('mfa.setup.totp.codePlaceholder')"
          class="w-full px-4 py-2 rounded border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          @input="
            $emit(
              'update:modelValue',
              ($event.target as HTMLInputElement).value
            )
          "
        />
        <p v-if="error" class="text-destructive text-sm">
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
          variant="outline"
          class="flex-1"
          @click="emit('cancel')"
        >
          {{ t("mfa.setup.totp.cancel") }}
        </Button>
        <Button v-if="setupStep === 'qr'" class="flex-1" @click="emit('next')">
          {{ t("mfa.setup.totp.next") }}
        </Button>
        <Button
          v-if="setupStep === 'verify'"
          class="flex-1"
          :disabled="!modelValue || modelValue.length !== 6"
          @click="emit('verify')"
        >
          {{ t("mfa.setup.totp.verify") }}
        </Button>
        <Button
          v-if="setupStep === 'recovery'"
          class="w-full font-semibold"
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
