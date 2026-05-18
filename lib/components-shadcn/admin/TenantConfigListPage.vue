<template>
  <div class="container mx-auto p-6">
    <div class="space-y-4">
      <!-- Header -->
      <div class="flex items-center justify-between">
        <div>
          <h2 class="text-3xl font-bold tracking-tight">
            {{ $t("core.tenantConfig.home.title") }}
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
          <Button @click="$router.push({ name: newRouteName })">
            <Plus class="h-4 w-4" />
            <span class="hidden sm:inline ml-2">{{
              $t("core.tenantConfig.home.createLabel")
            }}</span>
          </Button>
        </div>
      </div>

      <!-- Set configs table -->
      <Card>
        <CardContent class="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{{ $t("core.tenantConfig.fields.name") }}</TableHead>
                <TableHead>
                  {{ $t("core.tenantConfig.fields.value") }}
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
                  <div class="flex items-center gap-2">
                    <span>{{ row.name }}</span>
                    <Badge
                      v-if="getSchemaEntry(row.name)"
                      variant="secondary"
                      class="text-xs font-mono hidden sm:inline-flex"
                    >
                      {{ getSchemaEntry(row.name)!.type }}
                    </Badge>
                  </div>
                  <p
                    v-if="getSchemaEntry(row.name)"
                    class="text-xs text-muted-foreground mt-0.5"
                  >
                    {{ getSchemaEntry(row.name)!.description }}
                  </p>
                </TableCell>
                <TableCell>
                  <!-- Boolean inline toggle -->
                  <Switch
                    v-if="getSchemaEntry(row.name)?.type === 'boolean'"
                    :checked="row.value === 'true'"
                    @update:checked="(v) => updateBooleanConfig(row, v)"
                    @click.stop
                  />
                  <code
                    v-else-if="row.value"
                    class="text-sm font-mono bg-muted px-1.5 py-0.5 rounded"
                    >{{ row.value }}</code
                  >
                  <span v-else class="text-muted-foreground text-sm">—</span>
                </TableCell>
                <TableCell class="text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    @click.stop="deleteConfig(row.id, row.name)"
                  >
                    <Trash2 class="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            </TableBody>
            <TableBody v-else-if="loading">
              <TableRow>
                <TableCell :colspan="3" class="text-center py-8">
                  <Loader2 class="h-6 w-6 animate-spin mx-auto" />
                </TableCell>
              </TableRow>
            </TableBody>
            <TableBody v-else>
              <TableRow>
                <TableCell
                  :colspan="3"
                  class="text-center py-8 text-muted-foreground"
                >
                  No configurations set yet
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

      <!-- Suggested / unset schema entries -->
      <Collapsible v-model:open="suggestionsOpen">
        <div class="flex items-center justify-between">
          <h3
            class="text-sm font-medium text-muted-foreground flex items-center gap-2"
          >
            <Lightbulb class="h-4 w-4" />
            Available configurations
            <Badge variant="outline" class="text-xs">
              {{ unsetSchemaEntries.length }} unset
            </Badge>
          </h3>
          <CollapsibleTrigger as-child>
            <Button variant="ghost" size="sm">
              <ChevronsUpDown class="h-4 w-4" />
            </Button>
          </CollapsibleTrigger>
        </div>

        <CollapsibleContent>
          <div class="mt-3 space-y-4">
            <div
              v-for="category in unsetCategories"
              :key="category"
              class="space-y-1"
            >
              <p
                class="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1"
              >
                {{ category }}
              </p>
              <Card class="border-dashed">
                <CardContent class="p-0">
                  <Table>
                    <TableBody>
                      <TableRow
                        v-for="entry in unsetByCategory(category)"
                        :key="entry.key"
                        class="cursor-pointer hover:bg-muted/30 opacity-70 hover:opacity-100 transition-opacity"
                        @click="addFromSchema(entry.key)"
                      >
                        <TableCell
                          class="font-mono text-sm text-muted-foreground w-[40%]"
                        >
                          {{ entry.key }}
                        </TableCell>
                        <TableCell class="text-sm text-muted-foreground">
                          <span>{{ entry.description }}</span>
                          <span
                            v-if="entry.defaultValue !== undefined"
                            class="ml-2 text-xs"
                          >
                            (default:
                            <code class="font-mono bg-muted px-1 rounded">{{
                              entry.defaultValue
                            }}</code
                            >)
                          </span>
                        </TableCell>
                        <TableCell class="text-right w-[10%]">
                          <div class="flex items-center justify-end gap-2">
                            <Badge
                              variant="outline"
                              class="text-xs font-mono hidden sm:inline-flex"
                            >
                              {{ entry.type }}
                            </Badge>
                            <Plus class="h-3.5 w-3.5 text-muted-foreground" />
                          </div>
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  </div>
</template>

<script lang="ts" setup>
import {
  type CancelablePromise,
  DefaultService,
  type Config,
} from "../../openapi/core";
import { computed, onMounted, ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import { useRoute, useRouter } from "vue-router";
import useListService, {
  getCellValue,
  type ListService,
} from "../composables/useListService";
import { useQueryParams } from "../../composables/useQueryParams";
import { useErrors } from "../composables/useErrors";
import { useDialog } from "../composables/useDialog";
import {
  type TenantConfigSchemaEntry,
  buildSchemaMap,
  extractCategories,
} from "../composables/configSchemaTypes";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Badge } from "../ui/badge";
import { Card, CardContent } from "../ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "../ui/collapsible";
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
  Lightbulb,
  ChevronsUpDown,
} from "lucide-vue-next";
import { Switch } from "../ui/switch";
import BPagination from "../primitives/BPagination.vue";

const props = withDefaults(
  defineProps<{
    schema?: TenantConfigSchemaEntry[];
    newRouteName?: string;
    editRouteName?: string;
  }>(),
  {
    schema: () => [],
    newRouteName: "new-tenant-config",
    editRouteName: "edit-tenant-config",
  }
);

const schemaMap = computed(() => buildSchemaMap(props.schema));
const getSchemaEntry = (key: string) => schemaMap.value.get(key);

const { dialog } = useDialog();
const { t } = useI18n();
const route = useRoute();
const router = useRouter();
const { handleError } = useErrors();

const rows = ref<Config[]>([]);
const loading = ref(false);
const { currentQuery, setQueryParam, pagination } = useQueryParams();
const filter = ref("");
const suggestionsOpen = ref(false);
const allConfigNames = ref<Set<string>>(new Set());

const listService: ListService<Config> = {
  listService(
    page: number,
    rowsPerPage: number,
    sortBy: string,
    order: "asc" | "desc",
    q?: string
  ): CancelablePromise<Array<Config>> {
    return DefaultService.listTenantConfigs(
      page,
      rowsPerPage,
      sortBy,
      order,
      q
    );
  },
};

const { onRequest } = useListService<Config>({
  listService,
  rows,
  pagination,
  loading,
  filter,
});

const unsetSchemaEntries = computed<TenantConfigSchemaEntry[]>(() =>
  props.schema.filter((e) => !allConfigNames.value.has(e.key))
);

const unsetCategories = computed(() =>
  extractCategories(props.schema).filter((cat) =>
    unsetSchemaEntries.value.some((e) => e.category === cat)
  )
);

const unsetByCategory = (category: string) =>
  unsetSchemaEntries.value.filter((e) => e.category === category);

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

onMounted(async () => {
  filter.value = (route.query.filter as string) || "";
  onRequest({
    getCellValue,
    pagination: pagination.value,
    filter: filter.value,
  });

  // Load all config names to compute unset schema entries
  try {
    const all = await DefaultService.listTenantConfigs(1, 1000, "name", "asc");
    allConfigNames.value = new Set(all.map((c) => c.name));
  } catch {
    // non-critical — suggestions section is best-effort
  }
});

const onRowSelect = (tenantConfigID: string) => {
  void router.push({
    name: props.editRouteName,
    params: { id: tenantConfigID },
    query: currentQuery.value,
  });
};

const addFromSchema = (key: string) => {
  void router.push({
    name: props.newRouteName,
    query: { ...currentQuery.value, name: key },
  });
};

const updateBooleanConfig = async (row: Config, enabled: boolean) => {
  const newValue = enabled ? "true" : "false";
  try {
    await DefaultService.updateTenantConfig(row.id, {
      ...row,
      value: newValue,
    });
    row.value = newValue;
  } catch (e) {
    handleError(e);
  }
};

const deleteConfig = async (id: string, name: string) => {
  const confirmed = await dialog({
    message: t("core.tenantConfig.actions.delete.confirm", { name: name }),
    cancel: t("actions.cancel"),
    ok: t("actions.delete"),
  });

  if (!confirmed) return;

  DefaultService.deleteTenantConfig(id)
    .then(() => {
      onRequest({ pagination: pagination.value, getCellValue });
      allConfigNames.value.delete(name);
    })
    .catch((err) => {
      handleError(err);
    });
};
</script>
