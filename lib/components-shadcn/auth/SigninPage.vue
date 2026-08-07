<template>
  <main
    class="h-screen w-screen flex items-center justify-center bg-background/50"
  >
    <AppBackground />

    <!-- A live session makes the form unusable: Kratos rejects a new login flow
         with `session_already_available`. Offer the two real choices instead. -->
    <Card
      v-if="activeSession"
      class="relative z-10 w-full max-w-sm backdrop-blur-sm bg-card/80"
    >
      <CardHeader class="space-y-1 text-center">
        <CardTitle class="text-2xl font-bold">
          {{ tf("title", "You're already signed in") }}
        </CardTitle>
        <CardDescription class="text-sm text-muted-foreground">
          {{ tf("subtitle", "This browser already has an active session.") }}
        </CardDescription>
      </CardHeader>
      <CardContent class="grid gap-4">
        <div class="flex items-center gap-3 rounded-xl bg-muted/50 p-3">
          <UserRound class="h-5 w-5 shrink-0 text-muted-foreground" />
          <div class="min-w-0">
            <p class="text-xs text-muted-foreground/70">
              {{ tf("signedInAs", "Signed in as") }}
            </p>
            <p class="truncate text-sm font-medium">{{ sessionEmail }}</p>
          </div>
        </div>
        <Button class="w-full" :disabled="switching" @click="continueToApp">
          {{ tf("continueButton", "Continue") }}
        </Button>
      </CardContent>
      <CardFooter>
        <Button
          variant="outline"
          class="w-full"
          :disabled="switching"
          @click="useAnotherAccount"
        >
          <Loader2 v-if="switching" class="mr-2 h-4 w-4 animate-spin" />
          {{
            switching
              ? tf("switching", "Signing out...")
              : tf("switchButton", "Sign in as a different user")
          }}
        </Button>
      </CardFooter>
    </Card>

    <Card
      v-else
      class="relative z-10 w-full max-w-sm backdrop-blur-sm bg-card/80"
    >
      <CardHeader class="space-y-1 text-center">
        <CardTitle class="text-2xl font-bold">
          {{ $t("auth.signIn.title") }}
        </CardTitle>
        <CardDescription class="text-sm text-muted-foreground">
          {{ $t("auth.signIn.subtitle") }}
        </CardDescription>
      </CardHeader>
      <CardContent class="grid gap-4">
        <!-- Messages Kratos attached to a flow it redirected us to. This is how
             account linking speaks: "that email is already used by another
             account — sign in below to add Google as another way in". Dropping
             them leaves the user staring at a bare form after a failed social
             sign-in, with no idea why. -->
        <div
          v-for="message in flowMessages"
          :key="message.id"
          class="flex gap-2 rounded-md border p-3 text-sm"
          :class="
            message.type === 'error'
              ? 'border-destructive/40 bg-destructive/10 text-destructive'
              : 'border-primary/30 bg-primary/5 text-foreground'
          "
        >
          <Info class="mt-0.5 h-4 w-4 shrink-0" />
          <span>{{ message.text }}</span>
        </div>

        <!-- Social sign-in. Rendered from the login flow itself, so a provider
             that is not configured in kratos.yml simply produces no button. -->
        <template v-if="oidcProviders.length">
          <Button
            v-for="provider in oidcProviders"
            :key="provider.value"
            variant="outline"
            class="w-full"
            :disabled="socialPending !== ''"
            @click="handleProviderSignIn(provider.value)"
          >
            <Loader2
              v-if="socialPending === provider.value"
              class="mr-2 h-4 w-4 animate-spin"
            />
            <GoogleMark
              v-else-if="provider.value === 'google'"
              class="mr-2 h-4 w-4"
            />
            <KeyRound v-else class="mr-2 h-4 w-4" />
            {{ continueWithLabel(provider.label) }}
          </Button>
          <div class="relative">
            <div class="absolute inset-0 flex items-center">
              <span class="w-full border-t" />
            </div>
            <div class="relative flex justify-center text-xs uppercase">
              <span class="bg-card px-2 text-muted-foreground">
                {{ tOr("auth.signIn.orContinueWith", "or") }}
              </span>
            </div>
          </div>
        </template>

        <div class="grid gap-2">
          <Label for="email">{{ $t("auth.signIn.emailLabel") }}</Label>
          <div class="relative">
            <Mail
              class="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground"
            />
            <Input
              id="email"
              v-model="email"
              type="email"
              class="pl-9"
              @blur="v$.email.$touch()"
            />
          </div>
          <div v-if="v$.email.$errors.length" class="text-sm text-red-600">
            <span v-for="error of v$.email.$errors" :key="error.$uid">
              {{ error.$message }}
            </span>
          </div>
        </div>
        <div>
          <PasswordInput
            id="password"
            v-model="password"
            :label="$t('auth.signIn.passwordLabel')"
            placeholder="Your password"
            required
            @blur="v$.password.$touch()"
            @keydown.enter="handleSignIn"
          />
          <div
            v-if="v$.password.$errors.length"
            class="text-sm text-red-600 mt-1"
          >
            <span v-for="error of v$.password.$errors" :key="error.$uid">
              {{ error.$message }}
            </span>
          </div>
        </div>
        <Button class="w-full" :disabled="v$.$invalid" @click="handleSignIn">
          {{ $t("auth.signIn.loginButton") }}
        </Button>
      </CardContent>
      <CardFooter class="flex flex-col gap-4">
        <Button variant="link" class="text-xs text-muted-foreground" as-child>
          <router-link :to="recoveryPath">
            {{ $t("auth.signIn.forgotPassword") }}
          </router-link>
        </Button>
        <div v-if="canSignUp" class="text-sm text-center text-muted-foreground">
          {{ $t("auth.signIn.noAccount") }}
          <Button variant="link" class="p-0 h-auto font-normal" as-child>
            <router-link :to="signupPath">
              {{ $t("auth.signIn.signUpLink") }}
            </router-link>
          </Button>
        </div>
      </CardFooter>
    </Card>
  </main>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import { useRoute, useRouter } from "vue-router";
import { useVuelidate } from "@vuelidate/core";
import { required, email as emailRule } from "@vuelidate/validators";
import { useKratosAuth, useTenant } from "../../authentication/vue";
import {
  getOidcProviders,
  kratosService,
  KratosFlowType,
  type KratosFlow,
  type KratosOidcProvider,
} from "../../authentication/core/kratos-service";
import { useUserStore } from "core-fe-lib/stores/user-store";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
  CardDescription,
} from "../ui/card";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { Label } from "../ui/label";
import { Info, KeyRound, Loader2, Mail, UserRound } from "lucide-vue-next";
import PasswordInput from "../primitives/PasswordInput.vue";
import AppBackground from "../primitives/AppBackground.vue";
import GoogleMark from "../primitives/GoogleMark.vue";

const props = withDefaults(
  defineProps<{
    recoveryPath?: string;
    signupPath?: string;
    /** Where "Continue" goes when there is no `?from=` on the URL. */
    continuePath?: string;
    /**
     * In-app path the browser returns to after a social sign-in round-trip.
     *
     * Multi-tenant consumers point this at a page that attaches the freshly
     * created identity to the tenant of the current host — Kratos creates the
     * identity but knows nothing about tenants, so without that step the user
     * gets a session the API then rejects. Defaults to "/" for single-tenant
     * apps, where the identity already carries everything it needs.
     *
     * MUST be reachable at a `selfservice.allowed_return_urls` origin, or
     * Kratos silently falls back to its default return URL.
     */
    socialReturnPath?: string;
  }>(),
  {
    recoveryPath: "/user/me/password-reset-request",
    signupPath: "/signup",
    continuePath: "/",
    socialReturnPath: "/",
  }
);

// Consumer apps may ship their own `auth.*` dictionary rather than
// core-fe-lib's, in which case keys added here would render as raw key paths.
// Every new string therefore carries a literal fallback.
const { t, te } = useI18n();
const tf = (key: string, fallback: string): string => {
  const full = `auth.alreadySignedIn.${key}`;
  return te(full) ? t(full) : fallback;
};
/** Same guarantee as `tf`, for keys outside the `alreadySignedIn` group. */
const tOr = (key: string, fallback: string): string =>
  te(key) ? t(key) : fallback;
/** Kept separate from `tOr`: this one needs a runtime interpolation argument. */
const continueWithLabel = (provider: string): string =>
  te("auth.signIn.continueWith")
    ? t("auth.signIn.continueWith", { provider })
    : `Continue with ${provider}`;

const email = ref("");
const password = ref("");
const switching = ref(false);
const route = useRoute();
const router = useRouter();
const userStore = useUserStore();
const { canSignUp, socialSignInEnabled } = useTenant();
const { signMeIn, signInWithProvider, getCurrentSession, clearSession } =
  useKratosAuth();

const oidcProviders = ref<KratosOidcProvider[]>([]);
const socialPending = ref("");

// A flow Kratos redirected us to (`/auth/login?flow=…`) rather than one we
// minted. Held so both submit paths reuse it — see signMeIn's note on why
// replacing it silently breaks account linking.
const pendingFlow = ref<KratosFlow | null>(null);
const flowMessages = computed(() => pendingFlow.value?.ui?.messages ?? []);

const activeSession = computed(() =>
  userStore.session?.active ? userStore.session : null
);
const sessionEmail = computed(
  () => activeSession.value?.identity?.traits?.email ?? ""
);

// The host app's router guard normally redirects a signed-in visitor before we
// mount. This covers the cases it cannot: a consumer with no such guard, and a
// session that only becomes observable after the page has rendered.
onMounted(async () => {
  // Kratos sends the browser here with `?flow=` when it needs the UI to finish
  // something it started — account linking above all. Adopt that flow instead
  // of starting a fresh one.
  const flowId = typeof route.query.flow === "string" ? route.query.flow : "";
  if (flowId) {
    try {
      const flow = await kratosService.getFlow(KratosFlowType.Login, flowId);
      pendingFlow.value = flow;
      oidcProviders.value = socialSignInEnabled.value
        ? getOidcProviders(flow)
        : [];
      return;
    } catch {
      // Expired or already consumed — fall through and behave as a plain visit
      // rather than stranding the user on a dead form.
    }
  }

  if (!activeSession.value) {
    void getCurrentSession();
    void loadOidcProviders();
  }
});

// Re-probe if the tenant payload lands after mount and permits social sign-in.
// It is fetched asynchronously at startup, so on a cold load the first mount can
// see an empty tenant; without this the buttons would simply never appear.
watch(socialSignInEnabled, (enabled) => {
  if (enabled && !activeSession.value && !oidcProviders.value.length) {
    void loadOidcProviders();
  }
});

/**
 * Ask Kratos which social providers this deployment offers.
 *
 * Deliberately a throwaway flow: the flow the user eventually submits is minted
 * fresh at click time, because this one may well have expired by then. All we
 * want here is the list of buttons to draw — a deployment with no `oidc` method
 * configured returns no such nodes and the section disappears on its own.
 */
async function loadOidcProviders(): Promise<void> {
  // Per-tenant kill switch. Checked before the probe rather than in the
  // template so a tenant that turned social sign-in off pays no round trip.
  if (!socialSignInEnabled.value) {
    oidcProviders.value = [];
    return;
  }
  try {
    const flow = await kratosService.initLoginFlow(false);
    oidcProviders.value = getOidcProviders(flow);
  } catch {
    // Social sign-in is additive: if the probe fails (offline, an already-live
    // session, Kratos unhappy), the password form must still work.
    oidcProviders.value = [];
  }
}

async function handleProviderSignIn(provider: string): Promise<void> {
  socialPending.value = provider;
  const from = typeof route.query.from === "string" ? route.query.from : "";
  const returnTo = new URL(props.socialReturnPath, globalThis.location.origin);
  if (from.startsWith("/") && !from.startsWith("//")) {
    returnTo.searchParams.set("from", from);
  }
  try {
    await signInWithProvider(provider, returnTo.toString(), pendingFlow.value);
  } catch {
    socialPending.value = "";
  }
}

function continueToApp() {
  const from = typeof route.query.from === "string" ? route.query.from : "";
  // Only same-origin absolute paths — `//evil.com` is protocol-relative.
  const target =
    from.startsWith("/") && !from.startsWith("//") ? from : props.continuePath;
  void router.push(target);
}

async function useAnotherAccount() {
  switching.value = true;
  try {
    await clearSession();
  } finally {
    switching.value = false;
  }
}

const rules = {
  email: {
    required,
    emailRule,
  },
  password: {
    required,
  },
};

const v$ = useVuelidate(rules, { email, password });

const handleSignIn = async () => {
  const isFormCorrect = await v$.value.$validate();
  if (isFormCorrect) {
    signMeIn(email.value, password.value, pendingFlow.value);
  }
};
</script>
