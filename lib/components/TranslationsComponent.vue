<template>
  <q-expansion-item
    :label="$t('entities.common.translations')"
    header-class="text-primary"
  >
    <q-card>
      <q-card-section>
        <q-select
          v-model="selectedLanguage"
          :options="languageOptions"
          :label="$t('entities.common.language')"
          emit-value
          map-options
        />
      </q-card-section>

      <q-card-section>
        <div v-for="(field, index) in fields" :key="index" class="q-mb-md">
          <translation-item
            :entity-type="entityType"
            :entity-id="entityId"
            :field-name="field.name"
            :field-display="field.display"
            :language="selectedLanguage"
          />
        </div>
      </q-card-section>
    </q-card>
  </q-expansion-item>
</template>

<script lang="ts" setup>
import { ref } from 'vue';
import TranslationItem from './TranslationItem.vue';
import { PropType } from 'vue';

interface TranslationField {
  name: string;
  display: string;
}

const props = defineProps({
  entityType: {
    type: String,
    required: true,
  },
  entityId: {
    type: String,
    required: true,
  },
  fields: {
    type: Array as PropType<TranslationField[]>,
    required: true,
    validator: (fields: TranslationField[]) =>
      fields.every((field) => 'name' in field && 'display' in field),
  },
});

const selectedLanguage = ref<'en' | 'fr'>('en');
const languageOptions = [
  { label: 'English', value: 'en' },
  { label: 'Français', value: 'fr' },
];
</script>
