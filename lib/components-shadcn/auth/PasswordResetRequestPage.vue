<template>
  <div class="flex items-center justify-center min-h-screen">
    <Card class="w-full max-w-md">
      <CardHeader>
        <CardTitle>{{ t("auth.passwordReset.title") }}</CardTitle>
      </CardHeader>
      <CardContent class="space-y-4">
        <div class="space-y-2">
          <Label for="email">{{ t("auth.passwordReset.emailLabel") }}</Label>
          <Input id="email" v-model="email" type="email" />
        </div>
      </CardContent>
      <CardFooter class="flex justify-end gap-2 p-4">
        <Button class="w-full" :disabled="loading" @click="resetPassword">
          {{
            loading
              ? t("auth.passwordReset.sending")
              : t("auth.passwordReset.resetButton")
          }}
        </Button>
      </CardFooter>
    </Card>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useToast } from "../ui/toast/use-toast";
import { useI18n } from "vue-i18n";
import { DefaultService } from "../../openapi/core";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { getUserFriendlyMessage } from "../../authentication";
import { useRouter } from "vue-router";

const props = withDefaults(defineProps<{ homePath?: string }>(), {
  homePath: "/",
});

const { toast } = useToast();
const { t } = useI18n();
const email = ref("");
const loading = ref(false);
const router = useRouter();
const resetPassword = async () => {
  if (!email.value) {
    toast({
      title: t("auth.error"),
      description: "Please enter your email address",
      variant: "destructive",
    });
    return;
  }

  loading.value = true;
  try {
    // Use backend API for password reset (public endpoint)
    await DefaultService.resetPasswordRequest({
      email: email.value,
    });

    toast({
      title: t("auth.success"),
      description: t("auth.passwordReset.emailSent"),
    });

    // Clear the email field
    email.value = "";

    router.push(props.homePath);
  } catch (error) {
    console.error("Password reset error:", error);
    const errorMessage =
      getUserFriendlyMessage(error) || t("auth.passwordReset.error");
    toast({
      title: t("auth.error"),
      description: errorMessage,
      variant: "destructive",
    });
  } finally {
    loading.value = false;
  }
};
</script>
