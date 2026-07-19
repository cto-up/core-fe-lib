<template>
  <div class="flex items-center justify-center min-h-screen">
    <!-- Success State -->
    <Card v-if="emailSent" class="w-full max-w-md">
      <CardHeader class="text-center">
        <div class="flex justify-center mb-4">
          <div class="rounded-full bg-green-100 p-3">
            <Mail class="h-8 w-8 text-green-600" />
          </div>
        </div>
        <CardTitle>{{ t("auth.passwordReset.checkEmailTitle") }}</CardTitle>
        <CardDescription>
          {{ t("auth.passwordReset.checkEmailDescription") }}
        </CardDescription>
      </CardHeader>
      <CardContent class="space-y-4">
        <div v-if="sentTo" class="text-center">
          <p class="text-sm text-muted-foreground mb-1">
            {{ t("auth.passwordReset.emailSentTo") }}
          </p>
          <p class="font-medium text-foreground">{{ sentTo }}</p>
        </div>
        <div class="bg-muted/50 border rounded-md p-3 text-sm text-muted-foreground text-center">
          {{ t("auth.passwordReset.closePageHint") }}
        </div>
        <p class="text-center text-sm text-muted-foreground">
          {{ t("auth.passwordReset.spamHint") }}
        </p>
      </CardContent>
    </Card>

    <!-- Request Form -->
    <Card v-else class="w-full max-w-md">
      <CardHeader>
        <CardTitle>{{ t("auth.passwordReset.title") }}</CardTitle>
      </CardHeader>
      <CardContent class="space-y-4">
        <div class="space-y-2">
          <Label for="email">{{ t("auth.passwordReset.emailLabel") }}</Label>
          <Input
            id="email"
            v-model="email"
            type="email"
            @keydown.enter="resetPassword"
          />
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
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Mail } from "lucide-vue-next";
import { getUserFriendlyMessage } from "../../authentication";

withDefaults(defineProps<{ homePath?: string }>(), {
  homePath: "/",
});

const { toast } = useToast();
const { t } = useI18n();
const email = ref("");
const sentTo = ref("");
const loading = ref(false);
const emailSent = ref(false);

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

    // Show a terminal confirmation: a link was sent, they can close the page.
    sentTo.value = email.value;
    emailSent.value = true;
    email.value = "";
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
