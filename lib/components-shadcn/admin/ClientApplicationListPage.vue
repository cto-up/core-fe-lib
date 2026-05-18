<template>
  <div class="container mx-auto p-6">
    <div class="space-y-4">
      <!-- Header -->
      <div class="flex items-center justify-between">
        <div>
          <h2 class="text-3xl font-bold tracking-tight">
            {{ $t("core.clientApplication.home.title") }}
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
          <Button @click="$router.push(newClientAppPath)">
            <Plus class="h-4 w-4" />
            <span class="hidden sm:inline ml-2">{{
              $t("core.clientApplication.home.createLabel")
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
                <TableHead>
                  {{ $t("core.clientApplication.fields.name") }}
                </TableHead>
                <TableHead>
                  {{ $t("core.clientApplication.fields.description") }}
                </TableHead>
                <TableHead>
                  {{ $t("core.clientApplication.fields.active") }}
                </TableHead>
                <TableHead>
                  {{ $t("core.clientApplication.fields.lastUsed") }}
                </TableHead>
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
                <TableCell>{{ row.description }}</TableCell>
                <TableCell>
                  <Badge :variant="row.active ? 'default' : 'secondary'">
                    {{
                      row.active ? $t("status.active") : $t("status.inactive")
                    }}
                  </Badge>
                </TableCell>
                <TableCell>{{ row.last_used }}</TableCell>
                <TableCell class="text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    @click.stop="
                      (event: MouseEvent) =>
                        $router.push(
                          `${manageTokensPathPrefix}/${row.id}/tokens`
                        )
                    "
                  >
                    <Key class="h-4 w-4" />
                    <span class="ml-1">{{ $t("core.apiToken.manage") }}</span>
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    @click.stop="
                      (event: MouseEvent) =>
                        deleteClientApplication(row.id, row.name)
                    "
                  >
                    <Trash2 class="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            </TableBody>
            <TableBody v-else-if="loading">
              <TableRow>
                <TableCell :colspan="5" class="text-center py-8">
                  <Loader2 class="h-6 w-6 animate-spin mx-auto" />
                </TableCell>
              </TableRow>
            </TableBody>
            <TableBody v-else>
              <TableRow>
                <TableCell
                  :colspan="5"
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
  type ClientApplication,
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
import { Search, Plus, Loader2, Trash2, Key } from "lucide-vue-next";
import BPagination from "../primitives/BPagination.vue";

const props = withDefaults(
  defineProps<{
    newClientAppPath?: string;
    manageTokensPathPrefix?: string;
    editClientAppRouteName?: string;
  }>(),
  {
    newClientAppPath: "/token/client-applications/new",
    manageTokensPathPrefix: "/token/client-applications",
    editClientAppRouteName: "edit-client-application",
  }
);

const { dialog } = useDialog();
const { t } = useI18n();
const route = useRoute();
const router = useRouter();
const { handleError } = useErrors();

const rows = ref<ClientApplication[]>([]);
const loading = ref(false);
const { currentQuery, setQueryParam, pagination, goToPreviousPage } =
  useQueryParams();
const filter = ref("");

const columns = [
  {
    name: "name",
    align: "left",
    label: t("core.clientApplication.fields.name"),
    field: "name",
    sortable: true,
  },
  {
    name: "description",
    align: "left",
    label: t("core.clientApplication.fields.description"),
    field: "description",
    sortable: true,
  },
  {
    name: "active",
    align: "left",
    label: t("core.clientApplication.fields.active"),
    field: "active",
    sortable: true,
  },
  {
    name: "last_used",
    align: "left",
    label: t("core.clientApplication.fields.lastUsed"),
    field: "last_used",
    sortable: true,
  },
];

const listService: ListService<ClientApplication> = {
  listService(
    page: number,
    rowsPerPage: number,
    sortBy: string,
    order: "asc" | "desc",
    q?: string
  ): CancelablePromise<Array<ClientApplication>> {
    return DefaultService.listClientApplications(
      page,
      rowsPerPage,
      sortBy,
      order,
      q
    );
  },
};

const { onRequest } = useListService<ClientApplication>({
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

const onRowSelect = (clientApplicationID: string) => {
  void router.push({
    name: props.editClientAppRouteName,
    params: { id: clientApplicationID },
    query: currentQuery.value,
  });
};

const deleteClientApplication = async (id: string, name: string) => {
  const confirmed = await dialog({
    message: t("core.clientApplication.actions.delete.confirm", {
      name: name,
    }),
    cancel: t("actions.cancel"),
    ok: t("actions.delete"),
  });

  if (!confirmed) return;

  DefaultService.deleteClientApplication(id)
    .then(() => {
      onRequest({ pagination: pagination.value, getCellValue });
    })
    .catch((err: any) => {
      handleError(err);
    });
};
</script>
