<template>
  <main
    class="h-screen w-screen flex items-center justify-center bg-background/50"
  >
    <AppBackground />
    <Card class="relative z-10 w-full max-w-sm backdrop-blur-sm bg-card/80">
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
import { ref } from "vue";
import { useVuelidate } from "@vuelidate/core";
import { required, email as emailRule } from "@vuelidate/validators";
import { useKratosAuth, useTenant } from "../../authentication/vue";
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
import { Mail } from "lucide-vue-next";
import PasswordInput from "../primitives/PasswordInput.vue";
import AppBackground from "../primitives/AppBackground.vue";

withDefaults(
  defineProps<{
    recoveryPath?: string;
    signupPath?: string;
  }>(),
  {
    recoveryPath: "/user/me/password-reset-request",
    signupPath: "/signup",
  }
);

const email = ref("");
const password = ref("");
const { canSignUp } = useTenant();
const { signMeIn } = useKratosAuth();

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
