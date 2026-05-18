<template>
  <div
    class="flex min-h-screen items-center justify-center bg-background/50 p-5"
  >
    <AppBackground />
    <!-- Loading State -->
    <Card
      v-if="verificationState === 'loading'"
      class="relative z-10 w-full max-w-md animate-in fade-in slide-in-from-bottom-8 duration-600 ease-out backdrop-blur-sm bg-card/80"
    >
      <CardHeader class="text-center">
        <Loader2 class="mx-auto mb-4 h-12 w-12 animate-spin text-primary" />
        <CardTitle class="text-2xl font-bold">
          {{ $t("auth.emailVerification.loading.title") }}
        </CardTitle>
        <CardDescription class="text-muted-foreground">
          {{ $t("auth.emailVerification.loading.subtitle") }}
        </CardDescription>
      </CardHeader>
    </Card>

    <!-- Success State -->
    <Card
      v-else-if="verificationState === 'success'"
      class="relative z-10 w-full max-w-md animate-in fade-in slide-in-from-bottom-8 duration-600 ease-out backdrop-blur-sm bg-card/80"
    >
      <CardHeader class="text-center">
        <div
          class="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600"
        >
          <CheckCircle2 class="h-6 w-6" />
        </div>
        <CardTitle class="text-2xl font-bold">
          {{ $t("auth.emailVerification.success.title") }}
        </CardTitle>
        <CardDescription class="text-muted-foreground">
          {{ $t("auth.emailVerification.success.subtitle") }}
        </CardDescription>
      </CardHeader>
      <CardContent class="flex flex-col gap-3">
        <Button class="w-full" @click="goToDashboard">
          {{ $t("auth.emailVerification.success.continueButton") }}
        </Button>
        <Button variant="outline" class="w-full" @click="goToLogin">
          {{ $t("auth.emailVerification.success.signInButton") }}
        </Button>
      </CardContent>
    </Card>

    <!-- Error State -->
    <Card
      v-else-if="verificationState === 'error'"
      class="relative z-10 w-full max-w-md animate-in fade-in slide-in-from-bottom-8 duration-600 ease-out backdrop-blur-sm bg-card/80"
    >
      <CardHeader class="text-center">
        <div
          class="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-600"
        >
          <XCircle class="h-6 w-6" />
        </div>
        <CardTitle class="text-2xl font-bold">
          {{ $t("auth.emailVerification.error.title") }}
        </CardTitle>
        <CardDescription class="text-red-500">
          {{ errorMessage }}
        </CardDescription>
      </CardHeader>
      <CardContent class="flex flex-col gap-4">
        <div v-if="canResend" class="space-y-3 rounded-md bg-muted p-4">
          <p class="text-sm text-muted-foreground">
            {{ $t("auth.emailVerification.error.resendHelpText") }}
          </p>
          <Button
            :disabled="resendLoading || resendCooldown > 0"
            variant="outline"
            class="w-full"
            @click="resendVerification"
          >
            <span v-if="resendLoading">
              <Loader2 class="mr-2 h-4 w-4 animate-spin" />
              {{ $t("auth.emailVerification.error.resending") }}
            </span>
            <span v-else-if="resendCooldown > 0">
              {{
                $t("auth.emailVerification.error.resendCooldown", {
                  seconds: resendCooldown,
                })
              }}
            </span>
            <span v-else>{{
              $t("auth.emailVerification.error.resendButton")
            }}</span>
          </Button>
        </div>

        <div class="flex flex-col gap-3">
          <Button variant="outline" class="w-full" @click="goToLogin">
            {{ $t("auth.emailVerification.error.backToSignIn") }}
          </Button>
        </div>
      </CardContent>
    </Card>

    <!-- Expired State -->
    <Card
      v-else-if="verificationState === 'expired'"
      class="relative z-10 w-full max-w-md animate-in fade-in slide-in-from-bottom-8 duration-600 ease-out backdrop-blur-sm bg-card/80"
    >
      <CardHeader class="text-center">
        <div
          class="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 text-amber-600"
        >
          <AlertTriangle class="h-6 w-6" />
        </div>
        <CardTitle class="text-2xl font-bold">
          {{ $t("auth.emailVerification.expired.title") }}
        </CardTitle>
        <CardDescription class="text-muted-foreground">
          {{ $t("auth.emailVerification.expired.subtitle") }}
        </CardDescription>
      </CardHeader>
      <CardContent class="flex flex-col gap-3">
        <Button
          :disabled="resendLoading"
          class="w-full"
          @click="resendVerification"
        >
          <span v-if="resendLoading">
            <Loader2 class="mr-2 h-4 w-4 animate-spin" />
            {{ $t("auth.emailVerification.error.resending") }}
          </span>
          <span v-else>{{
            $t("auth.emailVerification.expired.getNewLinkButton")
          }}</span>
        </Button>
        <Button variant="outline" class="w-full" @click="goToLogin">
          {{ $t("auth.emailVerification.expired.backToSignIn") }}
        </Button>
      </CardContent>
    </Card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import { DefaultService } from "../../openapi/core";
import { useI18n } from "vue-i18n";
import { Button } from "../ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { useToast } from "../ui/toast/use-toast";
import { Loader2, CheckCircle2, XCircle, AlertTriangle } from "lucide-vue-next";
import AppBackground from "../primitives/AppBackground.vue";

const props = withDefaults(
  defineProps<{
    homePath?: string;
    signinPath?: string;
  }>(),
  { homePath: "/", signinPath: "/signin" }
);

const { t } = useI18n();
const route = useRoute();
const router = useRouter();
const { toast } = useToast();

// Reactive state
const verificationState = ref("loading"); // loading, success, error, expired
const errorMessage = ref("");
const resendLoading = ref(false);
const resendCooldown = ref(0);

// Computed properties
const canResend = computed(() => {
  return (
    ["error", "expired"].includes(verificationState.value) &&
    !errorMessage.value.includes("already verified")
  );
});

// Verify email on component mount
onMounted(async () => {
  const token = route.query.token as string;

  if (!token) {
    verificationState.value = "error";
    errorMessage.value = t("auth.emailVerification.error.noToken");
    return;
  }

  await verifyEmail(token);
});

// Verify email function
async function verifyEmail(token: string) {
  try {
    verificationState.value = "loading";

    const response = await DefaultService.verifyEmail({ token });

    if (response.email_verified) {
      verificationState.value = "success";
      toast({
        title: t("auth.emailVerification.toasts.success"),
        variant: "default",
      });
    } else {
      handleVerificationError(response.message || "Could not verify");
    }
  } catch (error) {
    console.error("Verification error:", error);
    verificationState.value = "error";
    errorMessage.value = t("auth.emailVerification.error.network");
  }
}

// Handle verification errors
function handleVerificationError(error: string) {
  if (error.includes("expired") || error.includes("invalid")) {
    verificationState.value = "expired";
  } else if (error.includes("already verified")) {
    verificationState.value = "success";
  } else {
    verificationState.value = "error";
    errorMessage.value = error || "An unexpected error occurred.";
  }
}

// Resend verification email
async function resendVerification() {
  try {
    resendLoading.value = true;
    await DefaultService.resendEmailVerification();

    toast({
      title: t("auth.emailVerification.toasts.resendSuccess"),
      variant: "default",
    });
    startResendCooldown();
  } catch (error) {
    console.error("Resend error:", error);
    toast({
      title: t("auth.emailVerification.toasts.networkError"),
      variant: "destructive",
    });
  } finally {
    resendLoading.value = false;
  }
}

// Navigation functions
async function goToDashboard() {
  await router.push(props.homePath);
}

async function goToLogin() {
  await router.push(props.signinPath);
}

function startResendCooldown() {
  resendCooldown.value = 60;
  const interval = setInterval(() => {
    resendCooldown.value--;
    if (resendCooldown.value <= 0) {
      clearInterval(interval);
    }
  }, 1000);
}
</script>
