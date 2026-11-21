<template>
  <div class="space-y-2" data-testid="activity-list">
    <ul v-if="rows.length" class="divide-y">
      <li
        v-for="e in rows"
        :key="e.id"
        class="py-2 text-sm"
        data-testid="activity-item"
      >
        <p>{{ describeActivity(e, t, describe) }}</p>
        <p class="text-xs text-muted-foreground">
          {{ actorWords(e, t) }} · {{ viaWords(e.via, t) }} ·
          <time class="font-mono" :datetime="e.occurredAt">{{
            when(e.occurredAt)
          }}</time>
        </p>
      </li>
    </ul>
    <p
      v-else
      class="py-2 text-sm"
      :class="failed ? 'text-error' : 'text-muted-foreground'"
      :role="failed ? 'alert' : undefined"
      data-testid="activity-empty"
    >
      {{
        loading
          ? t("core.activity.loading")
          : failed
            ? t("core.activity.failed")
            : t("core.activity.empty")
      }}
    </p>
    <Button
      v-if="hasMore"
      variant="outline"
      size="sm"
      :disabled="loading"
      data-testid="activity-more"
      @click="load(true)"
    >
      {{ t("core.activity.more") }}
    </Button>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import { Button } from "../ui/button";
import { DefaultService } from "../../openapi/core/services/DefaultService";
import type { ActivityEntry } from "../../openapi/core/models/ActivityEntry";
import type { ActivityRef } from "../../openapi/core/models/ActivityRef";
import {
  actorWords,
  describeActivity,
  viaWords,
  type DescribeActivity,
} from "./activity";

// One thing's history, or one scope's (office#201): the rows the caller may
// read, newest first, in the app's words when it gives describe.
const props = withDefaults(
  defineProps<{
    target?: ActivityRef;
    scope?: ActivityRef;
    describe?: DescribeActivity;
    pageSize?: number;
  }>(),
  { target: undefined, scope: undefined, describe: undefined, pageSize: 20 }
);
const { t, locale } = useI18n();

const rows = ref<ActivityEntry[]>([]);
const loading = ref(false);
const failed = ref(false);
const hasMore = ref(false);

const format = computed(
  () =>
    new Intl.DateTimeFormat(locale.value, {
      dateStyle: "medium",
      timeStyle: "short",
    })
);
const when = (iso: string) => format.value.format(new Date(iso));

async function load(more = false) {
  loading.value = true;
  failed.value = false;
  try {
    const before = more ? rows.value.at(-1)?.id : undefined;
    const page =
      (await DefaultService.listActivity(
        props.target?.kind,
        props.target?.id,
        props.scope?.kind,
        props.scope?.id,
        before,
        props.pageSize
      )) ?? [];
    rows.value = more ? [...rows.value, ...page] : page;
    hasMore.value = page.length === props.pageSize;
  } catch {
    if (!more) rows.value = [];
    failed.value = true;
  } finally {
    loading.value = false;
  }
}

watch(
  () => [
    props.target?.kind,
    props.target?.id,
    props.scope?.kind,
    props.scope?.id,
  ],
  () => void load(),
  { immediate: true }
);

defineExpose({ reload: () => load() });
</script>
