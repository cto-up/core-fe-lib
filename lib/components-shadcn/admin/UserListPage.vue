<template>
  <div class="container mx-auto p-6">
    <div class="space-y-4">
      <!-- Header -->
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
          <Button @click="$router.push(newUserPath)">
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
                <TableHead>{{ t("core.user.fields.status") }}</TableHead>
                <TableHead>{{ t("core.user.fields.lastSignIn") }}</TableHead>
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
                <TableCell>
                  <span class="inline-flex items-center gap-1.5">
                    {{ row.email }}
                    <MailWarning
                      v-if="row.email_verified === false"
                      class="h-3.5 w-3.5 shrink-0 text-muted-foreground/60"
                      :aria-label="t('core.user.status.unverified')"
                      :title="t('core.user.status.emailUnverified')"
                    />
                  </span>
                </TableCell>
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
                <TableCell>
                  <Badge :variant="statusOf(row).variant">
                    {{ statusOf(row).label }}
                  </Badge>
                </TableCell>
                <TableCell
                  class="font-mono text-xs text-muted-foreground/70"
                  :title="lastConnectedTitle(row)"
                >
                  {{ lastConnectedLabel(row) }}
                </TableCell>
                <TableCell class="text-right">
                  <div class="flex items-center justify-end gap-1">
                    <Button
                      v-if="isTenantSubdomain()"
                      variant="ghost"
                      size="sm"
                      :title="'Remove from Tenant'"
                      @click.stop="removeUserFromTenant(row.id, row.name)"
                    >
                      <UserMinus class="h-4 w-4 text-orange-600" />
                    </Button>
                    <Button
                      v-else
                      variant="ghost"
                      size="sm"
                      :title="'Delete User'"
                      @click.stop="deleteUser(row.id, row.name)"
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
import BPagination from "../primitives/BPagination.vue";
import {
  Search,
  Plus,
  Trash2,
  UserMinus,
  Loader2,
  MailWarning,
} from "lucide-vue-next";
import { useUrl } from "../../composables/useUrl";

const { isTenantSubdomain } = useUrl();
const { dialog } = useDialog();
const { t, locale } = useI18n();
const props = withDefaults(
  defineProps<{
    newUserPath?: string;
    editUserRouteName?: string;
  }>(),
  {
    newUserPath: "/users/new",
    editUserRouteName: "edit-user",
  }
);

const route = useRoute();
const router = useRouter();
const { handleError } = useErrors();
const rows = ref<User[]>([]);
const loading = ref(false);
const { currentQuery, setQueryParam, pagination, goToPreviousPage } =
  useQueryParams();
const filter = ref("");

const listService: ListService<User> = {
  listService(
    page: number,
    rowsPerPage: number,
    sortBy: string,
    order: "asc" | "desc",
    q?: string
  ): CancelablePromise<Array<User>> {
    return DefaultService.listUsers(page, rowsPerPage, sortBy, order, q);
  },
};

const { onRequest } = useListService<User>({
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
    onRequest({ getCellValue, pagination: pagination.value });
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

type StatusVariant = "default" | "secondary" | "outline" | "destructive";

// Status answers one question: can this person use the account. Two
// independent facts feed it — whether the membership is live in this tenant,
// and whether the identity itself is usable at the auth provider — and the
// membership answer wins, since a suspended member cannot get in regardless of
// what Kratos thinks of their identity.
//
// Email verification is deliberately NOT in this chain. It gates nothing here:
// unverified users sign in normally, and most never complete the flow, so
// folding it in outranked "suspended" and painted every row the same word. It
// rides beside the email instead.
const statusOf = (user: User): { label: string; variant: StatusVariant } => {
  const membership = user.membership_status ?? "active";
  if (membership !== "active") {
    return {
      label: t(`core.user.status.${membership}`, membership),
      variant: membership === "pending" ? "secondary" : "destructive",
    };
  }
  if (user.auth_state === "inactive") {
    return { label: t("core.user.status.inactive"), variant: "destructive" };
  }
  if (!user.auth_state) {
    return { label: t("core.user.status.unknown"), variant: "outline" };
  }
  return { label: t("core.user.status.active"), variant: "outline" };
};

const RELATIVE_UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
  ["year", 365 * 24 * 3600_000],
  ["month", 30 * 24 * 3600_000],
  ["week", 7 * 24 * 3600_000],
  ["day", 24 * 3600_000],
  ["hour", 3600_000],
  ["minute", 60_000],
];

// Kratos records authenticated_at — when credentials were last entered — and
// nothing that moves when a page is loaded. With a 30-day session lifespan a
// signed-in user routinely shows a date weeks old, which is why this column is
// "Last sign-in" and not "Last connected". Real last-activity would have to be
// stamped on our side, on every request.
const lastConnectedLabel = (user: User): string => {
  if (!user.last_authenticated_at) return t("core.user.status.never");
  const then = new Date(user.last_authenticated_at).getTime();
  if (Number.isNaN(then)) return t("core.user.status.never");

  const elapsed = then - Date.now();
  const rtf = new Intl.RelativeTimeFormat(locale.value, { numeric: "auto" });
  for (const [unit, ms] of RELATIVE_UNITS) {
    if (Math.abs(elapsed) >= ms) {
      return rtf.format(Math.round(elapsed / ms), unit);
    }
  }
  return rtf.format(Math.round(elapsed / 1000), "second");
};

const lastConnectedTitle = (user: User): string =>
  user.last_authenticated_at
    ? t("core.user.status.signedInAt", {
        at: new Date(user.last_authenticated_at).toLocaleString(locale.value),
      })
    : t("core.user.status.noSessionOnRecord");

const onRowSelect = async (userID: string) => {
  await router.push({
    name: props.editUserRouteName,
    params: { id: userID },
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

  DefaultService.removeUserFromTenant(id)
    .then(() => {
      onRequest({ pagination: pagination.value, getCellValue });
    })
    .catch((err) => {
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

  DefaultService.deleteUser(id)
    .then(() => {
      onRequest({ pagination: pagination.value, getCellValue });
    })
    .catch((err) => {
      handleError(err);
    });
};
</script>
