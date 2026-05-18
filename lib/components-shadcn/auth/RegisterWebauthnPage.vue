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
            class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-destructive/10 mb-4"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-8 w-8 text-destructive"
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
          <p class="text-sm text-destructive mb-4">
            {{ state.error }}
          </p>
          <Button variant="outline" @click="cancel">
            {{ t("actions.cancel") }}
          </Button>
        </div>
        <div v-else-if="state.success" class="text-center py-6">
          <div
            class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-4"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-8 w-8 text-green-600"
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
          <p class="text-sm text-muted-foreground">
            {{ t("mfa.setup.webauthn.ready") }}
          </p>
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
const { performWebAuthnRegistration } = useMfa();

const state = reactive({
  loading: true,
  error: "",
  success: false,
});

onMounted(async () => {
  try {
    state.loading = true;
    state.error = "";

    await performWebAuthnRegistration();

    state.success = true;

    const returnTo = route.query.return_to as string;
    setTimeout(() => {
      if (returnTo) {
        globalThis.location.href = returnTo;
      } else {
        globalThis.location.href = "/";
      }
    }, 1500);
  } catch (error: unknown) {
    console.error("WebAuthn registration failed:", error);

    let errorMessage = "WebAuthn registration failed";
    if (error instanceof DOMException) {
      if (error.name === "NotAllowedError") {
        errorMessage = "Security key registration was cancelled or timed out";
      } else if (error.name === "NotSupportedError") {
        errorMessage = "WebAuthn is not supported by your browser";
      }
    } else {
      errorMessage =
        getUserFriendlyMessage(error) ||
        (error instanceof Error ? error.message : errorMessage);
    }

    state.error = errorMessage;
  } finally {
    state.loading = false;
  }
});

function cancel() {
  const returnTo = route.query.return_to as string;
  if (returnTo) {
    globalThis.location.href = returnTo;
  } else {
    globalThis.location.href = "/";
  }
}
</script>
