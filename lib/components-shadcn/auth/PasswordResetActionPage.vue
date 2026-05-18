<template>
  <div class="container mx-auto p-6">
    <Card class="w-full max-w-sm">
      <CardHeader>
        <CardTitle>{{ t("auth.passwordReset.title") }}</CardTitle>
      </CardHeader>
      <CardContent>
        <form class="space-y-4" @submit.prevent="resetPassword">
          <div class="space-y-2">
            <Label for="newPassword">{{
              t("auth.passwordReset.newPasswordLabel")
            }}</Label>
            <div class="relative">
              <Key
                class="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground"
              />
              <Input
                id="newPassword"
                v-model="newPassword"
                type="password"
                required
                class="pl-9"
              />
            </div>
          </div>
          <Button type="submit" class="w-full">
            {{ t("auth.passwordReset.resetButton") }}
          </Button>
        </form>
      </CardContent>
    </Card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useToast } from "../ui/toast/use-toast";
import { useRouter } from "vue-router";
import { useI18n } from "vue-i18n";
import {
  getUserFriendlyMessage,
  kratosService,
} from "../../authentication";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Key } from "lucide-vue-next";

const props = withDefaults(
  defineProps<{ signinPath?: string }>(),
  { signinPath: "/signin" }
);

const newPassword = ref("");
const { toast } = useToast();
const { t } = useI18n();
const router = useRouter();
let flowId = "";

onMounted(() => {
  const urlParams = new URLSearchParams(globalThis.location.search);
  flowId = urlParams.get("flow") as string;

  if (!flowId) {
    toast({
      title: "Invalid reset link",
      variant: "destructive",
    });
    router.push(props.signinPath);
  }
});

const resetPassword = async () => {
  try {
    await kratosService.submitSettingsFlow(flowId, {
      method: "password",
      password: newPassword.value,
    });

    toast({
      title: t("auth.passwordReset.success"),
      variant: "default",
    });

    router.push(props.signinPath);
  } catch (err) {
    console.error("Failed to reset password", err);
    const errorMessage =
      getUserFriendlyMessage(err) ?? t("auth.passwordReset.error");
    toast({
      title: errorMessage,
      variant: "destructive",
    });
  }
};
</script>
