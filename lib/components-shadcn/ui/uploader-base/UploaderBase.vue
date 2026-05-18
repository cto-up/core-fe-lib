<template>
  <div class="uploader-base">
    <input
      ref="fileInput"
      type="file"
      :accept="accept"
      class="hidden"
      @change="onFileSelected"
    />

    <div
      ref="dropZone"
      :class="
        cn(
          'upload-zone relative rounded-lg border-2 border-dashed transition-all',
          hasContent && 'has-content',
          isDragging && 'border-primary bg-primary/5',
          isHovering && !hasContent && 'border-primary/50 bg-accent',
          hasError && 'border-destructive bg-destructive/5',
          'min-h-[200px] flex items-center justify-center'
        )
      "
      @click="onZoneClick"
      @dragover.prevent="onDragOver"
      @dragleave.prevent="onDragLeave"
      @drop.prevent="onDrop"
      @mouseenter="isHovering = true"
      @mouseleave="isHovering = false"
    >
      <!-- Loading State -->
      <div
        v-if="uploading"
        class="absolute inset-0 flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm rounded-lg z-10"
      >
        <slot name="loading">
          <Loader2 class="h-12 w-12 animate-spin text-primary mb-4" />
          <p class="text-sm text-muted-foreground">
            {{ loadingText || "Uploading..." }}
          </p>
        </slot>
        <Progress
          v-if="progress > 0"
          :model-value="progress * 100"
          class="w-64 mt-4"
        />
      </div>

      <!-- Content (when file is uploaded/selected) -->
      <div v-if="hasContent && !uploading" class="w-full h-full">
        <slot name="content" :is-hovering="isHovering" />
      </div>

      <!-- Upload Prompt (default state) -->
      <div
        v-if="!hasContent && !uploading"
        class="flex flex-col items-center justify-center p-8 text-center"
      >
        <slot name="prompt" :is-dragging="isDragging" :is-hovering="isHovering">
          <Upload
            :class="
              cn(
                'h-12 w-12 mb-4',
                isDragging ? 'text-primary' : 'text-muted-foreground'
              )
            "
          />
          <p class="text-sm font-medium">
            {{
              isDragging ? "Drop file here" : "Click to upload or drag and drop"
            }}
          </p>
        </slot>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { Upload, Loader2 } from "lucide-vue-next";
import { Progress } from "../progress";
import { cn } from "../../utils";

interface Props {
  accept?: string;
  hasContent?: boolean;
  uploading?: boolean;
  progress?: number;
  loadingText?: string;
  hasError?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  accept: "*/*",
  hasContent: false,
  uploading: false,
  progress: 0,
  hasError: false,
});

const emit = defineEmits<{
  "file-selected": [event: Event];
  "file-dropped": [files: FileList];
  "zone-click": [];
}>();

const fileInput = ref<HTMLInputElement>();
const dropZone = ref<HTMLDivElement>();
const isDragging = ref(false);
const isHovering = ref(false);

const clickFileInput = () => {
  fileInput.value?.click();
};

const onFileSelected = (event: Event) => {
  emit("file-selected", event);
};

const onZoneClick = () => {
  emit("zone-click");
};

const onDragOver = (event: DragEvent) => {
  isDragging.value = true;
};

const onDragLeave = (event: DragEvent) => {
  isDragging.value = false;
};

const onDrop = (event: DragEvent) => {
  isDragging.value = false;

  const files = event.dataTransfer?.files;
  if (files && files.length > 0) {
    emit("file-dropped", files);
  }
};

defineExpose({
  clickFileInput,
});
</script>

<style scoped>
.upload-zone {
  cursor: pointer;
}

.upload-zone.has-content {
  cursor: default;
}
</style>
