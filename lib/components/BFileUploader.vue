<template>
  <div class="file-upload-container">
    <BUploaderBase
      ref="uploaderBase"
      :accept="accept"
      :has-content="hasFile"
      :uploading="uploading"
      :progress="progress"
      :loading-text="message"
      :has-error="hasError"
      @file-selected="onFileSelected"
      @file-dropped="onFileDropped"
      @zone-click="onZoneClick"
    >
      <template #loading>
        <div class="loading-spinner"></div>
        <div class="loading-text">{{ message || 'Uploading...' }}</div>
      </template>
      <template #content>
        <div class="file-display">
          <div class="file-info">
            <div class="file-icon">
              <svg
                v-if="isImageFile"
                width="48"
                height="48"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="1.5"
              >
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                <circle cx="9" cy="9" r="2" />
                <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
              </svg>
              <svg
                v-else-if="isPdfFile"
                width="48"
                height="48"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="1.5"
              >
                <path
                  d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"
                />
                <polyline points="14,2 14,8 20,8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
                <polyline points="10,9 9,9 8,9" />
              </svg>
              <svg
                v-else
                width="48"
                height="48"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="1.5"
              >
                <path
                  d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"
                />
                <polyline points="14,2 14,8 20,8" />
              </svg>
            </div>
            <div class="file-details">
              <div class="file-name">{{ selectedFileName }}</div>
              <div class="file-meta">
                <span class="file-size">{{
                  formatFileSize(selectedFileSize)
                }}</span>
                <span class="file-type">{{ selectedFileType }}</span>
              </div>
            </div>
          </div>

          <div class="file-actions">
            <button
              class="action-btn replace-btn"
              @click.stop="replaceFile"
              title="Replace File"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <path
                  d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"
                />
                <polyline points="14,2 14,8 20,8" />
                <path d="M12 18v-6" />
                <path d="M9 15l3-3 3 3" />
              </svg>
            </button>
            <button
              class="action-btn remove-btn"
              @click.stop="removeFile"
              title="Remove File"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <polyline points="3,6 5,6 21,6" />
                <path
                  d="m19,6v14a2,2 0 0,1 -2,2H7a2,2 0 0,1 -2,-2V6m3,0V4a2,2 0 0,1 2,-2h4a2,2 0 0,1 2,2v2"
                />
              </svg>
            </button>
          </div>
        </div>
      </template>
      <template #prompt="{ isDragging, isHovering }">
        <div
          class="upload-icon"
          :class="{
            'error-icon': hasError,
            hovering: isHovering,
            dragging: isDragging,
          }"
        >
          <svg
            v-if="!hasError"
            width="48"
            height="48"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.5"
          >
            <path
              d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"
            />
            <polyline points="14,2 14,8 20,8" />
            <path d="M12 18v-6" />
            <path d="M9 15l3-3 3 3" />
          </svg>
          <svg
            v-else
            width="48"
            height="48"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="15" y1="9" x2="9" y2="15" />
            <line x1="9" y1="9" x2="15" y2="15" />
          </svg>
        </div>
        <div class="upload-text">
          <div class="primary-text">
            <span v-if="hasError">Upload failed</span>
            <span v-else-if="isDragging">Drop file here</span>
            <span v-else>Select or Drop file here</span>
          </div>
          <div
            class="secondary-text"
            v-if="!isDragging && !hasError && showText"
          >
            <span
              >Max {{ formatFileSize(maxFileSize) }} •
              {{ getAcceptDescription() }}</span
            >
          </div>
          <div class="error-text" v-if="hasError">
            {{ errorMessage }}
          </div>
        </div>
      </template>
    </BUploaderBase>
  </div>
</template>

<script lang="ts">
import axios from 'axios';
import { computed, defineComponent, ref } from 'vue';
import { useQuasar } from 'quasar';
import { handleSSEProgress } from '../utils/sseHandler';
import BUploaderBase from './BUploaderBase.vue';

export default defineComponent({
  name: 'FileUploadComponent',
  components: {
    BUploaderBase,
  },
  props: {
    postEndPoint: {
      type: String,
      required: true,
    },
    accept: {
      type: String,
      required: true,
    },
    showText: {
      type: Boolean,
      required: false,
      default: true,
    },
    maxFileSize: {
      type: Number,
      required: false,
      default: 1048576 * 80, // 80MB default
    },
  },
  setup(props, { emit }) {
    const $q = useQuasar();
    const uploaderBase = ref<InstanceType<typeof BUploaderBase>>();
    const uploading = ref(false);
    const progress = ref(0.0);
    const message = ref('');
    const hasError = ref(false);
    const errorMessage = ref('');

    // File state
    const selectedFile = ref<File | null>(null);
    const selectedFileName = ref('');
    const selectedFileSize = ref(0);
    const selectedFileType = ref('');

    const hasFile = computed(() => selectedFile.value !== null);

    const isImageFile = computed(() => {
      return selectedFileType.value.startsWith('image/');
    });

    const isPdfFile = computed(() => {
      return selectedFileType.value === 'application/pdf';
    });

    const onZoneClick = () => {
      if (!hasFile.value) {
        uploaderBase.value?.clickFileInput();
      }
    };

    const checkFileSize = (file: File): boolean => {
      return file.size <= props.maxFileSize;
    };

    const validateFile = (file: File): { valid: boolean; error?: string } => {
      if (!checkFileSize(file)) {
        return {
          valid: false,
          error: `File size exceeds ${formatFileSize(props.maxFileSize)} limit`,
        };
      }

      // Check file type against accept prop
      if (props.accept && props.accept !== '*/*') {
        const acceptedTypes = props.accept
          .split(',')
          .map((type) => type.trim());
        const fileType = file.type;
        const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();

        const isAccepted = acceptedTypes.some((acceptType) => {
          if (acceptType.startsWith('.')) {
            return acceptType === fileExtension;
          } else if (acceptType.includes('*')) {
            const baseType = acceptType.split('/')[0];
            return fileType.startsWith(baseType);
          } else {
            return acceptType === fileType;
          }
        });

        if (!isAccepted) {
          return {
            valid: false,
            error: `File type not supported. Accepted: ${getAcceptDescription()}`,
          };
        }
      }

      return { valid: true };
    };

    const setFile = (file: File) => {
      selectedFile.value = file;
      selectedFileName.value = file.name;
      selectedFileSize.value = file.size;
      selectedFileType.value = file.type;
      hasError.value = false;
      errorMessage.value = '';
    };

    const clearFile = () => {
      selectedFile.value = null;
      selectedFileName.value = '';
      selectedFileSize.value = 0;
      selectedFileType.value = '';
      progress.value = 0;
      message.value = '';
      hasError.value = false;
      errorMessage.value = '';
    };

    const processFile = (file: File) => {
      const validation = validateFile(file);

      if (!validation.valid) {
        hasError.value = true;
        errorMessage.value = validation.error || 'Invalid file';
        $q.notify({
          type: 'negative',
          message: validation.error,
        });
        return;
      }

      setFile(file);
      handleUpload();
    };

    const onFileSelected = (event: Event) => {
      const target = event.target as HTMLInputElement;
      if (target.files?.[0]) {
        processFile(target.files[0]);
      }
    };

    const onFileDropped = (files: FileList) => {
      if (files[0]) {
        processFile(files[0]);
      }
    };

    const replaceFile = () => {
      uploaderBase.value?.clickFileInput();
    };

    const removeFile = () => {
      clearFile();
      emit('removed');
    };

    const emitUploaded = () => {
      emit('uploaded');
    };

    const handleUpload = function () {
      if (!selectedFile.value) return;

      uploading.value = true;
      progress.value = 0;
      message.value = 'Preparing upload...';
      hasError.value = false;

      const formData: FormData = new FormData();
      formData.append('file', selectedFile.value);

      const lastProcessedPosition = ref({ current: 0 });
      const fullResponseText = ref({ current: '' });

      const endPoint = props.postEndPoint;

      axios({
        url: endPoint,
        data: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        method: 'POST',
        onDownloadProgress: (progressEvent) => {
          handleSSEProgress(
            progressEvent,
            lastProcessedPosition.value,
            fullResponseText.value,
            {
              onMessage: (inmessage) => {
                message.value = inmessage;
              },
              onInfo: (inmessage) => {
                message.value = inmessage;
              },
              onError: (inmessage) => {
                $q.notify({
                  type: 'negative',
                  message: inmessage,
                });
                progress.value = 0;
                message.value = 'Error: ' + inmessage;
                hasError.value = true;
                errorMessage.value = inmessage;
                uploading.value = false;
              },
              onProgress: (inProgress) => {
                progress.value = inProgress / 100;
                if (inProgress === 100) {
                  emitUploaded();
                  message.value = 'Upload complete!';
                  setTimeout(() => {
                    uploading.value = false;
                    clearFile();
                  }, 2000);
                }
              },
            },
          );
        },
      })
        .then(() => {
          // Handle success if needed
        })
        .catch((error: Error) => {
          console.error('Error uploading file:', error);
          uploading.value = false;
          hasError.value = true;
          errorMessage.value = error.message;
          $q.notify({
            type: 'negative',
            message: error.message,
          });
        });
    };

    const formatFileSize = (bytes: number): string => {
      if (bytes === 0) return '0 Bytes';
      const k = 1024;
      const sizes = ['Bytes', 'KB', 'MB', 'GB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const getAcceptDescription = (): string => {
      if (!props.accept || props.accept === '*/*') {
        return 'All files';
      }

      const types = props.accept.split(',').map((type) => type.trim());
      const descriptions = types.map((type) => {
        if (type.includes('image/')) return 'Images';
        if (type.includes('video/')) return 'Videos';
        if (type.includes('audio/')) return 'Audio';
        if (type.includes('application/pdf')) return 'PDF';
        if (type.includes('text/')) return 'Text files';
        return type;
      });

      return [...new Set(descriptions)].join(', ');
    };

    return {
      uploaderBase,
      uploading,
      progress,
      message,
      hasFile,
      hasError,
      errorMessage,
      selectedFileName,
      selectedFileSize,
      selectedFileType,
      isImageFile,
      isPdfFile,
      onFileSelected,
      onFileDropped,
      onZoneClick,
      replaceFile,
      removeFile,
      formatFileSize,
      getAcceptDescription,
    };
  },
});
</script>

<style scoped>
.file-upload-container {
  display: flex;
  justify-content: center;
  align-items: center;
}

.file-display {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  background: #f9fafb;
  border-radius: 12px;
  border: 1px solid #e5e7eb;
}

.file-info {
  display: flex;
  align-items: center;
  gap: 16px;
  flex: 1;
}

.file-icon {
  color: #6366f1;
  flex-shrink: 0;
}

.file-details {
  flex: 1;
  min-width: 0;
}

.file-name {
  font-weight: 600;
  color: #111827;
  margin-bottom: 4px;
  word-break: break-all;
}

.file-meta {
  display: flex;
  gap: 12px;
  font-size: 14px;
  color: #6b7280;
}

.file-actions {
  display: flex;
  gap: 8px;
}

.action-btn {
  background: rgba(255, 255, 255, 0.9);
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.action-btn:hover {
  background: white;
  transform: scale(1.05);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.replace-btn {
  color: #6366f1;
}

.replace-btn:hover {
  border-color: #6366f1;
  box-shadow: 0 2px 8px rgba(99, 102, 241, 0.2);
}

.remove-btn {
  color: #ef4444;
}

.remove-btn:hover {
  border-color: #ef4444;
  box-shadow: 0 2px 8px rgba(239, 68, 68, 0.2);
}

.upload-icon {
  color: #6366f1;
  margin-bottom: 16px;
  transition: transform 0.3s ease;
}

.upload-icon.error-icon {
  color: #ef4444;
}

.upload-icon.hovering:not(.error-icon) {
  transform: scale(1.1);
}

.upload-icon.dragging:not(.error-icon) {
  transform: scale(1.2);
  color: #4f46e5;
}

.upload-text {
  color: #374151;
}

.primary-text {
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 8px;
}

.secondary-text {
  font-size: 14px;
  color: #6b7280;
}

.error-text {
  font-size: 14px;
  color: #ef4444;
  font-weight: 500;
  margin-top: 8px;
}

/* Responsive */
@media (max-width: 640px) {
  .file-display {
    flex-direction: column;
    align-items: stretch;
    gap: 16px;
  }

  .file-info {
    flex-direction: column;
    align-items: center;
    text-align: center;
    gap: 12px;
  }

  .file-actions {
    justify-content: center;
  }

  .primary-text {
    font-size: 16px;
  }

  .secondary-text {
    font-size: 13px;
  }
}
</style>
