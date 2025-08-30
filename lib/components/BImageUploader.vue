<template>
  <div class="image-upload-container b-image-uploader">
    <BUploaderBase
      ref="uploaderBase"
      :accept="accept"
      :has-content="hasImage"
      :uploading="uploading"
      :progress="progress"
      :loading-text="message"
      @file-selected="onFileSelected"
      @file-dropped="onFileDropped"
      @zone-click="onZoneClick"
      class="image-uploader-base"
    >
      <template #content="{ isHovering }">
        <img
          class="uploaded-image"
          :class="{ hovering: isHovering }"
          crossorigin="anonymous"
          :src="imgTarget"
          @error="onImageError"
          loading="lazy"
          alt="Uploaded image"
        />
      </template>
      <template #prompt="{ isDragging, isHovering }">
        <div
          class="upload-icon"
          :class="{ hovering: isHovering, dragging: isDragging }"
        >
          <svg
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
        </div>
        <div class="upload-text">
          <div class="primary-text">
            {{ isDragging ? 'Drop image here' : 'Click to upload image' }}
          </div>
          <div class="secondary-text" v-if="!isDragging && showText">
            or drag and drop
          </div>
        </div>
      </template>
    </BUploaderBase>

    <!-- Crop Dialog -->
    <q-dialog
      v-model="uploadDialog"
      persistent
      maximized
      transition-show="slide-up"
      transition-hide="slide-down"
    >
      <q-card class="crop-dialog">
        <q-card-section class="dialog-header">
          <div class="text-h6">Crop Image</div>
          <div class="header-actions">
            <q-btn
              flat
              round
              dense
              icon="fullscreen_exit"
              @click="toggleFullscreen"
              title="Toggle Fullscreen"
            />
            <q-btn flat round dense icon="close" @click="closeCropDialog" />
          </div>
        </q-card-section>

        <q-card-section class="crop-section">
          <div class="cropper-container">
            <cropper
              ref="cropper"
              :src="imgSource"
              @change="change"
              :stencil-props="{
                aspectRatio: aspectRatio,
                handlers: {},
                movable: true,
                resizable: true,
              }"
              :resize-image="{
                adjustStencil: false,
              }"
              :canvas="{
                maxArea: 2096 * 2096,
              }"
              class="image-cropper"
            />
          </div>
        </q-card-section>

        <q-card-section v-if="uploading" class="progress-section">
          <q-linear-progress
            :value="progress"
            color="primary"
            :label="message"
            label-value
            class="progress-bar-dialog"
          />
        </q-card-section>

        <q-card-actions class="dialog-actions" align="right">
          <b-btn
            flat
            label="Cancel"
            @click="closeCropDialog"
            :disable="uploading"
            class="cancel-btn"
          />
          <b-btn
            color="primary"
            label="Upload"
            @click="handleUpload"
            :loading="uploading"
            class="upload-btn"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </div>
</template>

<script lang="ts">
import { Cropper } from 'vue-advanced-cropper';
import 'vue-advanced-cropper/dist/style.css';
import axios from 'axios';
import { defineComponent, onMounted, onUnmounted, ref, computed } from 'vue';
import { useQuasar } from 'quasar';
import { handleSSEProgress } from '../utils/sseHandler';
import BUploaderBase from './BUploaderBase.vue';

interface ChangeEvent {
  coordinates: { x: number; y: number };
  canvas: HTMLCanvasElement;
}

export default defineComponent({
  name: 'ImageUploadComponent',
  components: {
    Cropper,
    BUploaderBase,
  },
  props: {
    getEndPoint: {
      type: String,
      required: true,
    },
    accept: {
      type: String,
      required: true,
    },
    postEndPoint: {
      type: String,
      required: true,
    },
    showText: {
      type: Boolean,
      required: false,
      default: true,
    },
    aspectRatio: {
      type: Number,
      required: false,
      default: 1,
    },
    previewImage: {
      type: Boolean,
      default: true,
    },
  },
  setup(props, { emit }) {
    const uploadDialog = ref(false);
    const $q = useQuasar();
    const imgSource = ref<string | ArrayBuffer | null>(null);
    const imgTarget = ref<string>('');
    const imageHasError = ref(false);
    const uploaderBase = ref<InstanceType<typeof BUploaderBase>>();
    const cropper = ref();
    const uploading = ref(false);
    const progress = ref(0.0);
    const message = ref('');
    const isFullscreen = ref(false);
    const selectedFileName = ref('');

    const hasImage = computed(() => {
      if (!props.previewImage) return false;
      if (imageHasError.value) return false;
      return (
        imgTarget.value &&
        imgTarget.value !== '' &&
        !imgTarget.value.includes('picsum.photos')
      );
    });

    const onImageError = () => {
      imageHasError.value = true;
    };

    const onZoneClick = () => {
      uploaderBase.value?.clickFileInput();
    };

    const processFile = async (file: File) => {
      selectedFileName.value = file.name;
      if (validateFile(file)) {
        imageHasError.value = false;
        revoke();
        uploadDialog.value = true;
        imgSource.value = (await read(file)) as string;
        uploadDialog.value = true;
        imgSource.value = (await read(file)) as string;
      }
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

    const validateFile = (file: File): boolean => {
      const maxSize = 10 * 1024 * 1024; // 10MB
      const allowedTypes = [
        'image/jpeg',
        'image/jpg',
        'image/png',
        'image/webp',
      ];

      if (!allowedTypes.includes(file.type)) {
        $q.notify({
          type: 'negative',
          message: 'Please select a valid image file (JPEG, PNG, WebP)',
        });
        return false;
      }

      if (file.size > maxSize) {
        $q.notify({
          type: 'negative',
          message: 'File size must be less than 10MB',
        });
        return false;
      }

      return true;
    };

    const closeCropDialog = () => {
      if (!uploading.value) {
        uploadDialog.value = false;
        isFullscreen.value = false;
        revoke();
      }
    };

    const toggleFullscreen = () => {
      isFullscreen.value = !isFullscreen.value;
    };

    const emitUploadedWithURI = (uri: string) => {
      emit('uploaded-with-uri', uri);
    };

    const emitUploaded = () => {
      emit('uploaded');
    };

    const handleUpload = async function () {
      uploading.value = true;
      progress.value = 0;

      try {
        let blob: Blob | null = null;
        if (props.previewImage) {
          const { canvas } = cropper.value.getResult();
          const myCanvas: HTMLCanvasElement = canvas;
          blob = await new Promise<Blob | null>((resolve) =>
            myCanvas.toBlob(resolve, 'image/jpeg', 0.9)
          );
          imgTarget.value = myCanvas.toDataURL();
        } else if (file) {
          blob = file;
        }

        if (!blob) {
          throw new Error('Could not get image blob');
        }

        message.value = 'Preparing upload...';

        const lastProcessedPosition = ref({ current: 0 });
        const fullResponseText = ref({ current: '' });

        const formData: FormData = new FormData();
        formData.append('file', blob, selectedFileName.value);

        const endPoint = props.postEndPoint;

        await axios({
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
                  console.log('onMessage received:', inmessage);
                },
                onInfo: (inmessage) => {
                  // if starts with uri: then emit the uri
                  //uri:/public-api/v1/care/circles/48901819-c9b7-49e6-b965-4e6f7714d26d/files/a6c0242e-721d-4791-83a8-758fd8c565c6
                  if (inmessage.startsWith('uri:')) {
                    emitUploadedWithURI(inmessage.substring(4));
                  }
                  message.value = inmessage;
                },
                onError: (inmessage) => {
                  $q.notify({
                    type: 'negative',
                    message: inmessage,
                  });
                  progress.value = 0;
                  message.value = 'Error: ' + inmessage;
                },
                onProgress: (inProgress) => {
                  progress.value = inProgress / 100;
                  if (inProgress === 100) {
                    emitUploaded();
                  }
                },
              }
            );
          },
        });

        uploading.value = false;
        uploadDialog.value = false;

        $q.notify({
          type: 'positive',
          message: 'Image uploaded successfully!',
        });
      } catch (error) {
        console.error('Error uploading image:', error);
        uploading.value = false;
        $q.notify({
          type: 'negative',
          message: error.message || 'Failed to upload image',
        });
      }
    };

    const read = (blob: Blob) =>
      new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (event) => {
          if (event.target) resolve(event.target.result);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });

    const change = ({ coordinates, canvas }: ChangeEvent) => {
      console.log(coordinates, canvas);
    };

    const revoke = function () {
      if (
        imgSource.value &&
        typeof imgSource.value === 'string' &&
        imgSource.value.startsWith('blob:')
      ) {
        URL.revokeObjectURL(imgSource.value);
      }
      imgSource.value = null;
    };

    onMounted(() => {
      if (
        props.getEndPoint &&
        props.getEndPoint !== 'https://picsum.photos/200'
      ) {
        imageHasError.value = false;
        imgTarget.value = props.getEndPoint;
      }
    });

    onUnmounted(() => {
      revoke();
    });

    return {
      uploadDialog,
      imgSource,
      imgTarget,
      uploaderBase,
      cropper,
      progress,
      message,
      uploading,
      hasImage,
      isFullscreen,
      onFileSelected,
      onFileDropped,
      onImageError,
      onZoneClick,
      handleUpload,
      closeCropDialog,
      toggleFullscreen,
      change,
    };
  },
});
</script>

<style>
.body--dark .b-image-uploader .upload-icon {
  color: var(--q-primary);
}
.body--dark .b-image-uploader .upload-text {
  color: var(--q-grey-3);
}
.body--dark .b-image-uploader .secondary-text {
  color: var(--q-grey-5);
}
.body--dark .b-image-uploader .dialog-header,
.body--dark .b-image-uploader .dialog-actions {
  border-color: var(--q-separator-color);
}
.body--dark .b-image-uploader .cancel-btn {
  color: var(--q-grey-5);
}
.body--dark .b-image-uploader .vue-advanced-cropper,
.body--dark .b-image-uploader .vue-advanced-cropper__background {
  background: var(--q-dark-page);
}
.body--dark .b-image-uploader .vue-simple-handler {
  border-color: var(--q-dark);
}
</style>

<style scoped>
.image-upload-container {
  display: flex;
  justify-content: center;
  align-items: center;
}

:deep(.image-uploader-base .upload-zone.has-content) {
  border: none;
  padding: 0;
}

.uploaded-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 14px;
  transition: transform 0.3s ease;
}

.uploaded-image.hovering {
  transform: scale(1.05);
}

.upload-icon {
  color: #6366f1;
  margin-bottom: 16px;
  transition: transform 0.3s ease;
}

.upload-icon.hovering {
  transform: scale(1.1);
}

.upload-icon.dragging {
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

/* Dialog Styles */
.crop-dialog {
  min-width: 90vw;
  min-height: 90vh;
  max-width: 95vw;
  max-height: 95vh;
  display: flex;
  flex-direction: column;
}

.dialog-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #e5e7eb;
  padding: 16px 24px;
  flex-shrink: 0;
}

.header-actions {
  display: flex;
  gap: 8px;
}

.crop-section {
  flex: 1;
  padding: 16px;
  display: flex;
  flex-direction: column;
  min-height: 0; /* Important for flex child to shrink */
}

.cropper-container {
  flex: 1;
  min-height: 400px;
  position: relative;
}

.image-cropper {
  border-radius: 12px;
  overflow: hidden;
  height: 100% !important;
  width: 100% !important;
}

.progress-section {
  padding: 0 24px 16px;
}

.progress-bar-dialog {
  height: 6px;
  border-radius: 3px;
}

.dialog-actions {
  border-top: 1px solid #e5e7eb;
  padding: 16px 24px;
  gap: 12px;
}

.cancel-btn {
  color: #6b7280;
}

.upload-btn {
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
  border-radius: 8px;
  font-weight: 600;
}

/* Responsive */
@media (max-width: 640px) {
  .crop-dialog {
    min-width: 95vw;
    margin: 0;
  }

  .crop-section {
    padding: 16px;
    min-height: 300px;
  }

  .upload-prompt {
    padding: 24px 16px;
  }

  .primary-text {
    font-size: 14px;
  }

  .secondary-text {
    font-size: 12px;
  }
}

/* Custom cropper styles */
:deep(.vue-advanced-cropper) {
  background: #f9fafb;
  height: 100% !important;
  min-height: 400px;
}

:deep(.vue-advanced-cropper__image) {
  max-height: none !important;
  max-width: none !important;
}

:deep(.vue-advanced-cropper__background) {
  background: #f9fafb;
}

:deep(.vue-advanced-cropper__foreground) {
  border-radius: 8px;
}

:deep(.vue-simple-handler) {
  background: #6366f1;
  border: 2px solid white;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  width: 12px;
  height: 12px;
}

:deep(.vue-simple-line) {
  background: rgba(99, 102, 241, 0.8);
}

:deep(.vue-advanced-cropper__stretcher) {
  height: 100% !important;
}

:deep(.vue-advanced-cropper__area) {
  height: 100% !important;
}
</style>
