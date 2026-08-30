<template>
  <div
    class="min-h-screen flex items-center justify-center bg-background/50 p-4"
  >
    <AppBackground />
    <Card class="relative z-10 w-full max-w-md backdrop-blur-sm bg-card/80">
      <CardHeader>
        <CardTitle>{{ t("mfa.setup.webauthn.title") }}</CardTitle>
        <CardDescription>
          {{ t("mfa.setup.webauthn.description") }}
        </CardDescription>
      </CardHeader>
      <CardContent class="space-y-4">
        <div v-if="state.loading" class="text-center py-6">
          <div
            class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-8 w-8 text-primary animate-pulse"
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
            {{ t("mfa.setup.webauthn.processing") }}
          </p>
        </div>
        <div v-else-if="state.error" class="text-center py-6">
          <div
            class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-error/10 mb-4"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-8 w-8 text-error"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <p class="text-sm text-error mb-4">
            {{ state.error }}
          </p>
          <Button variant="outline" @click="cancel">
            {{ t("actions.cancel") }}
          </Button>
        </div>
        <div v-else-if="state.success" class="text-center py-6">
          <div
            class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-success/15 mb-4"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-8 w-8 text-success"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <p class="text-sm text-muted-foreground">
            {{ t("mfa.setup.webauthn.success") }}
          </p>
        </div>
        <div v-else class="text-center py-6">
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
          <p class="text-sm text-muted-foreground mb-4">
            {{ state.notice || t("mfa.setup.webauthn.ready") }}
          </p>
          <div class="flex flex-col items-center gap-2">
            <Button @click="runCeremony()">
              {{ t("mfa.setup.webauthn.start") }}
            </Button>
            <Button variant="ghost" size="sm" @click="cancel">
              {{ t("actions.cancel") }}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  </div>
</template>

<script lang="ts" setup>
import { onMounted, reactive } from "vue";
import { useI18n } from "vue-i18n";
import { useRoute } from "vue-router";
import { getUserFriendlyMessage } from "../../authentication";
import { useMfa } from "../../authentication/vue";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Button } from "../ui/button";
import AppBackground from "../primitives/AppBackground.vue";

const { t } = useI18n();
const route = useRoute();
const { prepareWebAuthnRegistration, completeWebAuthnRegistration } = useMfa();

const state = reactive({
  loading: true,
  error: "",
  notice: "",
  success: false,
});

let prepared: Awaited<ReturnType<typeof prepareWebAuthnRegistration>> | null =
  null;

onMounted(async () => {
  try {
    prepared = await prepareWebAuthnRegistration();
  } catch (error: unknown) {
    console.error("WebAuthn registration failed:", error);
    state.error = describeError(error);
    state.loading = false;
    return;
  }
  // WebKit rejects credentials.create() outside a user gesture, which this
  // page does not have on load. Try once for engines that allow it, and fall
  // back to the explicit button below.
  await runCeremony(true);
});

async function runCeremony(auto = false) {
  if (!prepared) return;

  state.loading = true;
  state.error = "";
  state.notice = "";

  try {
    // Must remain the first await in this function: on WebKit the transient
    // user activation from the click is gone once anything else is awaited.
    await completeWebAuthnRegistration(prepared);

    state.success = true;

    const returnTo = route.query.return_to as string;
    setTimeout(() => {
      globalThis.location.href = returnTo || "/";
    }, 1500);
  } catch (error: unknown) {
    // NotAllowedError covers both "no user activation" (WebKit, on the
    // automatic attempt) and a prompt the user dismissed. Both recover the
    // same way: fall back to letting the user start the ceremony themselves.
    if (error instanceof DOMException && error.name === "NotAllowedError") {
      state.notice = auto ? "" : t("mfa.setup.webauthn.cancelled");
      return;
    }
    console.error("WebAuthn registration failed:", error);
    state.error = describeError(error);
  } finally {
    state.loading = false;
  }
}

function describeError(error: unknown): string {
  if (error instanceof DOMException) {
    if (error.name === "NotAllowedError") {
      return "Security key registration was cancelled or timed out";
    }
    if (error.name === "NotSupportedError") {
      return "WebAuthn is not supported by your browser";
    }
  }
  return (
    getUserFriendlyMessage(error) ||
    (error instanceof Error ? error.message : "WebAuthn registration failed")
  );
}

function cancel() {
  const returnTo = route.query.return_to as string;
  if (returnTo) {
    globalThis.location.href = returnTo;
  } else {
    globalThis.location.href = "/";
  }
}
</script>
