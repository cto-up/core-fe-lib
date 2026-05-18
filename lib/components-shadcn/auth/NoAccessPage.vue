<template>
  <div class="flex items-center justify-center min-h-screen bg-background/50">
    <AppBackground />
    <div class="relative z-10 max-w-md w-full mx-4">
      <div class="text-center space-y-6">
        <!-- Icon -->
        <div class="flex justify-center">
          <div
            class="rounded-full bg-muted p-6 inline-flex items-center justify-center"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-16 w-16 text-muted-foreground"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
          </div>
        </div>

        <!-- Title -->
        <div class="space-y-2">
          <h1 class="text-3xl font-bold tracking-tight">
            {{ $t("auth.noAccess.title") }}
          </h1>
          <p class="text-muted-foreground text-lg">
            {{ $t("auth.noAccess.subtitle") }}
          </p>
        </div>

        <!-- Message -->
        <div class="bg-muted/50 rounded-lg p-6 space-y-3">
          <p class="text-sm text-muted-foreground">
            {{ $t("auth.noAccess.message1") }}
            <span class="font-semibold text-foreground">{{ tenantName }}</span>
            {{ $t("auth.noAccess.message2") }}
          </p>
          <p class="text-sm text-muted-foreground">
            {{ $t("auth.noAccess.message3") }}
          </p>
        </div>

        <!-- User Info -->
        <div class="text-sm text-muted-foreground">
          {{ $t("auth.noAccess.signedInAs") }}
          <span class="font-medium text-foreground">{{ userEmail }}</span>
        </div>

        <!-- Actions -->
        <div class="flex flex-col gap-3">
          <Button variant="outline" class="w-full" @click="handleSignOut">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-4 w-4 mr-2"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
              />
            </svg>
            {{ $t("auth.noAccess.signOutButton") }}
          </Button>

          <Button
            v-if="contactEmail"
            variant="default"
            class="w-full"
            @click="handleContactAdmin"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-4 w-4 mr-2"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
            {{ $t("auth.noAccess.contactAdminButton") }}
          </Button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { useUserStore } from "../../stores/user-store";
import { useTenantStore } from "../../stores/tenant-store";
import { useKratosAuth } from "../../authentication/vue";
import { Button } from "../ui/button";
import AppBackground from "../primitives/AppBackground.vue";

const { t } = useI18n();
const userStore = useUserStore();
const tenantStore = useTenantStore();
const { signMeOut } = useKratosAuth();

const userEmail = computed(() => userStore.user?.email || "Unknown");
const tenantName = computed(
  () =>
    tenantStore.tenant?.profile?.displayName ||
    tenantStore.tenant?.subdomain ||
    "this tenant"
);
const contactEmail = computed(() => tenantStore.tenant?.profile?.contactEmail);

const handleSignOut = async () => {
  await signMeOut();
};

const handleContactAdmin = () => {
  if (contactEmail.value) {
    const subject = encodeURIComponent(
      t("auth.noAccess.emailSubject", { tenantName: tenantName.value })
    );
    const body = encodeURIComponent(
      t("auth.noAccess.emailBody", {
        tenantName: tenantName.value,
        userEmail: userEmail.value,
      })
    );
    globalThis.location.href = `mailto:${contactEmail.value}?subject=${subject}&body=${body}`;
  }
};
</script>
