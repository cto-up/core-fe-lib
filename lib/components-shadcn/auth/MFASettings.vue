<template>
  <div class="mfa-settings">
    <h2 class="text-2xl font-bold mb-6">
      {{ t("mfa.title") }}
    </h2>

    <div v-if="loading" class="loading">
      <p>{{ t("common.loading") }}...</p>
    </div>

    <div v-else class="space-y-6">
      <!-- Current AAL Status -->
      <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p class="text-sm text-blue-800">
          <strong>{{ t("mfa.currentLevel") }}:</strong>
          {{
            mfaStatus.aal === "aal2"
              ? t("mfa.levelEnhanced")
              : t("mfa.levelStandard")
          }}
        </p>
      </div>

      <!-- TOTP Section -->
      <MfaMethodCard
        :title="t('mfa.methods.totp.title')"
        :description="t('mfa.methods.totp.description')"
        :enabled="mfaStatus.totp_enabled"
        :status-text="
          mfaStatus.totp_enabled
            ? t('mfa.methods.totp.enabled')
            : t('mfa.methods.totp.disabled')
        "
      >
        <Button
          v-if="!mfaStatus.totp_enabled"
          class="btn-primary px-4 py-2"
          @click="setupTOTP"
        >
          {{ t("mfa.methods.totp.setup") }}
        </Button>
        <Button v-else class="btn-danger px-4 py-2" @click="disableTOTP">
          {{ t("mfa.methods.totp.disable") }}
        </Button>
      </MfaMethodCard>

      <!-- WebAuthn Section -->
      <MfaMethodCard
        :title="t('mfa.methods.webauthn.title')"
        :description="t('mfa.methods.webauthn.description')"
        :enabled="mfaStatus.webauthn_enabled"
        :status-text="
          mfaStatus.webauthn_enabled
            ? t('mfa.methods.webauthn.enabled')
            : t('mfa.methods.webauthn.disabled')
        "
      >
        <Button
          v-if="!mfaStatus.webauthn_enabled"
          class="btn-primary px-4 py-2"
          @click="setupWebAuthn"
        >
          {{ t("mfa.methods.webauthn.setup") }}
        </Button>
        <Button v-else class="btn-danger px-4 py-2" @click="disableWebAuthn">
          {{ t("mfa.methods.webauthn.disable") }}
        </Button>
      </MfaMethodCard>

      <!-- Recovery Codes -->
      <MfaMethodCard
        v-if="mfaStatus.totp_enabled || mfaStatus.webauthn_enabled"
        :title="t('mfa.methods.recovery.title')"
        :description="t('mfa.methods.recovery.description')"
        :enabled="mfaStatus.recovery_codes_set"
        :status-text="
          mfaStatus.recovery_codes_set
            ? t('mfa.methods.recovery.generated')
            : t('mfa.methods.recovery.notGenerated')
        "
      >
        <Button class="btn-secondary px-4 py-2" @click="generateRecoveryCodes">
          {{
            mfaStatus.recovery_codes_set
              ? t("mfa.methods.recovery.regenerate")
              : t("mfa.methods.recovery.generate")
          }}
        </Button>
      </MfaMethodCard>
    </div>

    <!-- Modals -->
    <TotpSetupModal
      v-model="totpCode"
      :show="showTOTPSetup"
      :setup-step="totpSetupStep"
      :qr-code="totpQRCode"
      :secret-key="totpSecretKey"
      :error="totpError"
      :recovery-codes="recoveryCodes"
      :recovery-codes-interacted="recoveryCodesInteracted"
      @cancel="cancelTOTPSetup"
      @next="totpSetupStep = 'verify'"
      @verify="verifyTOTP"
      @copy-recovery="handleCopyRecoveryCodes"
      @download-recovery="handleDownloadRecoveryCodes"
      @confirm-recovery="confirmRecoveryCodesAndFinish"
    />

    <RecoveryCodesModal
      :show="showRecoveryCodes"
      :recovery-codes="recoveryCodes"
      :recovery-codes-interacted="recoveryCodesInteracted"
      @cancel="cancelRecoveryCodesModal"
      @copy="handleCopyRecoveryCodesStandalone"
      @download="handleDownloadRecoveryCodesStandalone"
      @confirm="confirmAndSaveRecoveryCodes"
    />
  </div>
</template>

<script setup lang="ts">
import { useMfa } from "../../authentication/vue";
import MfaMethodCard from "../primitives/MfaMethodCard.vue";
import TotpSetupModal from "./TotpSetupModal.vue";
import RecoveryCodesModal from "./RecoveryCodesModal.vue";
import { Button } from "../ui/button";
const {
  t,
  loading,
  mfaStatus,
  showTOTPSetup,
  totpSetupStep,
  totpQRCode,
  totpSecretKey,
  totpCode,
  totpError,
  showRecoveryCodes,
  recoveryCodes,
  recoveryCodesInteracted,
  setupTOTP,
  disableTOTP,
  setupWebAuthn,
  disableWebAuthn,
  generateRecoveryCodes,
  cancelTOTPSetup,
  verifyTOTP,
  handleCopyRecoveryCodes,
  handleDownloadRecoveryCodes,
  confirmRecoveryCodesAndFinish,
  cancelRecoveryCodesModal,
  handleCopyRecoveryCodesStandalone,
  handleDownloadRecoveryCodesStandalone,
  confirmAndSaveRecoveryCodes,
} = useMfa();
</script>
