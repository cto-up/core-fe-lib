<template>
  <main
    class="h-screen w-screen flex items-center justify-center bg-background/50"
  >
    <AppBackground />
    <!-- Success State - Universal Response -->
    <Card
      v-if="emailSent"
      class="relative z-10 w-full max-w-md backdrop-blur-sm bg-card/80"
    >
      <CardHeader class="text-center">
        <div class="flex justify-center mb-4">
          <div class="rounded-full bg-success/15 p-3">
            <Mail class="h-8 w-8 text-success" />
          </div>
        </div>
        <CardTitle class="text-2xl font-bold">
          {{ $t("auth.signUp.checkEmail") }}
        </CardTitle>
        <CardDescription>
          {{ $t("auth.signUp.universalMessage") }}
        </CardDescription>
      </CardHeader>
      <CardContent class="space-y-4">
        <div class="text-center">
          <p class="text-sm text-muted-foreground mb-2">
            {{ $t("auth.signUp.emailSentTo") }}
          </p>
          <p class="font-medium text-foreground">
            {{ email }}
          </p>
        </div>
        <div class="bg-info/10 border border-info/30 rounded-md p-4 text-sm">
          <p class="font-medium text-foreground mb-2">
            {{ $t("auth.signUp.nextSteps") }}
          </p>
          <ol class="list-decimal list-inside space-y-1 text-foreground">
            <li>{{ $t("auth.signUp.step1") }}</li>
            <li>{{ $t("auth.signUp.step2") }}</li>
            <li>{{ $t("auth.signUp.step3") }}</li>
          </ol>
        </div>
        <p class="text-center text-sm text-muted-foreground">
          {{ $t("auth.signUp.spamHint") }}
        </p>
      </CardContent>
      <CardFooter class="flex flex-col space-y-3 p-4">
        <Button variant="outline" class="w-full" @click="resetForm">
          {{ $t("auth.signUp.changeEmail") }}
        </Button>
        <div class="text-center text-sm text-muted-foreground">
          <RouterLink :to="signinPath" class="text-primary hover:underline">
            {{ $t("auth.signUp.backToSignIn") }}
          </RouterLink>
        </div>
      </CardFooter>
    </Card>

    <!-- Email Input Form -->
    <Card
      v-else-if="canSignUp"
      class="relative z-10 w-full max-w-md backdrop-blur-sm bg-card/80"
    >
      <CardHeader class="text-center">
        <CardTitle class="text-2xl font-bold">
          {{ $t("auth.signUp.title") }}
        </CardTitle>
        <CardDescription>
          {{ $t("auth.signUp.subtitle") }}
        </CardDescription>
      </CardHeader>

      <CardContent class="space-y-4">
        <!-- Above the email field on purpose. The form below is a magic-link
             round trip — leave the app, find the mail, come back — where this
             is a few seconds. Put first, it is the highest-value control on
             the page; put below, people start typing before they see it.
             Same control and same wording as the sign-in page: the provider
             flow signs up and signs in with one click, so labelling it
             "Sign up with Google" here would promise a distinction that does
             not exist. -->
        <template v-if="oidcProviders.length">
          <Button
            v-for="provider in oidcProviders"
            :key="provider.value"
            variant="outline"
            size="lg"
            class="w-full"
            :disabled="loading || socialPending !== ''"
            @click="handleProviderSignUp(provider.value)"
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
          <div class="relative py-1">
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

        <div class="space-y-2">
          <Label for="email">{{ $t("auth.signUp.emailLabel") }}</Label>
          <div class="relative">
            <Mail class="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              id="email"
              v-model="email"
              type="email"
              class="pl-10"
              :class="{ 'border-destructive': $v.email.$error }"
              :disabled="loading"
              placeholder="you@example.com"
              autofocus
              @blur="$v.email.$touch()"
              @keydown.enter="handleSubmit"
            />
          </div>
          <p v-if="$v.email.$error" class="text-sm text-destructive">
            {{ $t("auth.signUp.emailInvalid") }}
          </p>
        </div>

        <div
          class="bg-muted/50 border rounded-md p-3 text-sm text-muted-foreground"
        >
          <p>{{ $t("auth.signUp.secureExplainer") }}</p>
        </div>
      </CardContent>

      <CardFooter class="flex flex-col space-y-4">
        <Button
          class="w-full"
          size="lg"
          :disabled="loading"
          @click="handleSubmit"
        >
          <Loader2 v-if="loading" class="mr-2 h-4 w-4 animate-spin" />
          {{ $t("auth.signUp.continueButton") }}
        </Button>

        <div class="text-center text-sm text-muted-foreground">
          {{ $t("auth.signUp.haveAccount") }}
          <RouterLink :to="signinPath" class="text-primary hover:underline">
            {{ $t("auth.signUp.signInLink") }}
          </RouterLink>
        </div>
      </CardFooter>
    </Card>

    <!-- Signup Disabled -->
    <Card
      v-else
      class="relative z-10 w-full max-w-md backdrop-blur-sm bg-card/80"
    >
      <CardHeader class="text-center">
        <CardTitle class="text-2xl font-bold">
          {{ $t("auth.signUp.title") }}
        </CardTitle>
        <CardDescription>
          {{ $t("auth.signUp.disabled") }}
        </CardDescription>
      </CardHeader>
    </Card>
  </main>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import { useRoute } from "vue-router";
import { useToast } from "../ui/toast/use-toast";
import { AuthService } from "../../openapi/core";
import {
  required,
  email as emailVerif,
  maxLength,
} from "@vuelidate/validators";
import useVuelidate from "@vuelidate/core";
import {
  getUserFriendlyMessage,
  useTenant,
  useKratosAuth,
} from "../../authentication/vue";
import {
  getOidcProviders,
  kratosService,
  type KratosOidcProvider,
} from "../../authentication/core/kratos-service";
import { useI18n } from "vue-i18n";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { KeyRound, Mail, Loader2 } from "lucide-vue-next";
import { RouterLink } from "vue-router";
import AppBackground from "../primitives/AppBackground.vue";
import GoogleMark from "../primitives/GoogleMark.vue";

const props = withDefaults(
  defineProps<{
    signinPath?: string;
    /**
     * Where a social sign-up returns to. Same contract as SigninPage's prop of
     * the same name — multi-tenant consumers point it at the page that attaches
     * the new identity to this host's tenant.
     */
    socialReturnPath?: string;
    /** See SigninPage's prop of the same name. */
    socialPrompt?: string;
  }>(),
  {
    signinPath: "/signin",
    socialReturnPath: "/",
    socialPrompt: "select_account",
  }
);

const { t, te } = useI18n();
const tOr = (key: string, fallback: string): string =>
  te(key) ? t(key) : fallback;
const continueWithLabel = (provider: string): string =>
  te("auth.signIn.continueWith")
    ? t("auth.signIn.continueWith", { provider })
    : `Continue with ${provider}`;
const { toast } = useToast();
const { canSignUp, socialSignInEnabled } = useTenant();

const email = ref("");
const loading = ref(false);
const emailSent = ref(false);

const route = useRoute();
const { signInWithProvider } = useKratosAuth();
const oidcProviders = ref<KratosOidcProvider[]>([]);
const socialPending = ref("");

// Signing up with a provider goes through the LOGIN flow, not the registration
// flow: Kratos escalates an unknown subject into a registration by itself, and
// with the mapper supplying every required trait it completes without a form.
// One code path for both pages, and one less flow to keep configured.
async function loadOidcProviders(): Promise<void> {
  // Per-tenant kill switch, checked before the probe so a tenant that turned
  // social sign-in off pays no round trip.
  if (!canSignUp.value || !socialSignInEnabled.value) {
    oidcProviders.value = [];
    return;
  }
  try {
    const flow = await kratosService.initLoginFlow(false);
    oidcProviders.value = getOidcProviders(flow);
  } catch {
    // Additive: the email form must still work if the probe fails.
    oidcProviders.value = [];
  }
}

onMounted(loadOidcProviders);

// The public tenant payload is fetched asynchronously at startup, so a cold
// load can mount before it lands. Re-probe once it does.
watch(socialSignInEnabled, (enabled) => {
  if (enabled && !oidcProviders.value.length) void loadOidcProviders();
});

async function handleProviderSignUp(provider: string): Promise<void> {
  socialPending.value = provider;
  const from = typeof route.query.from === "string" ? route.query.from : "";
  const returnTo = new URL(props.socialReturnPath, globalThis.location.origin);
  if (from.startsWith("/") && !from.startsWith("//")) {
    returnTo.searchParams.set("from", from);
  }
  try {
    await signInWithProvider(provider, {
      returnTo: returnTo.toString(),
      prompt: props.socialPrompt || undefined,
    });
  } catch {
    socialPending.value = "";
  }
}

const rules = computed(() => ({
  email: { required, emailVerif, $autoDirty: true, maxLength: maxLength(100) },
}));

const $v = useVuelidate(rules, { email });

const handleSubmit = async () => {
  const isFormCorrect = await $v.value.$validate();
  if (!isFormCorrect) {
    toast({
      title: t("auth.signUp.notifications.validationError"),
      variant: "destructive",
    });
    return;
  }

  loading.value = true;

  try {
    // Call identify endpoint - backend handles everything
    await AuthService.identifyUser({
      email: email.value,
    });

    // Always show success - never reveal if user exists
    emailSent.value = true;
  } catch (error) {
    console.error("Identify error:", error);

    // Even on error, show generic message for security
    // Only show error if it's a validation/network issue
    const errMessage =
      getUserFriendlyMessage(error) || t("auth.signUp.notifications.error");

    toast({
      variant: "destructive",
      title: t("auth.error"),
      description: errMessage,
    });
  } finally {
    loading.value = false;
  }
};

const resetForm = () => {
  emailSent.value = false;
  email.value = "";
  $v.value.$reset();
};
</script>
