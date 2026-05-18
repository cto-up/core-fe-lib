<template>
  <div class="picture-uploader flex flex-col gap-4">
    <div class="preview-container">
      <img
        v-if="pictureUrl"
        :src="pictureUrl"
        :alt="alt"
        class="preview-image rounded-lg border object-cover w-48 h-48 bg-muted/20"
      />
      <div
        v-else
        class="empty-preview flex items-center justify-center w-48 h-48 rounded-lg border bg-muted text-muted-foreground text-sm"
      >
        {{ emptyText || "No image" }}
      </div>
    </div>

    <div class="flex items-center gap-2">
      <Button
        type="button"
        variant="outline"
        size="sm"
        :disabled="uploading"
        @click="triggerFileInput"
      >
        <Upload v-if="!uploading" class="mr-2 h-4 w-4" />
        <Loader2 v-else class="mr-2 h-4 w-4 animate-spin" />
        {{ uploadLabel || "Upload" }}
      </Button>
      <input
        ref="fileInputRef"
        type="file"
        class="hidden"
        :accept="acceptedFormats"
        @change="handleFileChange"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from "vue";
import { Button } from "../ui/button";
import { Upload, Loader2 } from "lucide-vue-next";
import { useNotify } from "../composables/useNotify";

const props = defineProps<{
  fetchEndpoint: () => Promise<Blob>;
  uploadEndpoint: (formData: { picture: Blob }) => Promise<any>;
  alt?: string;
  emptyText?: string;
  uploadLabel?: string;
}>();

const { notify } = useNotify();
const fileInputRef = ref<HTMLInputElement | null>(null);
const pictureUrl = ref<string | null>(null);
const uploading = ref(false);
const acceptedFormats = "image/png,image/jpeg,image/webp";

function triggerFileInput() {
  fileInputRef.value?.click();
}

async function handleFileChange(event: Event) {
  const target = event.target as HTMLInputElement;
  const files = target.files;
  if (!files || files.length === 0) return;

  const file = files[0];
  uploading.value = true;

  try {
    const processedBlob = await processImage(file);
    await props.uploadEndpoint({ picture: processedBlob });

    notify({
      type: "positive",
      message: "Image updated successfully",
    });

    await fetchPicture();
  } catch (err: any) {
    console.error("Failed to upload picture:", err);
    notify({
      type: "negative",
      message: "Failed to upload image",
      caption: err.message || "Unknown error",
    });
  } finally {
    uploading.value = false;
    if (fileInputRef.value) {
      fileInputRef.value.value = "";
    }
  }
}

function processImage(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const reader = new FileReader();

    reader.onload = (event) => {
      img.onload = () => {
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

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Failed to get canvas context"));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error("Failed to process image"));
            }
          },
          "image/webp",
          0.92
        );
      };

      img.onerror = () => reject(new Error("Failed to load image"));
      img.src = event.target!.result as string;
    };

    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
}

function fetchPicture() {
  props
    .fetchEndpoint()
    .then((blob) => {
      if (pictureUrl.value && pictureUrl.value.startsWith("data:")) {
        // No need to revoke data URLs
      } else if (pictureUrl.value && pictureUrl.value.startsWith("blob:")) {
        URL.revokeObjectURL(pictureUrl.value);
      }

      const typedBlob =
        blob.type && blob.type.startsWith("image/")
          ? blob
          : new Blob([blob], { type: "image/webp" });

      const reader = new FileReader();
      reader.onload = (e) => {
        pictureUrl.value = e.target?.result as string;
      };
      reader.readAsDataURL(typedBlob);
    })
    .catch((err) => {
      if (err.status !== 404) {
        console.error("Failed to fetch picture:", err);
      }
      pictureUrl.value = null;
    });
}

onMounted(() => {
  fetchPicture();
});

onUnmounted(() => {
  if (pictureUrl.value && pictureUrl.value.startsWith("blob:")) {
    URL.revokeObjectURL(pictureUrl.value);
  }
});
</script>
