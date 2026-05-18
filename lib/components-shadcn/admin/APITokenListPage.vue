<template>
  <div class="container mx-auto p-6">
    <div class="space-y-4">
      <!-- Header -->
      <div class="flex items-center justify-between">
        <div>
          <h2 class="text-3xl font-bold tracking-tight">
            {{ $t("core.apiToken.home.title") }}
          </h2>
        </div>
        <div class="flex items-center gap-2">
          <div class="flex items-center space-x-2">
            <Switch id="includeRevoked" v-model:checked="includeRevoked" />
            <Label for="includeRevoked" class="cursor-pointer">
              {{ $t("core.apiToken.actions.includeRevoked") }}
            </Label>
          </div>
          <div class="flex items-center space-x-2">
            <Switch id="includeExpired" v-model:checked="includeExpired" />
            <Label for="includeExpired" class="cursor-pointer">
              {{ $t("core.apiToken.actions.includeExpired") }}
            </Label>
          </div>
          <Button @click="showCreateDialog = true">
            <Plus class="h-4 w-4" />
            <span class="hidden sm:inline ml-2">{{
              $t("core.apiToken.create")
            }}</span>
          </Button>
        </div>
      </div>

      <!-- Table -->
      <Card>
        <CardContent class="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{{ $t("core.apiToken.fields.name") }}</TableHead>
                <TableHead>
                  {{ $t("core.apiToken.fields.description") }}
                </TableHead>
                <TableHead>
                  {{ $t("core.apiToken.fields.tokenPrefix") }}
                </TableHead>
                <TableHead>
                  {{ $t("core.apiToken.fields.expiresAt") }}
                </TableHead>
                <TableHead>{{ $t("core.apiToken.fields.status") }}</TableHead>
                <TableHead class="text-right"> Actions </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody v-if="!loading && rows.length > 0">
              <TableRow v-for="row in rows" :key="row.id">
                <TableCell class="font-medium">
                  {{ row.name }}
                </TableCell>
                <TableCell>{{ row.description }}</TableCell>
                <TableCell>{{ row.tokenPrefix }}</TableCell>
                <TableCell>{{ formatDate(row.expiresAt) }}</TableCell>
                <TableCell>
                  <Badge :variant="row.revoked ? 'destructive' : 'default'">
                    {{
                      row.revoked ? $t("status.revoked") : $t("status.active")
                    }}
                  </Badge>
                </TableCell>
                <TableCell class="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger as-child>
                      <Button
                        variant="ghost"
                        class="h-8 w-8 p-0"
                        title="Open menu"
                      >
                        <span class="sr-only">Open menu</span>
                        <MoreHorizontal class="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        v-if="!row.revoked"
                        @click="confirmRevoke(row)"
                      >
                        <Ban class="mr-2 h-4 w-4" />
                        {{ $t("actions.revoke") }}
                      </DropdownMenuItem>
                      <DropdownMenuItem @click="confirmDelete(row)">
                        <Trash2 class="mr-2 h-4 w-4" />
                        {{ $t("actions.delete") }}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            </TableBody>
            <TableBody v-else-if="loading">
              <TableRow>
                <TableCell :colspan="6" class="text-center py-8">
                  <Loader2 class="h-6 w-6 animate-spin mx-auto" />
                </TableCell>
              </TableRow>
            </TableBody>
            <TableBody v-else>
              <TableRow>
                <TableCell
                  :colspan="6"
                  class="text-center py-8 text-muted-foreground"
                >
                  No data available
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <!-- Pagination -->
      <BPagination
        v-model="pagination"
        @change="onRequest({ getCellValue, pagination })"
      />
    </div>

    <!-- Create Token Dialog -->
    <Dialog v-model:open="showCreateDialog">
      <DialogContent class="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{{ $t("core.apiToken.create") }}</DialogTitle>
        </DialogHeader>
        <form @submit.prevent="createToken">
          <div v-if="!createdToken" class="grid gap-4 py-4">
            <div class="space-y-2">
              <Label for="name">{{ $t("core.apiToken.fields.name") }}</Label>
              <Input
                id="name"
                v-model="apiToken.name"
                :class="{ 'border-destructive': (v$ as any).name.$error }"
                @blur="v$.name.$touch"
              />
              <p
                v-if="(v$ as any).name.$error"
                class="text-sm text-destructive"
              >
                Name is required.
              </p>
            </div>
            <div class="space-y-2">
              <Label for="description">{{
                $t("core.apiToken.fields.description")
              }}</Label>
              <Input
                id="description"
                v-model="apiToken.description"
                type="textarea"
              />
            </div>
            <div class="space-y-2">
              <Label for="expiresAt">{{
                $t("core.apiToken.fields.expiresAt")
              }}</Label>
              <DatePicker
                v-model="apiToken.expiresAt"
                :format="'ISO'"
                :class="{ 'border-destructive': (v$ as any).expiresAt.$error }"
                @blur="v$.expiresAt.$touch"
              />
              <p
                v-if="(v$ as any).expiresAt.$error"
                class="text-sm text-destructive"
              >
                Expires At is required.
              </p>
            </div>
            <div class="space-y-2">
              <Label>{{ $t("core.apiToken.fields.scopes") }}</Label>
              <MultiSelect
                v-model="apiToken.scopes"
                :options="availableScopes"
                :placeholder="$t('core.apiToken.fields.scopes')"
                :allow-new="false"
              />
            </div>
          </div>
          <div v-else class="grid gap-4 py-4">
            <div class="text-sm text-destructive">
              {{ $t("core.apiToken.copyWarning") }}
            </div>
            <div class="space-y-2">
              <Label for="token">{{ $t("core.apiToken.fields.token") }}</Label>
              <div class="relative">
                <Input id="token" :model-value="createdToken.token" readonly />
                <Button
                  variant="ghost"
                  size="icon"
                  class="absolute right-0 top-0 h-full"
                  :title="$t('core.apiToken.actions.copyToken')"
                  @click="copyToken"
                >
                  <Copy class="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div class="space-y-2">
              <Label>{{ $t("core.apiToken.usage") }}</Label>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Method</TableHead>
                    <TableHead>Example</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell class="font-medium"> curl </TableCell>
                    <TableCell>
                      <code
                        >curl -H "X-Api-Key: {{ createdToken.token }}" ...</code
                      >
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell class="font-medium"> HTTP Header </TableCell>
                    <TableCell>
                      <code>X-Api-Key: {{ createdToken.token }}</code>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </div>
          <DialogFooter>
            <Button
              v-if="!createdToken"
              type="button"
              variant="outline"
              @click="showCreateDialog = false"
            >
              {{ $t("actions.cancel") }}
            </Button>
            <Button
              v-if="!createdToken"
              type="submit"
              :disabled="loading"
              class="ml-2"
            >
              {{ $t("actions.create") }}
            </Button>
            <Button
              v-else
              type="button"
              class="ml-2"
              @click="closeCreateDialog"
            >
              {{ $t("actions.close") }}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>

    <!-- Revoke Token Dialog -->
    <Dialog v-model:open="showRevokeDialog">
      <DialogContent class="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{{ $t("core.apiToken.revoke") }}</DialogTitle>
        </DialogHeader>
        <div class="grid gap-4 py-4">
          <div class="space-y-2">
            <Label for="revokeReason">{{
              $t("core.apiToken.fields.revokeReason")
            }}</Label>
            <Input id="revokeReason" v-model="revokeReason" type="textarea" />
          </div>
        </div>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            @click="showRevokeDialog = false"
          >
            {{ $t("actions.cancel") }}
          </Button>
          <Button
            type="button"
            variant="secondary"
            :disabled="loading"
            class="ml-2"
            @click="revokeToken"
          >
            {{ $t("actions.revoke") }}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
</template>

<script lang="ts" setup>
import { ref, onMounted, watch } from "vue";
import { DefaultService, type APIToken } from "../../openapi/core";
import { useAPIToken } from "../composables/useAPIToken";
import { useRoute } from "vue-router";
import { useToast } from "../ui/toast/use-toast";
import { useDialog } from "../composables/useDialog";
import useDate from "../composables/useDate";

import useListService, {
  getCellValue,
  type ListService,
} from "../composables/useListService";

import { type CancelablePromise } from "../../openapi/core";
import { useQueryParams } from "../../composables/useQueryParams";
import { useI18n } from "vue-i18n";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Switch } from "../ui/switch";
import { Badge } from "../ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import DatePicker from "../ui/date-picker/DatePicker.vue"; // Assuming you have a DatePicker component
import MultiSelect from "../ui/multi-select/MultiSelect.vue";
import {
  Search,
  Plus,
  Loader2,
  Trash2,
  Ban,
  Copy,
  MoreHorizontal,
} from "lucide-vue-next";
import BPagination from "../primitives/BPagination.vue";
import { required } from "@vuelidate/validators";

const route = useRoute();
const { toast } = useToast();
const { dialog } = useDialog();
const clientApplicationId = route.params.id as string;
const { formatDate } = useDate();
const { t } = useI18n();

const { apiToken, loading, v$, saveAPIToken, revokeAPIToken, deleteAPIToken } =
  useAPIToken(clientApplicationId);

const rows = ref<APIToken[]>([]);
const showCreateDialog = ref(false);
const showRevokeDialog = ref(false);
const revokeReason = ref("");
const selectedToken = ref<APIToken | null>(null);
const createdToken = ref<{ token: string } | null>(null);

const availableScopes = ["read", "write", "admin"]; // Add your actual scopes here

const columns = [
  {
    name: "name",
    required: true,
    label: "Name",
    align: "left",
    field: "name",
    sortable: true,
  },
  {
    name: "description",
    label: "Description",
    align: "left",
    field: "description",
  },
  {
    name: "tokenPrefix",
    label: "Token Prefix",
    align: "left",
    field: "tokenPrefix",
  },
  {
    name: "expiresAt",
    label: "Expires At",
    align: "left",
    field: "expiresAt",
    sortable: true,
  },
  {
    name: "status",
    label: "Status",
    align: "left",
    field: "revoked",
  },
  {
    name: "actions",
    label: "Actions",
    align: "right",
    field: "actions",
  },
];

const { setQueryParam, pagination, goToPreviousPage } = useQueryParams();

const filter = ref("");
const includeRevoked = ref(false);
const includeExpired = ref(false);

const listService: ListService<APIToken> = {
  listService(
    page: number,
    rowsPerPage: number,
    sortBy: string,
    order: "asc" | "desc"
  ): CancelablePromise<Array<APIToken>> {
    return DefaultService.listApiTokens(
      clientApplicationId,
      page,
      rowsPerPage,
      sortBy,
      order,
      includeRevoked.value,
      includeExpired.value
    );
  },
};

const { onRequest } = useListService<APIToken>({
  listService,
  rows,
  pagination,
  loading,
  filter,
});

watch(
  () => route.query.page,
  (newPage) => {
    pagination.value.page = Number.parseInt(newPage as string) || 1;
    onRequest({ getCellValue, pagination: pagination.value });
  }
);

watch(
  () => filter.value,
  (newFilter) => {
    setQueryParam("filter", newFilter);
  }
);

watch([() => includeRevoked.value, () => includeExpired.value], () => {
  setQueryParam("includeRevoked", includeRevoked.value.toString());
  setQueryParam("includeExpired", includeExpired.value.toString());
  onRequest({ getCellValue, pagination: pagination.value });
});

onMounted(() => {
  filter.value = (route.query.filter as string) || "";
  includeRevoked.value = route.query.includeRevoked === "true";
  includeExpired.value = route.query.includeExpired === "true";
  onRequest({
    getCellValue,
    pagination: pagination.value,
    filter: filter.value,
  });
});
const createToken = async () => {
  const result = await saveAPIToken();
  if (result) {
    createdToken.value = result;
  }
};

const copyToken = async () => {
  if (createdToken.value) {
    await navigator.clipboard.writeText(createdToken.value.token);
    toast({
      title: t("info.copied"),
      variant: "default",
    });
  }
};

const closeCreateDialog = () => {
  showCreateDialog.value = false;
  createdToken.value = null;
  // Reset form
  apiToken.name = "";
  apiToken.description = "";
  apiToken.expiresAt = "";
  apiToken.scopes = [];
  // Refresh the table
  onRequest({ pagination: pagination.value, getCellValue });
};

const confirmRevoke = (token: APIToken) => {
  selectedToken.value = token;
  showRevokeDialog.value = true;
};

const revokeToken = async () => {
  if (selectedToken.value) {
    await revokeAPIToken(selectedToken.value.id, revokeReason.value);
    showRevokeDialog.value = false;
    onRequest({ pagination: pagination.value, getCellValue });
  }
};

const confirmDelete = async (token: APIToken) => {
  const confirmed = await dialog({
    title: "Confirm Deletion",
    message: `Are you sure you want to delete the token "${token.name}"?`,
    cancel: "Cancel",
    ok: "Delete",
    persistent: true,
  });

  if (!confirmed) return;

  await deleteAPIToken(token.id);
  onRequest({ pagination: pagination.value, getCellValue });
};
</script>
