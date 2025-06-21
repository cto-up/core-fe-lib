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

    <q-file
      v-model="selectedFile"
      accept="image/png,image/jpeg,image/webp"
      @update:model-value="onPictureChange"
      outlined
      dense
      class="q-mt-sm"
    >
      <template v-slot:prepend>
        <q-icon name="photo" />
      </template>
    </q-file>

    <q-btn
      class="q-mt-sm"
      color="primary"
      :label="uploadLabel || 'Upload'"
      :loading="pictureLoading"
      :disable="!selectedPicture || pictureLoading"
      @click="uploadPicture"
      icon="cloud_upload"
    />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useQuasar } from 'quasar';

const props = defineProps<{
  fetchEndpoint: () => Promise<Blob>;
  uploadEndpoint: (formData: { picture: Blob }) => Promise<unknown>;
  alt?: string;
  emptyText?: string;
  uploadLabel?: string;
}>();

const $q = useQuasar();
const pictureUrl = ref<string | null>(null);
const pictureLoading = ref(false);
const selectedPicture = ref<File | null>(null);
const selectedFile = ref<File | null>(null);

function onPictureChange() {
  if (!selectedFile.value) return;

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
      canvas.getContext('2d').drawImage(img, 0, 0, width, height);

      // Convert to webp
      canvas.toBlob(
        (blob) => {
          if (blob) {
            selectedPicture.value = new File([blob], 'picture.webp', {
              type: 'image/webp',
            });
          }
        },
        'image/webp',
        0.92,
      );
    };
    img.src = event.target.result as string;
  };
  reader.readAsDataURL(selectedFile.value);
}

function uploadPicture() {
  if (!selectedPicture.value) return;
  pictureLoading.value = true;
  props
    .uploadEndpoint({ picture: selectedPicture.value })
    .then(() => {
      pictureLoading.value = false;
      selectedPicture.value = null;
      selectedFile.value = null;
      fetchPicture();
      $q.notify({
        type: 'positive',
        message: 'Image updated successfully',
        icon: 'check_circle',
      });
    })
    .catch((err) => {
      pictureLoading.value = false;
      $q.notify({
        type: 'negative',
        message: err?.response || 'Upload error',
        icon: 'error',
      });
    });
}

function fetchPicture() {
  props
    .fetchEndpoint()
    .then((blob) => {
      if (pictureUrl.value) {
        URL.revokeObjectURL(pictureUrl.value);
      }
      const typedBlob = blob.type
        ? blob
        : new Blob([blob], { type: 'image/webp' });
      pictureUrl.value = URL.createObjectURL(typedBlob);
    })
    .catch(() => {
      pictureUrl.value = null;
    });
}

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
</style>
