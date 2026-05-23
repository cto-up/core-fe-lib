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
          <div class="rounded-full bg-green-100 p-3">
            <Mail class="h-8 w-8 text-green-600" />
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
        <div class="bg-blue-50 border border-blue-200 rounded-md p-4 text-sm">
          <p class="font-medium text-blue-800 mb-2">
            {{ $t("auth.signUp.nextSteps") }}
          </p>
          <ol class="list-decimal list-inside space-y-1 text-blue-700">
            <li>{{ $t("auth.signUp.step1") }}</li>
            <li>{{ $t("auth.signUp.step2") }}</li>
            <li>{{ $t("auth.signUp.step3") }}</li>
          </ol>
        </div>
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
import { computed, ref } from "vue";
import { useToast } from "../ui/toast/use-toast";
import { AuthService } from "../../openapi/core";
import {
  required,
  email as emailVerif,
  maxLength,
} from "@vuelidate/validators";
import useVuelidate from "@vuelidate/core";
import { getUserFriendlyMessage, useTenant } from "../../authentication/vue";
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
import { Mail, Loader2 } from "lucide-vue-next";
import { RouterLink } from "vue-router";
import AppBackground from "../primitives/AppBackground.vue";

withDefaults(
  defineProps<{
    signinPath?: string;
  }>(),
  { signinPath: "/signin" }
);

const { t } = useI18n();
const { toast } = useToast();
const { canSignUp } = useTenant();

const email = ref("");
const loading = ref(false);
const emailSent = ref(false);

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
