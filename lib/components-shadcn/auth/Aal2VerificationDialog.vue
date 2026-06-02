<!--
  AAL2 verification dialog MUST stack ABOVE any other modal — app-
  specific dialogs (secret create, circle edit, …) sit at z-50; if
  they're open when an HTTP call triggers AAL2, a z-50 AAL2 gets
  hidden behind their focus trap. We use raw radix-vue primitives
  here (not the shadcn Dialog wrapper) to apply z-[100] explicitly
  on both overlay and content — keeping shadcn styling classes for
  consistency.
-->
<template>
  <DialogRoot :open="aal2State.show" @update:open="handleClose">
    <DialogPortal>
      <DialogOverlay
        class="fixed inset-0 z-[100] bg-black/80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0"
      />
      <DialogContent
        class="fixed left-1/2 top-1/2 z-[100] grid w-full sm:max-w-md -translate-x-1/2 -translate-y-1/2 gap-4 border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 sm:rounded-lg"
        @pointer-down-outside="preventClose"
      >
        <DialogHeader>
          <DialogTitle>{{ t("mfa.aal2.title") }}</DialogTitle>
          <DialogDescription>
            {{ t("mfa.aal2.description") }}
          </DialogDescription>
        </DialogHeader>

        <!-- Session refresh required — standalone, no verify footer -->
        <template v-if="aal2State.sessionRefreshRequired">
          <div
            class="flex items-start gap-3 p-4 rounded-md bg-destructive/10 border border-destructive/30"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-5 w-5 mt-0.5 shrink-0 text-destructive"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M12 15v2m0-6v2m-6 4a9 9 0 1118 0 9 9 0 01-18 0z"
              />
            </svg>
            <p class="text-sm text-destructive">
              {{ t("mfa.aal2.sessionRefreshRequired") }}
            </p>
          </div>
          <DialogFooter class="flex-col sm:flex-row gap-2 pt-2">
            <Button variant="outline" @click="cancelAal2Verification">
              {{ t("actions.cancel") }}
            </Button>
            <Button @click="handleSessionRefreshLogout">
              {{ t("mfa.aal2.logout") }}
            </Button>
          </DialogFooter>
        </template>

        <!-- No MFA registered — standalone, no verify footer -->
        <template v-else-if="aal2State.noMfaRegistered">
          <div
            class="flex items-start gap-3 p-4 rounded-md bg-warning/10 border border-warning/30 text-warning-foreground"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-5 w-5 mt-0.5 shrink-0 text-yellow-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
              />
            </svg>
            <p class="text-sm text-yellow-700 dark:text-yellow-400">
              {{ t("mfa.aal2.noMfaRegistered") }}
            </p>
          </div>
          <DialogFooter class="flex-col sm:flex-row gap-2 pt-2">
            <Button variant="outline" @click="cancelAal2Verification">
              {{ t("actions.cancel") }}
            </Button>
            <Button @click="goToSecuritySettings">
              {{ t("mfa.aal2.goToSecuritySettings") }}
            </Button>
          </DialogFooter>
        </template>

        <!-- Normal MFA verification flow -->
        <template v-else>
          <div class="space-y-4 py-4">
            <!-- Method Selection Tabs (if multiple methods available) -->
            <div
              v-if="aal2State.availableMethods.length > 1"
              class="flex gap-2 p-1 bg-muted rounded-lg"
            >
              <button
                v-if="aal2State.availableMethods.includes('totp')"
                type="button"
                class="flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors"
                :class="
                  aal2State.selectedMethod === 'totp'
                    ? 'bg-background shadow-sm'
                    : 'hover:bg-background/50'
                "
                :disabled="aal2State.loading"
                @click="switchToMethod('totp')"
              >
                {{ t("mfa.methods.authenticator") }}
              </button>
              <button
                v-if="aal2State.availableMethods.includes('webauthn')"
                type="button"
                class="flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors"
                :class="
                  aal2State.selectedMethod === 'webauthn'
                    ? 'bg-background shadow-sm'
                    : 'hover:bg-background/50'
                "
                :disabled="aal2State.loading"
                @click="switchToMethod('webauthn')"
              >
                {{ t("mfa.methods.securityKey") }}
              </button>
              <button
                v-if="aal2State.availableMethods.includes('lookup_secret')"
                type="button"
                class="flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors"
                :class="
                  aal2State.selectedMethod === 'lookup_secret'
                    ? 'bg-background shadow-sm'
                    : 'hover:bg-background/50'
                "
                :disabled="aal2State.loading"
                @click="switchToMethod('lookup_secret')"
              >
                {{ t("mfa.methods.recoveryCode") }}
              </button>
            </div>

            <!-- TOTP Input -->
            <div v-if="aal2State.selectedMethod === 'totp'" class="space-y-2">
              <Label for="totp-code">{{ t("mfa.setup.totp.enterCode") }}</Label>
              <Input
                id="totp-code"
                v-model="aal2State.totpCode"
                type="text"
                inputmode="numeric"
                pattern="[0-9]*"
                maxlength="6"
                placeholder="000000"
                class="text-center text-2xl tracking-widest"
                :disabled="aal2State.loading"
                @input="validateTotpInput"
                @keyup.enter="submitTotpVerification"
              />
              <p class="text-xs text-muted-foreground text-center">
                {{ t("mfa.aal2.totpHint") }}
              </p>
            </div>

            <!-- WebAuthn -->
            <div
              v-else-if="aal2State.selectedMethod === 'webauthn'"
              class="text-center py-6"
            >
              <div
                class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  class="h-8 w-8 text-primary"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
                  />
                </svg>
              </div>
              <p class="text-sm text-muted-foreground">
                {{ t("mfa.aal2.webauthnHint") }}
              </p>
            </div>

            <!-- Lookup Secret Input -->
            <div
              v-else-if="aal2State.selectedMethod === 'lookup_secret'"
              class="space-y-2"
            >
              <Label for="lookup-code">
                {{ t("mfa.recovery.enterCode") }}
              </Label>
              <Input
                id="lookup-code"
                v-model="aal2State.lookupCode"
                type="text"
                maxlength="12"
                placeholder="xxxx-xxxx-xxxx"
                class="text-center text-lg tracking-wider"
                :disabled="aal2State.loading"
                @input="validateLookupInput"
                @keyup.enter="submitLookupVerification"
              />
              <p class="text-xs text-muted-foreground text-center">
                {{ t("mfa.aal2.recoveryHint") }}
              </p>
            </div>

            <!-- Error Message -->
            <div
              v-if="aal2State.error"
              class="text-sm text-destructive text-center p-2 bg-destructive/10 rounded-md"
            >
              {{ aal2State.error }}
            </div>
          </div>

          <DialogFooter class="flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              :disabled="aal2State.loading"
              @click="cancelAal2Verification"
            >
              {{ t("actions.cancel") }}
            </Button>
            <Button
              :disabled="!canVerify || aal2State.loading"
              @click="handleVerify"
            >
              <span v-if="aal2State.loading">{{ t("actions.verifying") }}</span>
              <span v-else>{{ t("actions.verify") }}</span>
            </Button>
          </DialogFooter>
        </template>
      </DialogContent>
    </DialogPortal>
  </DialogRoot>
</template>

<script lang="ts" setup>
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import {
  useAal2,
  submitWebAuthnVerification,
  useKratosAuth,
} from "../../authentication/vue";
// Raw radix-vue primitives so we can enforce z-[100] on overlay +
// content (shadcn's DialogContent hardcodes z-50, which loses to a
// peer z-50 dialog trapping focus). Header/Footer keep the shadcn
// shell — they're just typography, no z-index concerns.
import {
  DialogRoot,
  DialogPortal,
  DialogOverlay,
  DialogContent,
} from "radix-vue";
import {
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { useRoute, useRouter, type RouteLocationRaw } from "vue-router";

const props = withDefaults(
  defineProps<{
    /** Route to push when the user clicks "enroll a method" / "go to security settings". */
    securityRoute?: RouteLocationRaw;
    /**
     * How the WebAuthn ceremony is performed.
     * - "redirect" (default): full-page navigate to the auth subdomain and back.
     * - "popup": run the ceremony in a popup that reports back via postMessage,
     *   keeping the current page (and any in-progress form state) mounted.
     */
    webauthnMode?: "redirect" | "popup";
  }>(),
  {
    securityRoute: () => ({ name: "security-settings" }),
    webauthnMode: "redirect",
  }
);

const { t } = useI18n();

const router = useRouter();

const route = useRoute();

const { signMeOut } = useKratosAuth();

const {
  aal2State,
  submitTotpVerification,
  submitWebAuthnPopupVerification,
  submitLookupVerification,
  validateTotpInput,
  validateLookupInput,
  cancelAal2Verification,
  switchToMethod,
} = useAal2();

const canVerify = computed(() => {
  if (aal2State.selectedMethod === "totp") {
    return aal2State.totpCode.length === 6;
  }
  if (aal2State.selectedMethod === "lookup_secret") {
    return aal2State.lookupCode.length > 0;
  }
  if (aal2State.selectedMethod === "webauthn") {
    return true; // WebAuthn is always ready
  }
  return false;
});

function handleVerify() {
  if (aal2State.selectedMethod === "totp") {
    submitTotpVerification();
  } else if (aal2State.selectedMethod === "lookup_secret") {
    submitLookupVerification();
  } else if (aal2State.selectedMethod === "webauthn") {
    if (props.webauthnMode === "popup") {
      submitWebAuthnPopupVerification();
    } else {
      submitWebAuthnVerification();
    }
  }
}

function handleClose(open: boolean) {
  if (!open && !aal2State.loading) {
    cancelAal2Verification();
  }
}

function preventClose(event: Event) {
  // Prevent closing by clicking outside during loading
  if (aal2State.loading) {
    event.preventDefault();
  }
}
async function goToSecuritySettings() {
  cancelAal2Verification();
  await router.push(props.securityRoute);
}
async function handleSessionRefreshLogout() {
  cancelAal2Verification();
  const returnTo = (route.query.return_to as string) ?? route.fullPath;
  await signMeOut({ from: returnTo });
}
</script>
