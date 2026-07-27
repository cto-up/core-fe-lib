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

    <Card v-else class="relative z-10 w-full max-w-sm backdrop-blur-sm bg-card/80">
      <CardHeader class="space-y-1 text-center">
        <CardTitle class="text-2xl font-bold">
          {{ $t("auth.signIn.title") }}
        </CardTitle>
        <CardDescription class="text-sm text-muted-foreground">
          {{ $t("auth.signIn.subtitle") }}
        </CardDescription>
      </CardHeader>
      <CardContent class="grid gap-4">
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
import { computed, onMounted, ref } from "vue";
import { useI18n } from "vue-i18n";
import { useRoute, useRouter } from "vue-router";
import { useVuelidate } from "@vuelidate/core";
import { required, email as emailRule } from "@vuelidate/validators";
import { useKratosAuth, useTenant } from "../../authentication/vue";
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
import { Loader2, Mail, UserRound } from "lucide-vue-next";
import PasswordInput from "../primitives/PasswordInput.vue";
import AppBackground from "../primitives/AppBackground.vue";

const props = withDefaults(
  defineProps<{
    recoveryPath?: string;
    signupPath?: string;
    /** Where "Continue" goes when there is no `?from=` on the URL. */
    continuePath?: string;
  }>(),
  {
    recoveryPath: "/user/me/password-reset-request",
    signupPath: "/signup",
    continuePath: "/",
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

const email = ref("");
const password = ref("");
const switching = ref(false);
const route = useRoute();
const router = useRouter();
const userStore = useUserStore();
const { canSignUp } = useTenant();
const { signMeIn, getCurrentSession, clearSession } = useKratosAuth();

const activeSession = computed(() =>
  userStore.session?.active ? userStore.session : null
);
const sessionEmail = computed(
  () => activeSession.value?.identity?.traits?.email ?? ""
);

// The host app's router guard normally redirects a signed-in visitor before we
// mount. This covers the cases it cannot: a consumer with no such guard, and a
// session that only becomes observable after the page has rendered.
onMounted(() => {
  if (!activeSession.value) void getCurrentSession();
});

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
    signMeIn(email.value, password.value);
  }
};
</script>
