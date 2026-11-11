<template>
  <div class="flex items-center justify-center min-h-screen bg-background/50">
    <AppBackground />
    <div class="relative z-10 max-w-md w-full mx-4">
      <div v-if="lookingForTenant" class="flex justify-center">
        <Loader2 class="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
      <div v-else class="text-center space-y-6">
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
import { computed, onMounted, ref } from "vue";
import { Loader2 } from "lucide-vue-next";
import { useI18n } from "vue-i18n";
import { useRoute, useRouter } from "vue-router";
import { useUserStore } from "../../stores/user-store";
import { useTenantStore } from "../../stores/tenant-store";
import {
  kratosService,
  updateUserFromSession,
  useKratosAuth,
} from "../../authentication/vue";
import { Button } from "../ui/button";
import AppBackground from "../primitives/AppBackground.vue";
import { MeService } from "../../openapi/core/services/MeService";
import { DefaultService } from "../../openapi/core";
import {
  enterableTenantSubdomain,
  tenantOrigin,
} from "../../router/tenant-host";

const { t } = useI18n();
const userStore = useUserStore();
const tenantStore = useTenantStore();
const { signMeOut } = useKratosAuth();
const route = useRoute();
const router = useRouter();

const userEmail = computed(() => userStore.user?.email || "Unknown");
const tenantName = computed(
  () =>
    tenantStore.tenant?.profile?.displayName ||
    tenantStore.tenant?.subdomain ||
    "this tenant"
);
const contactEmail = computed(() => {
  const profile = tenantStore.tenant?.profile;
  if (!profile) return undefined;
  if ("contactEmail" in profile && typeof profile.contactEmail === "string") {
    return profile.contactEmail;
  }
  const anyProfile = profile as Record<string, unknown>;
  if (
    "contact_email" in anyProfile &&
    typeof anyProfile.contact_email === "string"
  ) {
    return anyProfile.contact_email;
  }
  return undefined;
});

// The guard decided on what it had at page load; before telling the user they
// are locked out, re-read the session and the tenant. Someone who does hold a
// role here (a super admin, a member just granted access) goes on to where
// they were headed; a member of another organization is sent there. Only a
// user with nowhere to go sees the card.
const lookingForTenant = ref(true);

async function refreshRoles(): Promise<void> {
  const session = await kratosService.getSession({ force: true });
  if (!tenantStore.tenant?.tenant_id) {
    tenantStore.setTenant(await DefaultService.getPublicTenant());
  }
  await updateUserFromSession(session);
}

async function memberTenantSubdomain(): Promise<string | null> {
  const claimed = (
    userStore.session?.identity.metadata_public?.tenant_memberships ?? []
  ).map((m) => m.tenant_id);
  return enterableTenantSubdomain(
    await MeService.listMyTenants(),
    claimed,
    tenantStore.tenant?.tenant_id
  );
}

onMounted(async () => {
  try {
    await refreshRoles();
    if (!userStore.isLogged) {
      await router.replace({ name: "signin" });
      return;
    }
    if (userStore.hasRole) {
      const back = route.redirectedFrom?.fullPath;
      await router.replace(back && back !== route.fullPath ? back : "/");
      return;
    }
    const subdomain = await memberTenantSubdomain();
    if (subdomain) {
      globalThis.location.replace(tenantOrigin(subdomain) + "/");
      return;
    }
  } catch (err) {
    console.warn("⚠️  Could not re-check access to this tenant:", err);
  }
  lookingForTenant.value = false;
});

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
