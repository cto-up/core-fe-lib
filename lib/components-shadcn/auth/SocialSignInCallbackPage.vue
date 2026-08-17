<template>
  <main class="flex min-h-screen items-center justify-center p-6">
    <Card class="w-full max-w-sm">
      <CardHeader class="space-y-1 text-center">
        <CardTitle class="text-xl font-display">
          {{ heading }}
        </CardTitle>
        <CardDescription>{{ message }}</CardDescription>
      </CardHeader>
      <CardContent class="flex flex-col items-center gap-4">
        <Loader2 v-if="state === 'working'" class="h-6 w-6 animate-spin" />
        <Button v-else variant="outline" class="w-full" @click="backToSignIn">
          {{ tf("backToSignIn", "Back to sign-in") }}
        </Button>
      </CardContent>
    </Card>
  </main>
</template>

<script lang="ts" setup>
/**
 * Where a social sign-in round-trip lands (ADR 039).
 *
 * Kratos has already created the identity and issued the session by the time
 * the browser gets here. What it could not do is place that identity in a
 * tenant — it serves every tenant from one host and has no notion of them. So
 * this page makes the one call that does. The backend takes the tenant from the
 * request's `Origin`, which is this page's own host: the call itself goes to the
 * tenant-neutral api host, so `Origin` is the only part of it that names a
 * tenant. Then it hands over to the app.
 *
 * Skipping this step does not fail loudly: the session is real, so the SPA
 * looks signed in, and every API call 401s.
 */
import { onMounted, ref, computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useI18n } from "vue-i18n";
import { AuthService, ApiError } from "../../openapi/core";
import { kratosService, useKratosAuth } from "../../authentication/vue";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Button } from "../ui/button";
import { Loader2 } from "lucide-vue-next";

const { t, te } = useI18n();
// Consumer apps may ship their own `auth.*` dictionary, so every string carries
// a literal fallback rather than rendering a raw key path.
const tf = (key: string, fallback: string): string => {
  const full = `auth.socialCallback.${key}`;
  return te(full) ? t(full) : fallback;
};
const route = useRoute();
const router = useRouter();
const { getCurrentSession, clearSession } = useKratosAuth();

type State = "working" | "denied" | "failed";
const state = ref<State>("working");

const heading = computed(() =>
  state.value === "working"
    ? tf("working.title", "Finishing sign-in")
    : state.value === "denied"
      ? tf("denied.title", "This space is invite-only")
      : tf("failed.title", "We couldn't finish signing you in")
);
const message = computed(() =>
  state.value === "working"
    ? tf("working.body", "Setting up your account…")
    : state.value === "denied"
      ? tf(
          "denied.body",
          "Your account signed in, but this space doesn't accept self-service sign-ups. Ask an administrator for an invitation."
        )
      : tf(
          "failed.body",
          "Your account was created, but we couldn't connect it to this space. Please try again in a moment."
        )
);

function safeDestination(): string {
  const from = typeof route.query.from === "string" ? route.query.from : "";
  // Only same-origin absolute paths — `//evil.com` is protocol-relative.
  return from.startsWith("/") && !from.startsWith("//") ? from : "/";
}

async function backToSignIn() {
  await clearSession();
  void router.replace({ name: "signin" });
}

onMounted(async () => {
  try {
    await AuthService.completeSocialSignIn();
  } catch (error) {
    const status = error instanceof ApiError ? error.status : 0;
    // 403 is the tenant saying "no self-service signup here" — a decision, not
    // a fault. Anything else is ours, and leaving the user on a page that says
    // so beats bouncing them into an app that will 401 on every call.
    state.value = status === 403 ? "denied" : "failed";
    return;
  }

  // The membership was just written into the identity's metadata. The cached
  // session predates it, so force a fresh read before the router guard and the
  // API interceptor start reading roles off it.
  kratosService.invalidateSession();
  await getCurrentSession();

  void router.replace(safeDestination());
});
</script>
