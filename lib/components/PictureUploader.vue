<template>
  <div class="picture-uploader">
    <div class="preview-container">
      <q-img
        v-if="pictureUrl"
        :src="pictureUrl"
        :alt="alt"
        crossorigin="anonymous"
        class="preview-image"
      />
      <div v-else class="empty-preview">
        {{ emptyText || 'No image' }}
      </div>
    </div>

    <q-uploader
      auto-upload
      ref="uploader"
      class="q-mt-sm full-width"
      :label="uploadLabel || 'Upload'"
      :accept="acceptedFormats"
      :multiple="false"
      :factory="factoryFn"
      @uploaded="onUploaded"
      @added="onFileAdded"
    >
    </q-uploader>
  </div>
</template>

<script setup lang="ts">
import { ref, onUnmounted } from 'vue';
import { useQuasar } from 'quasar';

const props = defineProps<{
  fetchEndpoint: () => Promise<Blob>;
  uploadEndpoint: (formData: { picture: Blob }) => Promise<any>;
  alt?: string;
  emptyText?: string;
  uploadLabel?: string;
}>();

const $q = useQuasar();
const pictureUrl = ref<string | null>(null);
const uploader = ref(null);
const acceptedFormats = 'image/png,image/jpeg,image/webp';

// Factory function for q-uploader
function factoryFn(files: File[]) {
  console.log('Factory function called with files:', files);
  const file = files[0];

  return new Promise((resolve, reject) => {
    if (!file) {
      console.error('No file selected');
      reject(new Error('No file selected'));
      return;
    }

    const img = new window.Image();
    const reader = new FileReader();

    reader.onload = (event) => {
      img.onload = () => {
        // Resize if needed
        const maxSize = 1080;
        let { width, height } = img;
        if (width > maxSize || height > maxSize) {
          if (width > height) {
            height = Math.round(height * (maxSize / width));
            width = maxSize;
          } else {
            width = Math.round(width * (maxSize / height));
            height = maxSize;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        canvas.getContext('2d')!.drawImage(img, 0, 0, width, height);

        // Convert to webp
        canvas.toBlob(
          (blob) => {
            if (blob) {
              const webpFile = new File([blob], 'picture.webp', {
                type: 'image/webp',
              });

              // Create FormData with the processed image
              const formData = { picture: webpFile };

              // Use the provided uploadEndpoint
              props
                .uploadEndpoint(formData)
                .then(() => {
                  fetchPicture();
                  resolve({
                    name: file.name,
                    size: blob.size,
                    type: 'image/webp',
                    url: URL.createObjectURL(blob),
                    uploadedSize: blob.size,
                    status: 'uploaded',
                  });
                })
                .catch((err) => {
                  console.error('Failed to upload picture:', err);
                  reject(err?.response || new Error('Upload error'));
                });
            } else {
              reject(new Error('Failed to process image'));
            }
          },
          'image/webp',
          0.92
        );
      };
      img.src = event.target!.result as string;
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

function onUploaded() {
  fetchPicture();
  $q.notify({
    type: 'positive',
    message: 'Image updated successfully',
    icon: 'check_circle',
  });
}

function onFileAdded() {
  // This is triggered when files are added to the uploader
  // You can add additional logic here if needed
}

function fetchPicture() {
  props
    .fetchEndpoint()
    .then((blob) => {
      if (pictureUrl.value) {
        URL.revokeObjectURL(pictureUrl.value);
      }

      // Instead of creating a blob URL, convert to a data URL
      const typedBlob = blob.type
        ? blob
        : new Blob([blob], { type: 'image/webp' });

      // Use FileReader to create a data URL instead of a blob URL
      const reader = new FileReader();
      reader.onload = (e) => {
        pictureUrl.value = e.target?.result as string;
      };
      reader.readAsDataURL(typedBlob);
    })
    .catch((err) => {
      // if not a 404, log the error
      if (err.status !== 404) {
        console.log(err);
        console.error('Failed to fetch picture:', err);
      }
      pictureUrl.value = null;
    });
}

// Clean up any blob URLs when component is unmounted
onUnmounted(() => {
  if (pictureUrl.value && pictureUrl.value.startsWith('blob:')) {
    URL.revokeObjectURL(pictureUrl.value);
  }
});

// Initial fetch
fetchPicture();
</script>

<style lang="scss" scoped>
.picture-uploader {
  .preview-container {
    margin-bottom: 8px;
  }

  .preview-image {
    max-width: 200px;
    max-height: 200px;
    border: 1px solid #eee;
    background: #fafafa;
  }

  .empty-preview {
    width: 100px;
    height: 100px;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 1px solid #eee;
    background: #fafafa;
    color: #999;
  }
}

.body--dark .picture-uploader {
  .preview-image,
  .empty-preview {
    border: 1px solid #4b5563;
    background: #1f2937;
  }

  .empty-preview {
    color: #9ca3af;
  }
}
</style>
