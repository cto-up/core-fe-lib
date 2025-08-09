<template>
  <div class="uploader-base-container">
    <input
      ref="fileInput"
      type="file"
      @change="onFileSelected"
      style="display: none"
      :accept="accept"
      :multiple="multiple"
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
          <div class="loading-spinner"></div>
          <div class="loading-text">{{ loadingText || 'Uploading...' }}</div>
          <div class="loading-progress">
            <div
              class="progress-bar"
              :style="`width: ${progress * 100}%`"
            ></div>
          </div>
          <div class="progress-percentage">
            {{ Math.round((progress || 0) * 100) }}%
          </div>
        </slot>
      </div>

      <div v-if="hasContent && !uploading" class="content-display">
        <slot name="content" :is-hovering="isHovering"></slot>
      </div>

      <div v-if="!hasContent && !uploading" class="upload-prompt">
        <slot
          name="prompt"
          :is-dragging="isDragging"
          :is-hovering="isHovering"
        ></slot>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue';

export default defineComponent({
  name: 'BUploaderBase',
  props: {
    accept: { type: String },
    hasContent: { type: Boolean, default: false },
    uploading: { type: Boolean, default: false },
    loadingText: { type: String, default: 'Uploading...' },
    progress: { type: Number, default: 0 },
    hasError: { type: Boolean, default: false },
    multiple: { type: Boolean, default: false },
  },
  emits: ['file-selected', 'file-dropped', 'zone-click'],
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
        emit('file-dropped', event.dataTransfer.files);
      }
    };

    const onFileSelected = (event: Event) => {
      emit('file-selected', event);
      if (fileInput.value) {
        fileInput.value.value = '';
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

<style scoped>
.uploader-base-container {
  width: 100%;
  margin: 0 auto;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.upload-zone {
  position: relative;
  border: 5px dashed #e0e7ff;
  border-radius: 16px;
  background: linear-gradient(135deg, #f8faff 0%, #f1f5ff 100%);
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  min-height: 200px;
  padding: 24px;
}

.upload-zone:hover:not(.uploading):not(.has-content) {
  border-color: #6366f1;
  background: linear-gradient(135deg, #f0f4ff 0%, #e8efff 100%);
  transform: translateY(-2px);
  box-shadow: 0 8px 25px -8px rgba(99, 102, 241, 0.3);
}

.upload-zone.dragging {
  border-color: #4f46e5;
  background: linear-gradient(135deg, #eef2ff 0%, #e0e7ff 100%);
  transform: scale(1.02);
  box-shadow: 0 12px 40px -12px rgba(79, 70, 229, 0.4);
}

.upload-zone.has-content {
  border: 2px solid #e5e7eb;
  background: #ffffff;
  cursor: default;
  padding: 16px;
}

.upload-zone.has-content:hover {
  transform: none;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

.upload-zone.error {
  border-color: #ef4444;
  background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%);
}

.upload-zone.uploading {
  pointer-events: none;
  border-color: #6366f1;
  background: linear-gradient(135deg, #f0f4ff 0%, #e8efff 100%);
}

/* Loading Overlay */
.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(8px);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 10;
  border-radius: 14px;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #e5e7eb;
  border-top: 3px solid #6366f1;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 16px;
}

.loading-text {
  color: #374151;
  font-weight: 500;
  margin-bottom: 16px;
  text-align: center;
}

.loading-progress {
  width: 80%;
  height: 6px;
  background: #e5e7eb;
  border-radius: 3px;
  overflow: hidden;
  margin-bottom: 12px;
}

.progress-bar {
  height: 100%;
  background: linear-gradient(90deg, #6366f1, #8b5cf6);
  border-radius: 3px;
  transition: width 0.3s ease;
}

.progress-percentage {
  color: #6366f1;
  font-weight: 600;
  font-size: 14px;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

.content-display {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.upload-prompt {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  width: 100%;
}
</style>
