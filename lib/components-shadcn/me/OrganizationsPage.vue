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
            <Button variant="outline" size="sm" @click="startLeave(m)">
              {{ t("core.organizations.leaveAction") }}
            </Button>
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
      @scheduled="load"
    />
  </div>
</template>

<script lang="ts" setup>
import { onMounted, ref } from "vue";
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
import type { TenantMembership } from "../../openapi/core/models/TenantMembership";
import type { AccountDeletion } from "../../openapi/core/models/AccountDeletion";

const { t, locale } = useI18n();
const { toast } = useToast();

const memberships = ref<TenantMembership[]>([]);
const deletion = ref<AccountDeletion | null>(null);
const leaving = ref<TenantMembership | null>(null);
const leaveOpen = ref(false);
const closeOpen = ref(false);
const loading = ref(true);
const busy = ref(false);

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
    window.location.href = `${window.location.protocol}//${m.subdomain}.${rootDomain()}/user/me/organizations?leave=1`;
    return;
  }
  leaving.value = m;
  leaveOpen.value = true;
}

function rootDomain(): string {
  const parts = currentHost.split(".");
  return parts.length > 2 ? parts.slice(1).join(".") : currentHost;
}

function onLeft() {
  toast({ title: t("core.organizations.leftToast") });
  // Access to this tenant is already gone — the claim was rewritten and it is
  // re-read on the next request — so there is nothing useful left on this host.
  window.location.href = "/";
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
