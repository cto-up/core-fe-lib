<template>
  <div class="container mx-auto p-6">
    <div class="space-y-4">
      <!-- Tenant Name Header -->
      <h1 v-if="tenant" class="text-2xl font-bold">
        Tenant: {{ tenant.name }}
      </h1>

      <!-- Header with search and create button -->
      <div
        class="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div>
          <h2 class="text-3xl font-bold tracking-tight">
            {{ $t("core.user.home.title") }}
          </h2>
        </div>
        <div class="flex items-center gap-2">
          <div class="relative flex-1 sm:flex-none">
            <Search
              class="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground"
            />
            <Input
              v-model="filter"
              :placeholder="$t('actions.search')"
              class="pl-9 w-full sm:w-[250px]"
            />
          </div>
          <Button @click="onCreate">
            <Plus class="h-4 w-4" />
            <span class="hidden sm:inline ml-2">{{
              $t("core.user.home.createLabel")
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
                <TableHead>{{ t("core.user.fields.name") }}</TableHead>
                <TableHead>{{ t("core.user.fields.email") }}</TableHead>
                <TableHead>{{ t("core.user.fields.roles") }}</TableHead>
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
                  {{ row.name }}
                </TableCell>
                <TableCell>{{ row.email }}</TableCell>
                <TableCell>
                  <Badge
                    v-for="role in row.roles"
                    :key="role"
                    variant="outline"
                    class="mr-1"
                  >
                    {{ role }}
                  </Badge>
                </TableCell>
                <TableCell class="text-right">
                  <div class="flex items-center justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      :title="'Remove from Tenant'"
                      @click.stop="
                        (event: MouseEvent) =>
                          removeUserFromTenant(row.id, row.name)
                      "
                    >
                      <UserMinus class="h-4 w-4 text-orange-600" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            </TableBody>
            <TableBody v-else-if="loading">
              <TableRow>
                <TableCell :colspan="4" class="text-center py-8">
                  <Loader2 class="h-6 w-6 animate-spin mx-auto" />
                </TableCell>
              </TableRow>
            </TableBody>
            <TableBody v-else>
              <TableRow>
                <TableCell
                  :colspan="4"
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

      <!-- Back Button -->
      <div class="flex justify-end mt-4">
        <Button variant="outline" :disabled="loading" @click="backToTenant">
          <ArrowLeft class="mr-2 h-4 w-4" />
          {{ $t("actions.back") }}
        </Button>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import {
  type CancelablePromise,
  DefaultService,
  type Tenant,
  type User,
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
import {
  Search,
  Plus,
  Loader2,
  Trash2,
  UserMinus,
  ArrowLeft,
} from "lucide-vue-next";
import BPagination from "../primitives/BPagination.vue";

const props = withDefaults(
  defineProps<{
    editTenantRouteName?: string;
    editUserRouteName?: string;
    newUserRouteName?: string;
  }>(),
  {
    editTenantRouteName: "super-admin-edit-tenant",
    editUserRouteName: "super-admin-edit-user",
    newUserRouteName: "super-admin-new-user",
  }
);

const { dialog } = useDialog();
const { t } = useI18n();
const route = useRoute();
const router = useRouter();
const { handleError } = useErrors();
const rows = ref<User[]>([]);
const loading = ref(false);
const { currentQuery, setQueryParam, pagination, goToPreviousPage } =
  useQueryParams();
const filter = ref("");

const columns = [
  {
    name: "name",
    align: "left",
    label: t("core.user.fields.name"),
    field: "name",
    sortable: true,
  },
  {
    name: "email",
    align: "left",
    label: t("core.user.fields.email"),
    field: "email",
    sortable: true,
  },
  {
    name: "roles",
    align: "left",
    label: t("core.user.fields.roles"),
    field: "roles",
    sortable: true,
  },
];

const tenant = ref<Tenant>();

const listService: ListService<User> = {
  listService(
    page: number,
    rowsPerPage: number,
    sortBy: string,
    order: "asc" | "desc",
    q?: string
  ): CancelablePromise<Array<User>> {
    return DefaultService.listUsersFromSuperAdmin(
      route.params.tenantid as string,
      page,
      rowsPerPage,
      sortBy,
      order,
      q
    );
  },
};

const { onRequest } = useListService<User>({
  listService,
  rows,
  pagination,
  loading,
  filter,
});

const backToTenant = () => {
  void router.push({
    name: props.editTenantRouteName,
    params: { id: route.params.tenantid },
  });
};

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
  onRequest({ getCellValue, pagination: pagination.value });
  void DefaultService.getTenantById(route.params.tenantid as string).then(
    (result) => {
      tenant.value = result;
    }
  );
});

const onRowSelect = (userID: string) => {
  void router.push({
    name: props.editUserRouteName,
    params: { tenantid: route.params.tenantid, id: userID },
    query: currentQuery.value,
  });
};
const onCreate = () => {
  void router.push({
    name: props.newUserRouteName,
    params: { tenantid: route.params.tenantid },
    query: currentQuery.value,
  });
};
const removeUserFromTenant = async (id: string, name: string) => {
  const confirmed = await dialog({
    message: `Remove ${name} from this tenant? They will lose access but their account will remain active in other tenants.`,
    cancel: t("actions.cancel"),
    ok: "Remove from Tenant",
  });

  if (!confirmed) return;

  DefaultService.removeUserFromTenantFromSuperAdmin(
    route.params.tenantid as string,
    id
  )
    .then(() => {
      onRequest({ pagination: pagination.value, getCellValue });
    })
    .catch((err: any) => {
      handleError(err);
    });
};

const deleteUser = async (id: string, name: string) => {
  const confirmed = await dialog({
    message: t("core.user.actions.delete.confirm", { name: name }),
    cancel: t("actions.cancel"),
    ok: t("actions.delete"),
  });

  if (!confirmed) return;

  DefaultService.deleteUserFromSuperAdmin(id, route.params.tenantid as string)
    .then(() => {
      onRequest({ pagination: pagination.value, getCellValue });
    })
    .catch((err: any) => {
      handleError(err);
    });
};
</script>
