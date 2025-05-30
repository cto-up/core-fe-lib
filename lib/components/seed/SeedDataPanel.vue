<template>
  <q-page padding>
    <div class="row q-col-gutter-md">
      <div class="col-12">
        <q-card>
          <q-card-section>
            <div class="text-h6">
              {{ t(`layout.navigation.${module}.seed.title`) }}
            </div>
            <div class="text-subtitle2">
              {{ t(`layout.navigation.${module}.seed.caption`) }}
            </div>
          </q-card-section>

          <q-card-section class="row q-col-gutter-md">
            <div class="col-12 col-md-6">
              <q-card>
                <q-card-section>
                  <div class="text-h6">
                    {{ t(`layout.navigation.${module}.seed.reference.title`) }}
                  </div>
                  <div class="text-subtitle2">
                    {{
                      t(`layout.navigation.${module}.seed.reference.caption`)
                    }}
                  </div>
                </q-card-section>
                <q-card-section>
                  <b-btn
                    color="primary"
                    :loading="loadingReference"
                    :disable="loadingReference || loadingSample"
                    @click="seedReferenceData"
                    icon="data_array"
                    :label="
                      t(`layout.navigation.${module}.seed.reference.action`)
                    "
                  />
                </q-card-section>
              </q-card>
            </div>

            <div class="col-12 col-md-6" v-if="!hideSampleData">
              <q-card>
                <q-card-section>
                  <div class="text-h6">
                    {{ t(`layout.navigation.${module}.seed.sample.title`) }}
                  </div>
                  <div class="text-subtitle2">
                    {{ t(`layout.navigation.${module}.seed.sample.caption`) }}
                  </div>
                </q-card-section>
                <q-card-section>
                  <b-btn
                    color="secondary"
                    :loading="loadingSample"
                    :disable="loadingReference || loadingSample"
                    @click="seedSampleData"
                    icon="dataset"
                    :label="t(`layout.navigation.${module}.seed.sample.action`)"
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
    validator: (value: string) =>
      ["skeellscoach", "skeellsfriend"].includes(value),
  },
  seedReferenceFn: {
    type: Function,
    required: true,
  },
  seedSampleFn: {
    type: Function,
    required: true,
  },
  hideSampleData: {
    type: Boolean,
    default: false,
  },
});

const { t } = useI18n();
const $q = useQuasar();
const loadingReference = ref(false);
const loadingSample = ref(false);

async function seedReferenceData() {
  loadingReference.value = true;
  try {
    await props.seedReferenceFn();
    $q.notify({
      type: "positive",
      message: t(`layout.navigation.${props.module}.seed.reference.success`),
    });
  } catch (error) {
    console.error(`Failed to seed reference data (${props.module}):`, error);
    $q.notify({
      type: "negative",
      message: t(`layout.navigation.${props.module}.seed.reference.error`),
    });
  } finally {
    loadingReference.value = false;
  }
}

async function seedSampleData() {
  loadingSample.value = true;
  try {
    await props.seedSampleFn();
    $q.notify({
      type: "positive",
      message: t(`layout.navigation.${props.module}.seed.sample.success`),
    });
  } catch (error) {
    console.error(`Failed to seed sample data (${props.module}):`, error);
    $q.notify({
      type: "negative",
      message: t(`layout.navigation.${props.module}.seed.sample.error`),
    });
  } finally {
    loadingSample.value = false;
  }
}
</script>
