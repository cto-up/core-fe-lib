<template>
  <div class="container mx-auto p-4 md:p-6">
    <div class="max-w-5xl space-y-6">
      <div>
        <h2 class="text-3xl font-bold tracking-tight">
          {{ $t("core.emailActivity.title") }}
        </h2>
        <p class="mt-1 text-muted-foreground">
          {{ $t("core.emailActivity.subtitle") }}
        </p>
      </div>

      <form
        class="flex flex-col gap-2 sm:flex-row sm:items-center"
        @submit.prevent="search"
      >
        <Select v-model="statusFilter" @update:model-value="search">
          <SelectTrigger
            class="sm:w-48"
            data-testid="email-activity-status"
            :aria-label="$t('core.emailActivity.status')"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem :value="ALL">
              {{ $t("core.emailActivity.allStatuses") }}
            </SelectItem>
            <SelectItem v-for="s in STATUSES" :key="s" :value="s">
              {{ $t(`core.emailActivity.statuses.${s}`) }}
            </SelectItem>
          </SelectContent>
        </Select>
        <div class="relative flex-1">
          <Search
            class="pointer-events-none absolute left-3 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            v-model="address"
            type="email"
            autocomplete="off"
            data-testid="email-activity-address"
            class="pl-9"
            :placeholder="$t('core.emailActivity.addressPlaceholder')"
            :aria-label="$t('core.emailActivity.addressPlaceholder')"
          />
        </div>
        <Button type="submit" variant="outline">
          {{ $t("core.emailActivity.search") }}
        </Button>
      </form>

      <Card class="border">
        <CardContent class="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{{ $t("core.emailActivity.sentAt") }}</TableHead>
                <TableHead>{{ $t("core.emailActivity.kind") }}</TableHead>
                <TableHead>{{ $t("core.emailActivity.recipient") }}</TableHead>
                <TableHead>{{ $t("core.emailActivity.status") }}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody v-if="rows.length > 0">
              <TableRow
                v-for="row in rows"
                :key="row.id"
                clickable
                data-testid="email-activity-row"
                @activate="selected = row"
              >
                <TableCell class="whitespace-nowrap font-mono text-sm">
                  {{ formatDateTime(row.createdAt) }}
                </TableCell>
                <TableCell>{{ kindLabel(row.kind) }}</TableCell>
                <TableCell class="font-mono text-sm">
                  {{ row.recipientMasked }}
                  <span
                    v-if="row.recipientRole !== 'to'"
                    class="ml-1 text-xs uppercase text-muted-foreground/70"
                  >
                    {{ row.recipientRole }}
                  </span>
                </TableCell>
                <TableCell>
                  <Badge :variant="statusVariant(row.status)">
                    {{ $t(`core.emailActivity.statuses.${row.status}`) }}
                  </Badge>
                </TableCell>
              </TableRow>
            </TableBody>
            <TableBody v-else>
              <TableRow>
                <TableCell
                  colspan="4"
                  class="py-8 text-center"
                  :class="failed ? 'text-error' : 'text-muted-foreground'"
                  :role="failed ? 'alert' : undefined"
                >
                  {{
                    loading
                      ? $t("core.emailActivity.loading")
                      : failed
                        ? $t("core.emailActivity.failed")
                        : $t("core.emailActivity.empty")
                  }}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div v-if="page > 1 || hasMore" class="flex justify-end gap-2">
        <Button
          variant="outline"
          size="sm"
          :disabled="page <= 1 || loading"
          @click="goTo(page - 1)"
        >
          {{ $t("core.emailActivity.previous") }}
        </Button>
        <Button
          variant="outline"
          size="sm"
          :disabled="!hasMore || loading"
          @click="goTo(page + 1)"
        >
          {{ $t("core.emailActivity.next") }}
        </Button>
      </div>
    </div>

    <Sheet
      :open="selected !== null"
      @update:open="(open) => !open && (selected = null)"
    >
      <SheetContent data-testid="email-activity-detail">
        <SheetHeader>
          <SheetTitle>{{ selected && kindLabel(selected.kind) }}</SheetTitle>
          <SheetDescription>
            {{ selected && formatDateTime(selected.createdAt) }}
          </SheetDescription>
        </SheetHeader>
        <dl v-if="selected" class="mt-6 space-y-4 text-sm">
          <div v-for="field in detail(selected)" :key="field.label">
            <dt class="text-muted-foreground">{{ field.label }}</dt>
            <dd class="mt-0.5 break-all font-mono">{{ field.value }}</dd>
          </div>
          <div v-if="originTarget(selected)">
            <dt class="text-muted-foreground">
              {{ $t("core.emailActivity.origin") }}
            </dt>
            <dd class="mt-0.5">
              <RouterLink
                :to="originTarget(selected)!"
                class="font-medium text-primary underline-offset-4 hover:underline"
              >
                {{ $t(`core.emailActivity.origins.${selected.originType}`) }}
              </RouterLink>
            </dd>
          </div>
        </dl>
        <p class="mt-6 text-sm text-muted-foreground">
          {{ $t("core.emailActivity.acceptedMeans") }}
        </p>
      </SheetContent>
    </Sheet>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue";
import { RouterLink, type RouteLocationRaw } from "vue-router";
import { useI18n } from "vue-i18n";
import { Search } from "lucide-vue-next";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Card, CardContent } from "../ui/card";
import { Input } from "../ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "../ui/sheet";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import { DefaultService } from "../../openapi/core/services/DefaultService";
import type { EmailDelivery } from "../../openapi/core/models/EmailDelivery";
import { EmailDeliveryStatus } from "../../openapi/core/models/EmailDeliveryStatus";

const props = defineProps<{
  // Where the run that sent a mail is shown; the consumer owns those routes.
  originLink?: (
    originType: string,
    originId: string
  ) => RouteLocationRaw | undefined;
}>();

// radix-vue's Select cannot hold an empty-string value.
const ALL = "__all__";
const STATUSES = Object.values(EmailDeliveryStatus);
const PAGE_SIZE = 50;

const { t, te, locale } = useI18n();

const rows = ref<EmailDelivery[]>([]);
const loading = ref(true);
const failed = ref(false);
const page = ref(1);
const hasMore = ref(false);
const statusFilter = ref<string>(ALL);
const address = ref("");
const selected = ref<EmailDelivery | null>(null);

async function load() {
  loading.value = true;
  failed.value = false;
  try {
    const status =
      statusFilter.value === ALL
        ? undefined
        : (statusFilter.value as EmailDeliveryStatus);
    const result = await DefaultService.listEmailDeliveries(
      status,
      undefined,
      undefined,
      undefined,
      address.value.trim() || undefined,
      page.value,
      PAGE_SIZE
    );
    rows.value = result ?? [];
    hasMore.value = rows.value.length === PAGE_SIZE;
  } catch {
    rows.value = [];
    failed.value = true;
  } finally {
    loading.value = false;
  }
}

function search() {
  page.value = 1;
  void load();
}

function goTo(next: number) {
  page.value = next;
  void load();
}

function kindLabel(kind: string): string {
  const key = `core.emailActivity.kinds.${kind.replace(/\./g, "_")}`;
  return te(key) ? t(key) : kind;
}

function statusVariant(status: EmailDeliveryStatus) {
  if (status === "accepted") return "success";
  if (status === "rejected") return "warning";
  return "error";
}

function originTarget(row: EmailDelivery): RouteLocationRaw | undefined {
  if (!row.originType || !row.originId) return undefined;
  return props.originLink?.(row.originType, row.originId);
}

function detail(row: EmailDelivery) {
  const fields = [
    { label: t("core.emailActivity.recipient"), value: row.recipientMasked },
    {
      label: t("core.emailActivity.account"),
      value:
        row.account === "system"
          ? t("core.emailActivity.systemAccount")
          : row.account,
    },
  ];
  if (row.smtpCode)
    fields.push({
      label: t("core.emailActivity.smtpCode"),
      value: String(row.smtpCode),
    });
  if (row.errorClass)
    fields.push({
      label: t("core.emailActivity.errorClass"),
      value: te(`core.emailActivity.errors.${row.errorClass}`)
        ? t(`core.emailActivity.errors.${row.errorClass}`)
        : row.errorClass,
    });
  if (row.messageId)
    fields.push({
      label: t("core.emailActivity.messageId"),
      value: row.messageId,
    });
  return fields;
}

function formatDateTime(value: string): string {
  return new Date(value).toLocaleString(locale.value, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

onMounted(load);
</script>
