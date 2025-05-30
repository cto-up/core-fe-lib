<template>
  <q-page padding>
    <div class="row q-col-gutter-md">
      <h2>Migration: {{ module }}</h2>
      <div class="col-12">
        <q-card>
          <q-card-section>
            <div class="text-h6">
              {{ t(`layout.navigation.migration.title`) }}
            </div>
            <div class="text-subtitle2">
              {{ t(`layout.navigation.migration.caption`) }}
            </div>
          </q-card-section>
          <q-card-section class="row q-col-gutter-md">
            <div class="col-12 col-md-6">
              <q-card>
                <q-card-section>
                  <div class="text-h6">
                    {{ t(`layout.navigation.migration.up.title`) }}
                  </div>
                  <div class="text-subtitle2">
                    {{ t(`layout.navigation.migration.up.caption`) }}
                  </div>
                </q-card-section>
                <q-card-section>
                  <b-btn
                    color="primary"
                    :loading="loadingUp"
                    :disable="loadingUp || loadingDown"
                    @click="migrateUp"
                    icon="arrow_upward"
                    :label="t(`layout.navigation.migration.up.action`)"
                  />
                </q-card-section>
              </q-card>
            </div>

            <div class="col-12 col-md-6">
              <q-card>
                <q-card-section>
                  <div class="text-h6">
                    {{ t(`layout.navigation.migration.down.title`) }}
                  </div>
                  <div class="text-subtitle2">
                    {{ t(`layout.navigation.migration.down.caption`) }}
                  </div>
                </q-card-section>
                <q-card-section>
                  <b-btn
                    color="secondary"
                    :loading="loadingDown"
                    :disable="loadingUp || loadingDown"
                    @click="confirmMigrateDown"
                    icon="arrow_downward"
                    :label="t(`layout.navigation.migration.down.action`)"
                  />
                </q-card-section>
              </q-card>
            </div>
          </q-card-section>
        </q-card>
      </div>
    </div>
  </q-page>
</template>

<script lang="ts" setup>
import { ref } from "vue";
import { useI18n } from "vue-i18n";
import { useQuasar } from "quasar";

const props = defineProps({
  module: {
    type: String,
    required: true,
  },
  migrateUpFn: {
    type: Function,
    required: true,
  },
  migrateDownFn: {
    type: Function,
    required: true,
  },
});

const { t } = useI18n();
const $q = useQuasar();
const loadingUp = ref(false);
const loadingDown = ref(false);

async function migrateUp() {
  loadingUp.value = true;
  try {
    await props.migrateUpFn();
    $q.notify({
      type: "positive",
      message: t(`layout.navigation.${props.module}.migration.up.success`),
    });
  } catch (error) {
    console.error(`Failed to migrate up (${props.module}):`, error);
    $q.notify({
      type: "negative",
      message: t(`layout.navigation.${props.module}.migration.up.error`),
    });
  } finally {
    loadingUp.value = false;
  }
}

async function migrateDown() {
  loadingDown.value = true;
  try {
    await props.migrateDownFn();
    $q.notify({
      type: "positive",
      message: t(`layout.navigation.${props.module}.migration.down.success`),
    });
  } catch (error) {
    console.error(`Failed to migrate down (${props.module}):`, error);
    $q.notify({
      type: "negative",
      message: t(`layout.navigation.${props.module}.migration.down.error`),
    });
  } finally {
    loadingDown.value = false;
  }
}

function confirmMigrateDown() {
  $q.dialog({
    title: t(`layout.navigation.${props.module}.migration.down.confirm.title`),
    message: t(
      `layout.navigation.${props.module}.migration.down.confirm.message`
    ),
    cancel: true,
    persistent: true,
  }).onOk(() => {
    void migrateDown();
  });
}
</script>
