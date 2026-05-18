<template>
  <div class="container mx-auto p-6">
    <div class="space-y-4">
      <!-- Header -->
      <div class="flex items-center justify-between">
        <div>
          <h2 class="text-3xl font-bold tracking-tight">
            {{ $t("core.tenant.home.title") }}
          </h2>
        </div>
        <div class="flex items-center gap-2">
          <div class="relative">
            <Search
              class="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground"
            />
            <Input
              v-model="filter"
              :placeholder="$t('actions.search')"
              class="pl-9 w-[250px]"
            />
          </div>
          <Button @click="$router.push(newTenantPath)">
            <Plus class="h-4 w-4" />
            <span class="hidden sm:inline ml-2">{{
              $t("core.tenant.home.createLabel")
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
                <TableHead>{{ t("core.tenant.fields.tenantId") }}</TableHead>
                <TableHead>{{ t("core.tenant.fields.name") }}</TableHead>
                <TableHead>{{ t("core.tenant.fields.subdomain") }}</TableHead>
                <TableHead>Email Link Sign In</TableHead>
                <TableHead>Password Sign Up</TableHead>
                <TableHead class="text-right"> Actions </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody v-if="!loading && rows.length > 0">
              <TableRow
                v-for="row in rows"
                :key="row.id"
                class="cursor-pointer hover:bg-muted/50"
                @click="onRowSelect(row.id)"
              >
                <TableCell class="font-medium">
                  {{ row.tenant_id }}
                </TableCell>
                <TableCell>{{ row.name }}</TableCell>
                <TableCell>{{ row.subdomain }}</TableCell>
                <TableCell>
                  <Badge
                    :variant="
                      row.enable_email_link_sign_in ? 'default' : 'secondary'
                    "
                  >
                    {{ row.enable_email_link_sign_in ? "Yes" : "No" }}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge
                    :variant="
                      row.allow_password_sign_up ? 'default' : 'secondary'
                    "
                  >
                    {{ row.allow_password_sign_up ? "Yes" : "No" }}
                  </Badge>
                </TableCell>
                <TableCell class="text-right">
                  <div class="flex justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      @click.stop="
                        (event: MouseEvent) => onUsersRowSelect(row.id)
                      "
                    >
                      <Users class="h-4 w-4" />
                      <span class="hidden sm:inline ml-2">{{
                        $t("core.user.home.title")
                      }}</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      @click.stop="
                        (event: MouseEvent) => onFeaturesRowSelect(row.id)
                      "
                    >
                      <Grid3x3 class="h-4 w-4" />
                      <span class="hidden sm:inline ml-2">{{
                        t("core.tenant.features.title")
                      }}</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      @click.stop="
                        (event: MouseEvent) => deleteTenant(row.id, row.name)
                      "
                    >
                      <Trash2 class="h-4 w-4" />
                    </Button>
                  </div>
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
  </div>
</template>

<script lang="ts" setup>
import {
  type CancelablePromise,
  DefaultService,
  type Tenant,
} from "../../openapi/core";
import { onMounted, ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import { useRoute, useRouter } from "vue-router";
import useListService, {
  getCellValue,
  type ListService,
} from "../composables/useListService";
import { useQueryParams } from "../../composables/useQueryParams";
import { useErrors } from "../composables/useErrors";
import { useDialog } from "../composables/useDialog";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Badge } from "../ui/badge";
import { Card, CardContent } from "../ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import { Search, Plus, Users, Grid3x3, Trash2, Loader2 } from "lucide-vue-next";
import BPagination from "../primitives/BPagination.vue";

const props = withDefaults(
  defineProps<{
    newTenantPath?: string;
    editTenantRouteName?: string;
    tenantUsersRouteName?: string;
    tenantFeaturesRouteName?: string;
  }>(),
  {
    newTenantPath: "/super-admin/tenants/new",
    editTenantRouteName: "super-admin-edit-tenant",
    tenantUsersRouteName: "super-admin-users",
    tenantFeaturesRouteName: "super-admin-tenant-features",
  }
);

const { dialog } = useDialog();
const { t } = useI18n();
const route = useRoute();
const router = useRouter();
const { handleError } = useErrors();
const rows = ref<Tenant[]>([]);
const loading = ref(false);
const { currentQuery, setQueryParam, pagination, goToPreviousPage } =
  useQueryParams();
const filter = ref("");

const listService: ListService<Tenant> = {
  listService(
    page: number,
    rowsPerPage: number,
    sortBy: string,
    order: "asc" | "desc",
    q?: string
  ): CancelablePromise<Array<Tenant>> {
    return DefaultService.listTenants(page, rowsPerPage, sortBy, order, q);
  },
};

const { onRequest } = useListService<Tenant>({
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

onMounted(() => {
  filter.value = (route.query.filter as string) || "";
  onRequest({
    getCellValue,
    pagination: pagination.value,
    filter: filter.value,
  });
});

const onRowSelect = (tenantID: string) => {
  void router.push({
    name: props.editTenantRouteName,
    params: { id: tenantID },
    query: currentQuery.value,
  });
};

const onUsersRowSelect = (tenantID: string) => {
  void router.push({
    name: props.tenantUsersRouteName,
    params: { tenantid: tenantID },
    query: { ...currentQuery.value, page: 1 }, // Reset page to 1 when navigating to users
  });
};

const onFeaturesRowSelect = (tenantID: string) => {
  void router.push({
    name: props.tenantFeaturesRouteName,
    params: { tenantid: tenantID },
    query: currentQuery.value,
  });
};

const deleteTenant = async (id: string, name: string) => {
  const confirmed = await dialog({
    message: t("core.tenant.actions.delete.confirm", { name: name }),
    cancel: t("actions.cancel"),
    ok: t("actions.delete"),
  });

  if (!confirmed) return;

  DefaultService.deleteTenant(id)
    .then(() => {
      onRequest({ pagination: pagination.value, getCellValue });
    })
    .catch((err: any) => {
      handleError(err);
    });
};
</script>
