<template>
  <div class="container mx-auto p-4 md:p-6">
    <div class="max-w-6xl space-y-6">
      <div>
        <h2 class="text-3xl font-bold tracking-tight">
          {{ t("core.activity.title") }}
        </h2>
        <p class="mt-1 text-muted-foreground">
          {{ t("core.activity.subtitle") }}
        </p>
      </div>

      <form
        class="grid gap-2 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_auto_auto_auto]"
        data-testid="audit-filters"
        @submit.prevent="search"
      >
        <Input
          v-model="kind"
          :placeholder="t('core.activity.kindPlaceholder')"
          :aria-label="t('core.activity.kind')"
          data-testid="audit-kind"
        />
        <Input
          v-model="action"
          :placeholder="t('core.activity.actionPlaceholder')"
          :aria-label="t('core.activity.action')"
          data-testid="audit-action"
        />
        <Input
          v-model="from"
          type="date"
          :aria-label="t('core.activity.from')"
          data-testid="audit-from"
        />
        <Input
          v-model="to"
          type="date"
          :aria-label="t('core.activity.to')"
          data-testid="audit-to"
        />
        <Button type="submit" variant="outline" data-testid="audit-search">
          {{ t("core.activity.search") }}
        </Button>
      </form>
      <p v-if="actor" class="flex items-center gap-2 text-sm">
        {{ t("core.activity.onlyPerson", { name: actor.name }) }}
        <Button
          variant="ghost"
          size="sm"
          data-testid="audit-clear-person"
          @click="byPerson(null)"
        >
          {{ t("core.activity.clear") }}
        </Button>
      </p>

      <Card class="border">
        <CardContent class="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{{ t("core.activity.when") }}</TableHead>
                <TableHead>{{ t("core.activity.who") }}</TableHead>
                <TableHead>{{ t("core.activity.how") }}</TableHead>
                <TableHead>{{ t("core.activity.what") }}</TableHead>
                <TableHead>{{ t("core.activity.on") }}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody v-if="rows.length > 0">
              <TableRow v-for="e in rows" :key="e.id" data-testid="audit-row">
                <TableCell class="whitespace-nowrap font-mono text-sm">
                  {{ when(e.occurredAt) }}
                </TableCell>
                <TableCell>
                  <button
                    v-if="e.actorId"
                    type="button"
                    class="text-left hover:underline"
                    :title="t('core.activity.onlyPersonHint')"
                    data-testid="audit-person"
                    @click="byPerson({ id: e.actorId, name: actorWords(e, t) })"
                  >
                    {{ actorWords(e, t) }}
                  </button>
                  <span v-else class="text-muted-foreground">{{
                    actorWords(e, t)
                  }}</span>
                </TableCell>
                <TableCell>
                  <Badge variant="outline">{{ viaWords(e.via, t) }}</Badge>
                </TableCell>
                <TableCell>{{ describeActivity(e, t, describe) }}</TableCell>
                <TableCell class="text-sm">
                  <RouterLink
                    v-if="targetLink?.(e.target)"
                    :to="targetLink(e.target)!"
                    class="hover:underline"
                  >
                    {{ e.target.kind }}
                  </RouterLink>
                  <span v-else class="text-muted-foreground">{{
                    e.target.kind
                  }}</span>
                </TableCell>
              </TableRow>
            </TableBody>
            <TableBody v-else>
              <TableRow>
                <TableCell
                  colspan="5"
                  class="py-8 text-center"
                  :class="failed ? 'text-error' : 'text-muted-foreground'"
                  :role="failed ? 'alert' : undefined"
                >
                  {{
                    loading
                      ? t("core.activity.loading")
                      : failed
                        ? t("core.activity.failed")
                        : t("core.activity.empty")
                  }}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div v-if="hasMore" class="flex justify-end">
        <Button
          variant="outline"
          size="sm"
          :disabled="loading"
          data-testid="audit-more"
          @click="load(true)"
        >
          {{ t("core.activity.more") }}
        </Button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { RouterLink, type RouteLocationRaw } from "vue-router";
import { useI18n } from "vue-i18n";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Card, CardContent } from "../ui/card";
import { Input } from "../ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import { DefaultService } from "../../openapi/core/services/DefaultService";
import type { ActivityEntry } from "../../openapi/core/models/ActivityEntry";
import type { ActivityRef } from "../../openapi/core/models/ActivityRef";
import {
  actorWords,
  describeActivity,
  viaWords,
  type DescribeActivity,
} from "../primitives/activity";

// Admin → Audit log (office#201): the tenant's activity of every kind. The
// app gives its own words (describe) and where a thing opens (targetLink).
defineProps<{
  describe?: DescribeActivity;
  targetLink?: (target: ActivityRef) => RouteLocationRaw | undefined;
}>();

const PAGE_SIZE = 50;
const { t, locale } = useI18n();

const rows = ref<ActivityEntry[]>([]);
const loading = ref(true);
const failed = ref(false);
const hasMore = ref(false);
const kind = ref("");
const action = ref("");
const from = ref("");
const to = ref("");
const actor = ref<{ id: string; name: string } | null>(null);

const format = computed(
  () =>
    new Intl.DateTimeFormat(locale.value, {
      dateStyle: "medium",
      timeStyle: "short",
    })
);
const when = (iso: string) => format.value.format(new Date(iso));

// A date input is a day in the reader's time zone: from its start, to the
// start of the next.
const dayStart = (d: string, plus = 0) => {
  if (!d) return undefined;
  const at = new Date(`${d}T00:00:00`);
  at.setDate(at.getDate() + plus);
  return at.toISOString();
};

async function load(more = false) {
  loading.value = true;
  failed.value = false;
  try {
    const page =
      (await DefaultService.listTenantActivity(
        kind.value.trim() || undefined,
        action.value.trim() || undefined,
        actor.value?.id,
        dayStart(from.value),
        dayStart(to.value, 1),
        more ? rows.value.at(-1)?.id : undefined,
        PAGE_SIZE
      )) ?? [];
    rows.value = more ? [...rows.value, ...page] : page;
    hasMore.value = page.length === PAGE_SIZE;
  } catch {
    if (!more) rows.value = [];
    failed.value = true;
  } finally {
    loading.value = false;
  }
}

function search() {
  void load();
}

function byPerson(p: { id: string; name: string } | null) {
  actor.value = p;
  void load();
}

onMounted(() => void load());
</script>
