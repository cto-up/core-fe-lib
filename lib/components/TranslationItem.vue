<template>
  <div class="row q-col-gutter-sm">
    <div class="col">
      <q-input
        v-model="translatedValue"
        :label="fieldDisplay"
        :loading="loading"
        :disable="loading"
      />
    </div>
    <div class="col-auto">
      <q-btn
        :loading="loading"
        color="primary"
        icon="save"
        @click="saveTranslation"
      />
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, onMounted, watch } from 'vue';
import { DefaultService as TranslationService } from 'src/openapi/skeellscoach';
import { useErrors } from 'src/composables/useErrors';
import { useQuasar } from 'quasar';

const $q = useQuasar();

const props = defineProps({
  entityType: {
    type: String,
    required: true,
  },
  entityId: {
    type: String,
    required: true,
  },
  fieldName: {
    type: String,
    required: true,
  },
  fieldDisplay: {
    type: String,
    required: true,
  },
  language: {
    type: String as () => 'en' | 'fr',
    required: true,
    validator: (value: string): boolean => ['en', 'fr'].includes(value),
  },
});

const { handleError } = useErrors();
const translatedValue = ref('');
const translationId = ref<string | null>(null);
const loading = ref(false);

async function fetchTranslation() {
  if (!props.entityId) {
    return;
  }
  loading.value = true;
  try {
    const response = await TranslationService.getTranslation(
      props.entityType,
      props.entityId,
      props.fieldName,
      props.language,
    );
    translatedValue.value = response.value || '';
    translationId.value = response.id || null;
  } catch (error) {
    translatedValue.value = '';
    translationId.value = null;
    handleError(error, true);
  } finally {
    loading.value = false;
  }
}

// Watch for language and entityId changes and refetch translation
watch([() => props.language, () => props.entityId], () => {
  fetchTranslation();
});

async function saveTranslation() {
  loading.value = true;
  try {
    if (!translationId.value) {
      const response = await TranslationService.createTranslation({
        entity_type: props.entityType,
        entity_id: props.entityId,
        field: props.fieldName,
        language: props.language,
        value: translatedValue.value,
      });
      translationId.value = response.id;
    } else {
      await TranslationService.updateTranslation(translationId.value, {
        entity_id: props.entityId,
        entity_type: props.entityType,
        field: props.fieldName,
        language: props.language,
        value: translatedValue.value,
      });
    }
    $q.notify({
      icon: 'announcement',
      message: translationId.value
        ? 'Translation updated'
        : 'Translation created',
    });
  } catch (error) {
    handleError(error);
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  fetchTranslation();
});
</script>
