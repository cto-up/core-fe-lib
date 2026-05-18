<template>
  <div class="flex gap-2 items-center">
    <div class="flex-1">
      <Input
        v-model="translatedValue"
        :placeholder="fieldDisplay"
        :disabled="loading"
      />
    </div>
    <Button
      :disabled="loading"
      size="icon"
      :title="saveLabel"
      @click="saveTranslation"
    >
      <Icon v-if="!loading" name="save" class="h-4 w-4" />
      <Icon v-else name="loader-2" class="h-4 w-4 animate-spin" />
    </Button>
  </div>
</template>

<script lang="ts" setup>
import { ref, onMounted, watch } from "vue";
import { DefaultService as DefaultTranslationService } from "../../openapi/core";
import { useErrors } from "../composables/useErrors";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { useToast } from "../ui/toast/use-toast";
import Icon from "../Icon.vue";

export interface TranslationService {
  getTranslation: (
    entityType: string,
    entityId: string,
    field: string,
    language: string
  ) => Promise<{ id?: string | null; value?: string | null }>;
  createTranslation: (payload: {
    entity_type: string;
    entity_id: string;
    field: string;
    language: string;
    value: string;
  }) => Promise<{ id: string }>;
  updateTranslation: (
    id: string,
    payload: {
      entity_type: string;
      entity_id: string;
      field: string;
      language: string;
      value: string;
    }
  ) => Promise<unknown>;
}

const { toast } = useToast();

const props = withDefaults(
  defineProps<{
    entityType: string;
    entityId: string;
    fieldName: string;
    fieldDisplay: string;
    language: "en" | "fr";
    /**
     * Strategy override. Defaults to the generated TranslationService from
     * core-fe-lib/openapi/core. Pass a custom service when a tenant runs its
     * own translation backend.
     */
    service?: TranslationService;
    saveLabel?: string;
    createdToast?: string;
    updatedToast?: string;
  }>(),
  {
    service: () => DefaultTranslationService as unknown as TranslationService,
    saveLabel: "Save translation",
    createdToast: "Translation created",
    updatedToast: "Translation updated",
  }
);

const { handleError } = useErrors();
const translatedValue = ref("");
const translationId = ref<string | null>(null);
const loading = ref(false);

async function fetchTranslation() {
  if (!props.entityId) return;
  loading.value = true;
  try {
    const response = await props.service.getTranslation(
      props.entityType,
      props.entityId,
      props.fieldName,
      props.language
    );
    translatedValue.value = response.value || "";
    translationId.value = response.id || null;
  } catch (error) {
    translatedValue.value = "";
    translationId.value = null;
    handleError(error, true);
  } finally {
    loading.value = false;
  }
}

watch([() => props.language, () => props.entityId], () => {
  fetchTranslation();
});

async function saveTranslation() {
  loading.value = true;
  try {
    if (!translationId.value) {
      const response = await props.service.createTranslation({
        entity_type: props.entityType,
        entity_id: props.entityId,
        field: props.fieldName,
        language: props.language,
        value: translatedValue.value,
      });
      translationId.value = response.id;
      toast({ title: props.createdToast });
    } else {
      await props.service.updateTranslation(translationId.value, {
        entity_type: props.entityType,
        entity_id: props.entityId,
        field: props.fieldName,
        language: props.language,
        value: translatedValue.value,
      });
      toast({ title: props.updatedToast });
    }
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
