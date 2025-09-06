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

      <div v-if="progress > 0" class="progress-overlay">
        <div class="progress-container">
          <div class="progress-track"></div>
          <div
            class="progress-fill"
            :class="{ error: hasError }"
            :style="`width: ${progress * 100}%`"
          ></div>
        </div>
        <div class="progress-percentage">
          {{ Math.round((progress || 0) * 100) }}%
        </div>
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

<style lang="scss" scoped>
// Import SCSS modules
@use 'sass:color';

// Import library styles
@import '../styles/variables';
@import '../styles/mixins';

.uploader-base-container {
  width: 100%;
  margin: 0 auto;
  font-family:
    -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.upload-zone {
  position: relative;
  border-radius: 16px;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  min-height: 200px;
  padding: 24px;

  // Light theme defaults
  @include lib-light-theme {
    border: 5px dashed rgba($lib-secondary, 0.6);
    background: linear-gradient(
      135deg,
      mix($lib-tertiary, $lib-white, 30%) 0%,
      mix($lib-secondary, $lib-white, 20%) 100%
    );
    box-shadow: 0 4px 6px -1px rgba($lib-primary, 0.1);
  }

  // Dark theme
  @include lib-dark-theme {
    border: 5px dashed rgba($lib-secondary, 0.4);
    background: linear-gradient(
      135deg,
      mix($lib-gray-700, $lib-primary, 90%) 0%,
      mix($lib-gray-800, $lib-primary, 95%) 100%
    );
    box-shadow: 0 4px 6px -1px rgba($lib-black, 0.4);
  }

  &:hover:not(.uploading):not(.has-content) {
    transform: translateY(-2px);

    @include lib-light-theme {
      border-color: $lib-primary;
      background: linear-gradient(
        135deg,
        mix($lib-tertiary, $lib-white, 40%) 0%,
        mix($lib-secondary, $lib-white, 30%) 100%
      );
      box-shadow: 0 8px 25px -8px rgba($lib-primary, 0.3);
    }

    @include lib-dark-theme {
      border-color: mix($lib-secondary, $lib-white, 70%);
      background: linear-gradient(
        135deg,
        mix($lib-gray-600, $lib-primary, 85%) 0%,
        mix($lib-gray-700, $lib-primary, 90%) 100%
      );
      box-shadow: 0 8px 25px -8px rgba($lib-secondary, 0.3);
    }
  }

  &.dragging {
    transform: scale(1.02);

    @include lib-light-theme {
      border-color: color.scale($lib-primary, $lightness: -10%);
      background: linear-gradient(
        135deg,
        mix($lib-secondary, $lib-white, 40%) 0%,
        mix($lib-primary, $lib-white, 30%) 100%
      );
      box-shadow: 0 12px 40px -12px rgba($lib-primary, 0.4);
    }

    @include lib-dark-theme {
      border-color: $lib-secondary;
      background: linear-gradient(
        135deg,
        mix($lib-gray-600, $lib-secondary, 80%) 0%,
        mix($lib-gray-700, $lib-secondary, 85%) 100%
      );
      box-shadow: 0 12px 40px -12px rgba($lib-secondary, 0.4);
    }
  }

  &.has-content {
    cursor: default;
    padding: 16px;

    @include lib-light-theme {
      border: 2px solid $lib-gray-200;
      background: $lib-white;
    }

    @include lib-dark-theme {
      border: 2px solid $lib-gray-600;
      background: $lib-gray-800;
    }

    &:hover {
      transform: none;

      @include lib-light-theme {
        box-shadow: 0 4px 6px -1px rgba($lib-primary, 0.1);
      }

      @include lib-dark-theme {
        box-shadow: 0 4px 6px -1px rgba($lib-black, 0.4);
      }
    }
  }

  &.error {
    @include lib-light-theme {
      border-color: $lib-error;
      background: linear-gradient(
        135deg,
        mix($lib-negative, $lib-white, 15%) 0%,
        mix($lib-error, $lib-white, 10%) 100%
      );
    }

    @include lib-dark-theme {
      border-color: $lib-negative;
      background: linear-gradient(
        135deg,
        mix($lib-gray-700, $lib-error, 85%) 0%,
        mix($lib-gray-800, $lib-error, 90%) 100%
      );
    }
  }

  &.uploading {
    pointer-events: none;

    @include lib-light-theme {
      border-color: $lib-primary;
      background: linear-gradient(
        135deg,
        mix($lib-secondary, $lib-white, 25%) 0%,
        mix($lib-primary, $lib-white, 20%) 100%
      );
    }

    @include lib-dark-theme {
      border-color: mix($lib-secondary, $lib-white, 70%);
      background: linear-gradient(
        135deg,
        mix($lib-gray-600, $lib-primary, 85%) 0%,
        mix($lib-gray-700, $lib-primary, 90%) 100%
      );
    }
  }
}

/* Loading Overlay */
.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  backdrop-filter: blur(8px);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 10;
  border-radius: 14px;

  @include lib-light-theme {
    background: rgba($lib-white, 0.95);
  }

  @include lib-dark-theme {
    background: rgba($lib-gray-800, 0.95);
  }
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  animation: lib-spin 1s linear infinite;
  margin-bottom: 16px;

  @include lib-light-theme {
    border: 3px solid $lib-gray-200;
    border-top: 3px solid $lib-primary;
  }

  @include lib-dark-theme {
    border: 3px solid $lib-gray-600;
    border-top: 3px solid $lib-secondary;
  }
}

.loading-text {
  font-weight: 500;
  margin-bottom: 16px;
  text-align: center;

  @include lib-light-theme {
    color: $lib-gray-700;
  }

  @include lib-dark-theme {
    color: $lib-gray-300;
  }
}

.progress-overlay {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 16px;
  backdrop-filter: blur(4px);
  z-index: 11;

  @include lib-light-theme {
    background: rgba($lib-white, 0.8);
    border-top: 1px solid $lib-gray-200;
  }

  @include lib-dark-theme {
    background: rgba($lib-gray-800, 0.8);
    border-top: 1px solid $lib-gray-600;
  }
}

.progress-container {
  width: 100%;
  height: 8px;
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 8px;

  @include lib-light-theme {
    background: $lib-gray-200;
  }

  @include lib-dark-theme {
    background: $lib-gray-600;
  }
}

.progress-fill {
  height: 100%;
  border-radius: 4px;
  transition: width 0.3s ease;

  @include lib-light-theme {
    background: linear-gradient(90deg, $lib-primary, $lib-secondary);
  }

  @include lib-dark-theme {
    background: linear-gradient(
      90deg,
      mix($lib-secondary, $lib-white, 70%),
      mix($lib-accent, $lib-white, 60%)
    );
  }

  &.error {
    @include lib-light-theme {
      background: linear-gradient(90deg, $lib-error, $lib-negative);
    }

    @include lib-dark-theme {
      background: linear-gradient(
        90deg,
        $lib-negative,
        mix($lib-accent, $lib-error, 70%)
      );
    }
  }
}

.progress-percentage {
  font-weight: 600;
  font-size: 14px;
  text-align: center;

  @include lib-light-theme {
    color: $lib-primary;
  }

  @include lib-dark-theme {
    color: mix($lib-secondary, $lib-white, 70%);
  }
}

// Keyframes are now imported from _mixins.scss

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
