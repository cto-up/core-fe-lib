<template>
  <div class="testimony-date">
    {{ formattedDate }}
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useI18n } from "vue-i18n";

const props = defineProps<{
  modelValue: any;
}>();

const { t } = useI18n();
const formattedDate = computed(() => formatDate(props.modelValue));

const formatDate = (dateString: string | undefined): string => {
  if (!dateString) return "";
  try {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat(t("locale") || "en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(date);
  } catch (error) {
    return dateString;
  }
};
</script>

<style scoped lang="scss">
.testimony-meta {
  margin-top: auto;
}

.testimony-date {
  font-size: 0.95rem;
  color: var(--q-text-tertiary);
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 0.5rem;

  &::before {
    content: "📅";
    font-size: 1rem;
  }
}
</style>
