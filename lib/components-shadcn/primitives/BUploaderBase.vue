<template>
  <div class="uploader-base-container">
    <input
      ref="fileInput"
      type="file"
      style="display: none"
      :accept="accept"
      :multiple="multiple"
      @change="onFileSelected"
    />

    <div
      class="upload-zone"
      :class="{
        'has-content': hasContent,
        dragging: isDragging,
        uploading: uploading,
        error: hasError,
      }"
      @click="$emit('zone-click')"
      @dragover.prevent="onDragOver"
      @dragleave.prevent="onDragLeave"
      @drop.prevent="onDrop"
      @mouseenter="isHovering = true"
      @mouseleave="isHovering = false"
    >
      <div v-if="uploading" class="loading-overlay">
        <slot name="loading">
          <div class="loading-spinner" />
          <div class="loading-text">
            {{ loadingText || "Uploading..." }}
          </div>
        </slot>
      </div>

      <div v-if="hasContent && !uploading" class="content-display">
        <slot name="content" :is-hovering="isHovering" />
      </div>

      <div v-if="!hasContent && !uploading" class="upload-prompt">
        <slot
          name="prompt"
          :is-dragging="isDragging"
          :is-hovering="isHovering"
        />
      </div>

      <div v-if="progress > 0" class="progress-overlay">
        <div class="progress-container">
          <div class="progress-track" />
          <div
            class="progress-fill"
            :class="{ error: hasError }"
            :style="`width: ${progress * 100}%`"
          />
        </div>
        <div class="progress-percentage">
          {{ Math.round((progress || 0) * 100) }}%
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref } from "vue";

export default defineComponent({
  name: "BUploaderBase",
  props: {
    accept: { type: String },
    hasContent: { type: Boolean, default: false },
    uploading: { type: Boolean, default: false },
    loadingText: { type: String, default: "Uploading..." },
    progress: { type: Number, default: 0 },
    hasError: { type: Boolean, default: false },
    multiple: { type: Boolean, default: false },
  },
  emits: ["file-selected", "file-dropped", "zone-click"],
  setup(_, { emit, expose }) {
    const fileInput = ref<HTMLInputElement>();
    const isDragging = ref(false);
    const isHovering = ref(false);
    const dragCounter = ref(0);

    const onDragOver = (event: DragEvent) => {
      event.preventDefault();
      if (dragCounter.value === 0) {
        isDragging.value = true;
      }
      dragCounter.value++;
    };

    const onDragLeave = (event: DragEvent) => {
      event.preventDefault();
      dragCounter.value--;
      if (dragCounter.value === 0) {
        isDragging.value = false;
      }
    };

    const onDrop = (event: DragEvent) => {
      isDragging.value = false;
      dragCounter.value = 0;
      if (event.dataTransfer?.files && event.dataTransfer.files.length > 0) {
        emit("file-dropped", event.dataTransfer.files);
      }
    };

    const onFileSelected = (event: Event) => {
      emit("file-selected", event);
      if (fileInput.value) {
        fileInput.value.value = "";
      }
    };

    const clickFileInput = () => {
      fileInput.value?.click();
    };

    expose({ clickFileInput });

    return {
      fileInput,
      isDragging,
      isHovering,
      onDragOver,
      onDragLeave,
      onDrop,
      onFileSelected,
      clickFileInput,
    };
  },
});
</script>
