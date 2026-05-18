<template>
  <div class="flex items-center justify-between">
    <div class="flex items-center gap-2">
      <Button
        variant="ghost"
        size="sm"
        :disabled="modelValue.page <= 1"
        @click="changePage(modelValue.page - 1)"
      >
        <ChevronLeft class="h-4 w-4" />
        {{ $t("common.pagination.previous") }}
      </Button>
      <div class="text-sm">
        {{
          showTotal
            ? $t("common.pagination.pageOf", {
                current: modelValue.page,
                total: totalPages,
              })
            : $t("common.pagination.page", {
                current: modelValue.page,
              })
        }}
      </div>
      <Button
        variant="ghost"
        size="sm"
        :disabled="modelValue.page >= totalPages"
        @click="changePage(modelValue.page + 1)"
      >
        {{ $t("common.pagination.next") }}
        <ChevronRight class="h-4 w-4" />
      </Button>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed } from "vue";
import { Button } from "../ui/button";
import { ChevronLeft, ChevronRight } from "lucide-vue-next";

interface Pagination {
  page: number;
  rowsPerPage: number;
  rowsNumber: number;
  sortBy?: string;
  descending?: boolean;
}

const props = withDefaults(
  defineProps<{
    modelValue: Pagination;
    showTotal?: boolean;
  }>(),
  {
    showTotal: false,
  }
);

const emit = defineEmits(["update:modelValue", "change"]);

const totalPages = computed(() => {
  return (
    Math.ceil(props.modelValue.rowsNumber / props.modelValue.rowsPerPage) || 1
  );
});

const changePage = (page: number) => {
  if (page < 1 || page > totalPages.value) return;
  const newValue = { ...props.modelValue, page: page };
  emit("update:modelValue", newValue);
  emit("change", newValue);
};
</script>
