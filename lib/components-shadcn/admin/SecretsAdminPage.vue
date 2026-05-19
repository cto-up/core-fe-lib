<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useI18n } from "vue-i18n";
import { DefaultService as SecretService, type Secret } from "secret-fe-lib/lib";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Badge } from "../ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { useToast } from "../ui/toast/use-toast";
import { useDialog } from "../composables/useDialog";
import {
  Loader2,
  Plus,
  RefreshCw,
  ShieldCheck,
  ShieldOff,
  Trash2,
} from "lucide-vue-next";

/**
 * Tenant-wide secret administration. Lists every secret the caller's
 * tenant owns (filtered by connector_type), and lets admins create,
 * revoke and delete. Backed by the shared secret-lib endpoints under
 * /admin-api/v1/secret/secrets — consumed module-agnostically via
 * `secret-fe-lib`.
 *
 * Standalone page (not a dialog) so it isn't subject to the Dialog
 * stacking / focus-trap quirks that were hiding the AAL2 verification
 * prompt when the inline CareSecretPicker was opened inside a
 * parent Dialog.
 */

const { t } = useI18n();
const { toast } = useToast();
const { dialog } = useDialog();

const secrets = ref<Secret[]>([]);
const loading = ref(false);
const connectorFilter = ref<string>("");

// Predefined connector types the app knows about. Free-form strings
// are still allowed (admin can type anything in the filter), this
// list just drives the dropdown + the "Create" default.
const KNOWN_CONNECTORS = [
  { value: "lre_api", labelKey: "core.secretsAdmin.connectors.lre_api" },
  { value: "smtp", labelKey: "core.secretsAdmin.connectors.smtp" },
  { value: "openai", labelKey: "core.secretsAdmin.connectors.openai" },
  { value: "jira", labelKey: "core.secretsAdmin.connectors.jira" },
  { value: "notion", labelKey: "core.secretsAdmin.connectors.notion" },
  { value: "other", labelKey: "core.secretsAdmin.connectors.other" },
];

const filteredSecrets = computed(() => {
  if (!connectorFilter.value || connectorFilter.value === "__all__") {
    return secrets.value;
  }
  return secrets.value.filter(
    (s) => s.connector_type === connectorFilter.value
  );
});

async function fetchSecrets() {
  loading.value = true;
  try {
    // No tenant_id filter: caller's tenant is applied server-side by
    // the middleware. SUPER_ADMIN could explicitly filter another
    // tenant via tenant_id, but the UI doesn't surface that lever —
    // this page is scoped to "my tenant's secrets".
    const list = await SecretService.listSecrets();
    secrets.value = (list as Secret[]) ?? [];
  } catch (e) {
    toast({
      variant: "destructive",
      title: t("core.secretsAdmin.fetchFailed"),
      description: (e as { body?: { message?: string } })?.body?.message,
    });
    secrets.value = [];
  } finally {
    loading.value = false;
  }
}

// --- Create dialog state -------------------------------------------
const createOpen = ref(false);
const newSecret = ref({
  name: "",
  value: "",
  connector_type: "lre_api",
  description: "",
});
const creating = ref(false);

function openCreate(connector: string = "lre_api") {
  newSecret.value = {
    name: "",
    value: "",
    connector_type: connector,
    description: "",
  };
  createOpen.value = true;
}

const canCreate = computed(
  () =>
    newSecret.value.name.trim() !== "" &&
    newSecret.value.value.trim() !== "" &&
    newSecret.value.connector_type.trim() !== ""
);

async function submitCreate() {
  if (!canCreate.value) return;
  creating.value = true;
  try {
    await SecretService.createSecret({
      name: newSecret.value.name.trim(),
      value: newSecret.value.value,
      connector_type: newSecret.value.connector_type.trim(),
      description: newSecret.value.description.trim() || undefined,
    });
    createOpen.value = false;
    toast({ title: t("core.secretsAdmin.created") });
    await fetchSecrets();
  } catch (e) {
    toast({
      variant: "destructive",
      title: t("core.secretsAdmin.createFailed"),
      description:
        (e as { body?: { message?: string; error?: string } })?.body?.message ??
        (e as { body?: { error?: string } })?.body?.error,
    });
  } finally {
    creating.value = false;
  }
}

// --- Row-level actions ---------------------------------------------
async function onRevoke(s: Secret) {
  const confirmed = await dialog({
    title: t("core.secretsAdmin.revokeTitle"),
    message: t("core.secretsAdmin.revokeMessage", { name: s.name }),
    ok: t("core.secretsAdmin.revoke"),
    cancel: t("actions.cancel"),
  });
  if (!confirmed) return;
  try {
    await SecretService.revokeSecret(s.id);
    toast({ title: t("core.secretsAdmin.revoked") });
    await fetchSecrets();
  } catch (e) {
    toast({
      variant: "destructive",
      title: t("core.secretsAdmin.revokeFailed"),
      description: (e as { body?: { message?: string } })?.body?.message,
    });
  }
}

async function onDelete(s: Secret) {
  const confirmed = await dialog({
    title: t("core.secretsAdmin.deleteTitle"),
    message: t("core.secretsAdmin.deleteMessage", { name: s.name }),
    ok: t("actions.delete"),
    cancel: t("actions.cancel"),
  });
  if (!confirmed) return;
  try {
    await SecretService.deleteSecret(s.id);
    toast({ title: t("core.secretsAdmin.deleted") });
    await fetchSecrets();
  } catch (e) {
    toast({
      variant: "destructive",
      title: t("core.secretsAdmin.deleteFailed"),
      description: (e as { body?: { message?: string } })?.body?.message,
    });
  }
}

function formatDate(iso?: string): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

onMounted(fetchSecrets);
</script>

<template>
  <div class="container mx-auto p-6 space-y-4">
    <Card>
      <CardHeader class="flex flex-row items-start justify-between gap-4">
        <div>
          <div class="flex items-center gap-2">
            <ShieldCheck class="h-5 w-5 text-primary" />
            <CardTitle>{{ t("core.secretsAdmin.title") }}</CardTitle>
          </div>
          <p class="mt-1 text-sm text-muted-foreground">
            {{ t("core.secretsAdmin.subtitle") }}
          </p>
        </div>
        <div class="flex items-center gap-2">
          <Select v-model="connectorFilter">
            <SelectTrigger class="w-44">
              <SelectValue
                :placeholder="t('core.secretsAdmin.filterPlaceholder')"
              />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">
                {{ t("core.secretsAdmin.allConnectors") }}
              </SelectItem>
              <SelectItem
                v-for="c in KNOWN_CONNECTORS"
                :key="c.value"
                :value="c.value"
              >
                {{ t(c.labelKey) }}
              </SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="sm"
            :disabled="loading"
            @click="fetchSecrets"
          >
            <RefreshCw
              class="h-4 w-4 mr-1.5"
              :class="{ 'animate-spin': loading }"
            />
            {{ t("actions.refresh") }}
          </Button>
          <Button size="sm" @click="openCreate('lre_api')">
            <Plus class="h-4 w-4 mr-1.5" />
            {{ t("core.secretsAdmin.createCta") }}
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        <div v-if="loading" class="flex justify-center py-10">
          <Loader2 class="h-6 w-6 animate-spin text-primary" />
        </div>

        <div
          v-else-if="!filteredSecrets.length"
          class="rounded-lg border border-dashed border-border py-10 text-center text-sm text-muted-foreground"
        >
          {{ t("core.secretsAdmin.empty") }}
        </div>

        <Table v-else>
          <TableHeader>
            <TableRow>
              <TableHead>{{ t("core.secretsAdmin.columns.name") }}</TableHead>
              <TableHead>{{
                t("core.secretsAdmin.columns.connector")
              }}</TableHead>
              <TableHead>{{
                t("core.secretsAdmin.columns.description")
              }}</TableHead>
              <TableHead>{{ t("core.secretsAdmin.columns.status") }}</TableHead>
              <TableHead>{{
                t("core.secretsAdmin.columns.updated")
              }}</TableHead>
              <TableHead class="text-right">{{
                t("core.secretsAdmin.columns.actions")
              }}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow v-for="s in filteredSecrets" :key="s.id">
              <TableCell class="font-mono text-xs">{{ s.name }}</TableCell>
              <TableCell>
                <Badge variant="outline">{{ s.connector_type }}</Badge>
              </TableCell>
              <TableCell class="text-xs text-muted-foreground">
                {{ s.description || "—" }}
              </TableCell>
              <TableCell>
                <Badge
                  :variant="s.status === 'active' ? 'secondary' : 'outline'"
                  :class="{
                    'text-muted-foreground': s.status !== 'active',
                  }"
                >
                  {{ s.status }}
                </Badge>
              </TableCell>
              <TableCell class="text-xs text-muted-foreground">
                {{ formatDate(s.updated_at) }}
              </TableCell>
              <TableCell class="text-right space-x-1">
                <Button
                  v-if="s.status === 'active'"
                  variant="ghost"
                  size="icon"
                  class="h-7 w-7"
                  :title="t('core.secretsAdmin.revoke')"
                  @click="onRevoke(s)"
                >
                  <ShieldOff class="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  class="h-7 w-7 text-destructive"
                  :title="t('actions.delete')"
                  @click="onDelete(s)"
                >
                  <Trash2 class="h-3.5 w-3.5" />
                </Button>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </CardContent>
    </Card>

    <!-- Create dialog. Standalone (no parent Dialog) so the AAL2
         verification prompt, when triggered by the POST, layers on
         top cleanly. -->
    <Dialog v-model:open="createOpen">
      <DialogContent class="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {{ t("core.secretsAdmin.createTitle") }}
          </DialogTitle>
          <DialogDescription>
            {{ t("core.secretsAdmin.createDescription") }}
          </DialogDescription>
        </DialogHeader>
        <form class="space-y-3" @submit.prevent="submitCreate">
          <div class="space-y-1.5">
            <Label for="secret-name">
              {{ t("core.secretsAdmin.nameLabel") }}
              <span class="text-destructive">*</span>
            </Label>
            <Input
              id="secret-name"
              v-model="newSecret.name"
              class="font-mono text-xs"
              autocomplete="off"
              :placeholder="newSecret.connector_type"
            />
          </div>
          <div class="space-y-1.5">
            <Label for="secret-connector">
              {{ t("core.secretsAdmin.connectorLabel") }}
              <span class="text-destructive">*</span>
            </Label>
            <Input
              id="secret-connector"
              v-model="newSecret.connector_type"
              class="font-mono text-xs"
              autocomplete="off"
            />
          </div>
          <div class="space-y-1.5">
            <Label for="secret-value">
              {{ t("core.secretsAdmin.valueLabel") }}
              <span class="text-destructive">*</span>
            </Label>
            <Input
              id="secret-value"
              v-model="newSecret.value"
              type="password"
              autocomplete="new-password"
            />
          </div>
          <div class="space-y-1.5">
            <Label for="secret-description">
              {{ t("core.secretsAdmin.descriptionLabel") }}
            </Label>
            <Input
              id="secret-description"
              v-model="newSecret.description"
              :placeholder="t('core.secretsAdmin.descriptionPlaceholder')"
            />
          </div>
        </form>
        <DialogFooter>
          <Button
            variant="outline"
            :disabled="creating"
            @click="createOpen = false"
          >
            {{ t("actions.cancel") }}
          </Button>
          <Button :disabled="!canCreate || creating" @click="submitCreate">
            <Loader2 v-if="creating" class="h-4 w-4 mr-2 animate-spin" />
            {{ t("core.secretsAdmin.createCta") }}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
</template>
