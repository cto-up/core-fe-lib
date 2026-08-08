<template>
  <div class="container mx-auto p-6">
    <Card class="max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>{{ t("core.organizations.title") }}</CardTitle>
        <CardDescription>{{
          t("core.organizations.subtitle")
        }}</CardDescription>
      </CardHeader>
      <CardContent class="space-y-6">
        <!-- Signing in during the grace period is the cancellation path, so the
             banner leads with the way back, not with the date. -->
        <div
          v-if="deletion?.status === 'scheduled'"
          class="rounded-md border border-destructive/40 bg-destructive/5 p-4 space-y-3"
        >
          <p class="text-sm font-medium">
            {{
              t("core.organizations.deletionScheduled", {
                date: formatDate(deletion.scheduledFor),
              })
            }}
          </p>
          <Button size="sm" :disabled="busy" @click="cancelDeletion">
            {{ t("core.organizations.keepAccount") }}
          </Button>
        </div>

        <div
          v-if="loading"
          class="flex items-center gap-2 text-sm text-muted-foreground"
        >
          <Loader2 class="h-4 w-4 animate-spin" />
          {{ t("core.organizations.loading") }}
        </div>

        <p
          v-else-if="!memberships.length"
          class="text-sm text-muted-foreground"
        >
          {{ t("core.organizations.empty") }}
        </p>

        <ul v-else class="divide-y divide-border">
          <li
            v-for="m in memberships"
            :key="m.id"
            class="flex flex-wrap items-center justify-between gap-3 py-4"
          >
            <div class="min-w-0">
              <p class="font-medium truncate">{{ m.tenant_name }}</p>
              <p class="text-sm text-muted-foreground truncate">
                {{ m.subdomain }}
                <template v-if="m.roles?.length">
                  · {{ m.roles.join(", ") }}</template
                >
                <template v-if="m.joined_at">
                  ·
                  {{
                    t("core.organizations.joined", {
                      date: formatDate(m.joined_at),
                    })
                  }}
                </template>
              </p>
            </div>
            <Button
              v-if="canLeave"
              variant="outline"
              size="sm"
              @click="startLeave(m)"
            >
              {{ t("core.organizations.leaveAction") }}
            </Button>
            <p v-else class="text-sm text-muted-foreground">
              {{ t("core.organizations.onlyOrganization") }}
            </p>
          </li>
        </ul>

        <div class="border-t border-border pt-6">
          <p class="text-sm font-medium">
            {{ t("core.organizations.dangerZone") }}
          </p>
          <p class="text-sm text-muted-foreground mb-3">
            {{ t("core.organizations.closeHint") }}
          </p>
          <Button
            variant="destructive"
            size="sm"
            :disabled="deletion?.status === 'scheduled'"
            @click="closeOpen = true"
          >
            {{ t("core.organizations.closeAction") }}
          </Button>
        </div>
      </CardContent>
    </Card>

    <LeaveOrganizationDialog
      v-if="leaving"
      v-model:open="leaveOpen"
      :membership="leaving"
      @left="onLeft"
    />
    <CloseAccountDialog
      v-model:open="closeOpen"
      :tenant-count="memberships.length"
      @scheduled="onDeletionScheduled"
    />
  </div>
</template>

<script lang="ts" setup>
import { computed, onMounted, ref } from "vue";
import { useI18n } from "vue-i18n";
import { Loader2 } from "lucide-vue-next";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Button } from "../ui/button";
import { useToast } from "../ui/toast";
import LeaveOrganizationDialog from "./LeaveOrganizationDialog.vue";
import CloseAccountDialog from "./CloseAccountDialog.vue";
import { MeService } from "../../openapi/core/services/MeService";
import { useUrl } from "../../composables/useUrl";
import { kratosService } from "../../authentication/vue";
import type { TenantMembership } from "../../openapi/core/models/TenantMembership";
import type { AccountDeletion } from "../../openapi/core/models/AccountDeletion";

const { t, locale } = useI18n();
const { toast } = useToast();
const { getDomain } = useUrl();

const memberships = ref<TenantMembership[]>([]);
const deletion = ref<AccountDeletion | null>(null);
const leaving = ref<TenantMembership | null>(null);
const leaveOpen = ref(false);
const closeOpen = ref(false);
const loading = ref(true);
const busy = ref(false);

// Leaving your ONLY organization strands the account: this app is addressed by
// subdomain, so a member of nothing has nowhere to sign in to and no way back
// to this page — including no way to reach Close my account. When there is one
// membership, closing the account IS leaving it, and that is the only door
// offered.
const canLeave = computed(() => memberships.value.length > 1);

// The host names the tenant on every call, so leaving an organization other than
// the current one means going there first. One redirect buys a single addressing
// rule for the whole product: no caller ever names a tenant.
const currentHost = window.location.host;

function isCurrentTenant(m: TenantMembership): boolean {
  return (
    currentHost.startsWith(`${m.subdomain}.`) || currentHost === m.subdomain
  );
}

function formatDate(value?: string): string {
  if (!value) return "";
  return new Date(value).toLocaleDateString(locale.value, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function startLeave(m: TenantMembership) {
  if (!isCurrentTenant(m)) {
    // useUrl owns host parsing (multi-part subdomains, localhost), so the
    // target origin is never re-derived by splitting on dots.
    const { protocol, port } = window.location;
    window.location.href = `${protocol}//${m.subdomain}.${getDomain()}${
      port ? `:${port}` : ""
    }/user/me/organizations?leave=1`;
    return;
  }
  leaving.value = m;
  leaveOpen.value = true;
}

function onLeft() {
  toast({ title: t("core.organizations.leftToast") });

  // The host stays; only the path resets. Every AUTHENTICATED route here now
  // 401s — the claim was rewritten and it is re-read on the next request — but
  // the tenant's front page is public, and this host is the one that still
  // resolves a tenant. The apex does not: its sign-in and password-reset pages
  // cannot resolve one at all, which is the dead end this replaces.
  window.location.href = "/";
}

// Closing an account keeps this host too, deliberately.
//
// The account still works for the whole grace period, and the documented way to
// change your mind is to sign in again — which needs a host that carries a
// tenant. The apex answers "Tenant not found" on exactly the pages somebody in
// this position reaches for (sign in, reset password), which is the opposite of
// a recovery path. Signing out first stops the tenant redirect from bouncing
// the session straight back into the app.
async function onDeletionScheduled() {
  try {
    await kratosService.logout();
  } finally {
    window.location.href = "/";
  }
}

async function cancelDeletion() {
  busy.value = true;
  try {
    deletion.value = await MeService.cancelMyAccountDeletion();
    toast({ title: t("core.organizations.deletionCancelled") });
  } finally {
    busy.value = false;
  }
}

async function load() {
  loading.value = true;
  try {
    const [tenants, status] = await Promise.all([
      MeService.listMyTenants(),
      MeService.getMyAccountDeletion(),
    ]);
    memberships.value = tenants;
    deletion.value = status;
  } finally {
    loading.value = false;
  }
}

onMounted(async () => {
  await load();
  // Arriving from another host's Organizations page: open the dialog straight
  // away rather than making the person find the row again.
  if (new URLSearchParams(window.location.search).get("leave") === "1") {
    const here = memberships.value.find(isCurrentTenant);
    if (here) startLeave(here);
  }
});
</script>
