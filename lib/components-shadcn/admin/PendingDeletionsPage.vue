<template>
  <div class="container mx-auto p-4 md:p-6">
    <div class="max-w-5xl space-y-6">
      <div>
        <h2 class="text-3xl font-bold tracking-tight">
          {{ $t("core.pendingDeletions.title") }}
        </h2>
        <p class="mt-1 text-muted-foreground">
          {{ $t("core.pendingDeletions.subtitle") }}
        </p>
      </div>

      <Card>
        <CardContent class="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{{ $t("core.pendingDeletions.account") }}</TableHead>
                <TableHead>{{ $t("core.pendingDeletions.stage") }}</TableHead>
                <TableHead>{{ $t("core.pendingDeletions.since") }}</TableHead>
                <TableHead>{{ $t("core.pendingDeletions.deletesOn") }}</TableHead>
                <TableHead v-if="showTenants">
                  {{ $t("core.pendingDeletions.tenants") }}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody v-if="rows.length > 0">
              <TableRow
                v-for="row in rows"
                :key="row.userId"
                data-testid="pending-deletion-row"
              >
                <TableCell>
                  <div class="font-medium">{{ row.name || row.email }}</div>
                  <div v-if="row.name" class="text-sm text-muted-foreground">
                    {{ row.email }}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge :variant="isWarned(row) ? 'warning' : 'destructive'">
                    {{ stageLabel(row) }}
                  </Badge>
                  <div
                    v-if="holderReason(row)"
                    class="mt-1 text-sm text-muted-foreground"
                  >
                    {{ holderReason(row) }}
                  </div>
                </TableCell>
                <TableCell class="whitespace-nowrap font-mono text-sm">
                  {{
                    isWarned(row)
                      ? $t("core.pendingDeletions.warnedOn", {
                          date: formatDate(row.warnedAt),
                        })
                      : $t("core.pendingDeletions.requestedOn", {
                          date: formatDate(row.requestedAt),
                        })
                  }}
                </TableCell>
                <TableCell>
                  <div class="whitespace-nowrap font-mono text-sm font-medium">
                    {{ formatDate(row.deletesOn) }}
                  </div>
                  <div
                    v-if="isWarned(row)"
                    class="text-sm text-muted-foreground"
                  >
                    {{ $t("core.pendingDeletions.unlessSignIn") }}
                  </div>
                </TableCell>
                <TableCell v-if="showTenants">
                  {{ row.tenants.join(", ") }}
                </TableCell>
              </TableRow>
            </TableBody>
            <TableBody v-else>
              <TableRow>
                <TableCell
                  :colspan="showTenants ? 5 : 4"
                  class="py-8 text-center"
                  :class="failed ? 'text-error' : 'text-muted-foreground'"
                  :role="failed ? 'alert' : undefined"
                >
                  {{
                    loading
                      ? $t("core.pendingDeletions.loading")
                      : failed
                        ? $t("core.pendingDeletions.failed")
                        : $t("core.pendingDeletions.empty")
                  }}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue";
import { useI18n } from "vue-i18n";
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
import { DefaultService } from "../../openapi/core/services/DefaultService";
import { PendingDeletion } from "../../openapi/core/models/PendingDeletion";
import { Role } from "../../openapi/core/models/Role";
import { useUserStore } from "../../stores/user-store";

// Read-only (ctoup/gordon#96): the lifecycle itself is the member's to change.
const INACTIVITY_REASON = "inactivity";
const MAX_ROWS = 100;

const { t, locale } = useI18n();
const userStore = useUserStore();

const rows = ref<PendingDeletion[]>([]);
const loading = ref(true);
const failed = ref(false);
// An admin's rows only ever name their own tenant.
const showTenants = userStore.hasPrivilege(Role.SUPER_ADMIN);

const isWarned = (row: PendingDeletion) =>
  row.stage === PendingDeletion.stage.INACTIVITY_WARNED;

function stageLabel(row: PendingDeletion): string {
  if (isWarned(row)) {
    return row.lastSeenAt
      ? t("core.pendingDeletions.inactiveSince", {
          date: formatDate(row.lastSeenAt),
        })
      : t("core.pendingDeletions.inactive");
  }
  return row.reason === INACTIVITY_REASON
    ? t("core.pendingDeletions.closedForInactivity")
    : t("core.pendingDeletions.closureRequested");
}

const holderReason = (row: PendingDeletion) =>
  !isWarned(row) && row.reason !== INACTIVITY_REASON ? row.reason : null;

function formatDate(value?: string | null): string {
  if (!value) return "—";
  return new Date(value).toLocaleDateString(locale.value, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

onMounted(async () => {
  try {
    rows.value = await DefaultService.listPendingDeletions(1, MAX_ROWS);
  } catch {
    failed.value = true;
  } finally {
    loading.value = false;
  }
});
</script>
