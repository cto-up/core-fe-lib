<template>
  <div
    class="min-h-screen flex items-center justify-center bg-background/50 py-12 px-4 sm:px-6 lg:px-8"
  >
    <AppBackground />
    <div class="relative z-10 max-w-md w-full space-y-8">
      <div>
        <h2 class="mt-6 text-center text-3xl font-extrabold text-foreground">
          {{ t("auth.recovery.title") }}
        </h2>
        <p class="mt-2 text-center text-sm text-muted-foreground">
          {{ statusMessage }}
        </p>
      </div>

      <div v-if="error" class="rounded-md bg-red-50 dark:bg-red-900/20 p-4">
        <div class="flex">
          <div class="ml-3">
            <h3 class="text-sm font-medium text-red-800 dark:text-red-200">
              {{ error }}
            </h3>
            <p class="mt-2 text-sm text-red-700 dark:text-red-300">
              {{ t("auth.recovery.requestNewLink") }}
            </p>
          </div>
        </div>
      </div>

      <div
        v-if="success"
        class="rounded-md bg-green-50 dark:bg-green-900/20 p-4"
      >
        <div class="flex">
          <div class="ml-3">
            <h3 class="text-sm font-medium text-green-800 dark:text-green-200">
              {{ t("auth.recovery.passwordSetSuccess") }}
            </h3>
          </div>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="loading && !showPasswordForm" class="text-center">
        <div
          class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"
        />
        <p class="mt-2 text-muted-foreground">
          {{ statusMessage }}
        </p>
      </div>

      <!-- Password Form -->
      <form
        v-if="showPasswordForm && !success"
        class="mt-8 space-y-6"
        @submit.prevent="handlePasswordSubmit"
      >
        <div class="rounded-md shadow-sm space-y-4">
          <PasswordInput
            id="password"
            v-model="password"
            :label="t('auth.recovery.newPasswordLabel')"
            :placeholder="t('auth.recovery.newPasswordPlaceholder')"
            :error="passwordError"
            required
            @input="passwordError = ''"
          />
          <PasswordInput
            id="confirm-password"
            v-model="confirmPassword"
            :label="t('auth.recovery.confirmPasswordLabel')"
            :placeholder="t('auth.recovery.confirmPasswordPlaceholder')"
            :error="mismatchError"
            required
          />
        </div>
        <div
          v-if="passwordError"
          class="text-sm text-red-600 dark:text-red-400"
        >
          {{ passwordError }}
        </div>

        <div>
          <Button
            type="submit"
            :disabled="
              submitting || !password || !confirmPassword || !passwordsMatch
            "
            class="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {{
              submitting
                ? t("auth.recovery.settingPassword")
                : t("auth.recovery.setPasswordButton")
            }}
          </Button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useI18n } from "vue-i18n";
import {
  extractKratosError,
  extractValidationErrors,
  getUserFriendlyMessage,
  KratosErrorIds,
  useKratosAuth,
  useAal2Store,
} from "../../authentication/vue";
import { kratosService } from "../../authentication/core/kratos-service";
import { Button } from "../ui/button";
import PasswordInput from "../primitives/PasswordInput.vue";
import AppBackground from "../primitives/AppBackground.vue";

const props = withDefaults(
  defineProps<{
    homePath?: string;
  }>(),
  { homePath: "/" }
);

const route = useRoute();
const router = useRouter();
const { t } = useI18n();
const { getCurrentSession } = useKratosAuth();
const aal2Store = useAal2Store();

const loading = ref(true);
const statusMessage = ref(t("auth.recovery.activatingLink"));
const error = ref("");
const success = ref(false);
const showPasswordForm = ref(false);
const submitting = ref(false);

const password = ref("");
const confirmPassword = ref("");

const mismatchError = computed(() => {
  return confirmPassword.value &&
    password.value &&
    password.value != confirmPassword.value
    ? t("auth.recovery.mismatchedPasswords")
    : "";
});

const passwordsMatch = computed(() => {
  if (!confirmPassword.value) return true;
  return password.value === confirmPassword.value;
});

const passwordError = ref("");

const settingsFlowId = ref("");
const csrfToken = ref("");

onMounted(async () => {
  const flowId = route.query.flow as string;
  const token = route.query.token as string;
  const returnTo = route.query.return_to as string | undefined;

  console.log("🎬 RecoveryPage mounted:", {
    flowId,
    token: token?.substring(0, 10) + "...",
    currentUrl: globalThis.location.href,
    origin: globalThis.location.origin,
  });

  if (!flowId) {
    error.value = t("auth.recovery.invalidLink");
    loading.value = false;
    return;
  }

  try {
    // If a token is present, we need to submit it to activate the recovery flow.
    // Kratos will 303-redirect back to this page with a new flow ID and no token,
    // at which point the session is established and we can init settings.
    if (token) {
      statusMessage.value = t("auth.recovery.activatingLink");
      try {
        await kratosService.submitRecoveryFlow(flowId, {
          method: "link",
          token,
        });
      } catch (err) {
        const kratosError = extractKratosError(err);
        // Session already exists — the recovery link was already used but the session
        // is still valid, so we can proceed directly to the settings flow.
        if (kratosError?.id !== KratosErrorIds.SESSION_ALREADY_AVAILABLE) {
          throw err;
        }
        console.log("ℹ️  Session already active, proceeding to settings.");
      }

      // When a return_to destination is present (invitation flow), skip the
      // password-setting step and redirect directly. The user is now authenticated.
      if (returnTo) {
        await getCurrentSession();
        void router.push(returnTo);
        return;
      }
    }

    const flow = await kratosService.initSettingsFlow().catch(async (err) => {
      const kratosError = extractKratosError(err);
      if (kratosError?.id !== KratosErrorIds.SESSION_AAL2_REQUIRED) throw err;

      // Settings requires AAL2 — prompt the user to verify MFA, then retry
      console.log(
        "🔐 AAL2 required for settings flow, prompting verification..."
      );
      const verified = await aal2Store.triggerVerification();
      if (!verified) throw err; // user cancelled

      return kratosService.initSettingsFlow();
    });

    settingsFlowId.value = flow.id;
    console.log("✅ Settings flow created:", settingsFlowId.value);
    const csrfNode = flow.ui?.nodes?.find(
      (node) => node.attributes?.name === "csrf_token"
    );
    if (csrfNode) {
      csrfToken.value = csrfNode.attributes.value as string;
    }

    if (!csrfToken.value) {
      error.value = t("auth.recovery.csrfTokenError");
      loading.value = false;
      return;
    }

    statusMessage.value = t("auth.recovery.pleaseSetPassword");
    showPasswordForm.value = true;
    loading.value = false;
  } catch (err) {
    console.error("❌ Recovery process failed:", err);
    const kratosError = extractKratosError(err);
    console.error("Error details:", {
      status: kratosError?.code,
      data: kratosError,
    });

    if (kratosError?.code === 403) {
      error.value = t("auth.recovery.sessionExpired");
    } else {
      error.value =
        getUserFriendlyMessage(err) ||
        (err instanceof Error ? err.message : null) ||
        t("auth.recovery.processingError");
    }
    loading.value = false;
  }
});

const handlePasswordSubmit = async () => {
  passwordError.value = "";

  if (password.value !== confirmPassword.value) {
    passwordError.value = t("auth.recovery.passwordsDoNotMatch");
    return;
  }

  if (password.value.length < 8) {
    passwordError.value = t("auth.recovery.passwordTooShort");
    return;
  }

  submitting.value = true;

  try {
    const response = await kratosService.setPasswordAfterRecovery(
      settingsFlowId.value,
      password.value,
      csrfToken.value
    );

    console.log("✅ Password set successfully:", response);

    success.value = true;

    await getCurrentSession();
    console.log("✅ User session refreshed");

    setTimeout(() => {
      void (async () => {
        try {
          await router.push(props.homePath);
        } catch (e) {
          console.log(e);
        }
      })();
    }, 2000);
  } catch (err) {
    console.error("❌ Password set failed:", err);

    const validationErrors = extractValidationErrors(err);
    const passwordErrors = validationErrors.find((e) => e.field === "password");

    if (passwordErrors?.messages.length) {
      passwordError.value = passwordErrors.messages
        .map((m) => m.text)
        .join(". ");
      return;
    }

    passwordError.value =
      getUserFriendlyMessage(err) || t("auth.recovery.failedToSetPassword");
  } finally {
    submitting.value = false;
  }
};
</script>
