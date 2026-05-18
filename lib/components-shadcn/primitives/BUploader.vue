<template>
  <div class="b-uploader">
    <input
      ref="fileInput"
      type="file"
      :accept="accept"
      class="sr-only"
      @change="onInputChange"
    />

    <!-- ── Drop zone ───────────────────────────────────────────── -->
    <div
      :class="
        cn(
          'drop-zone rounded-lg border-4 border-dashed transition-all min-h-[200px] relative',
          isDragging ? 'border-primary bg-primary/5' : '',
          isHovering ? 'border-primary/50 bg-accent' : '',
          hasError ? 'border-destructive bg-destructive/5' : '',
          !isDragging && !hasError ? 'border-muted-foreground/25' : ''
        )
      "
      @click="onZoneClick"
      @dragover.prevent="onDragOver"
      @dragleave.prevent="onDragLeave"
      @drop.prevent="onDrop"
      @mouseenter="isHovering = true"
      @mouseleave="isHovering = false"
    >
      <!-- ── Crop toggle (top-right, inside zone) ──────────────── -->
      <div
        v-if="acceptsImages"
        class="absolute bottom-2 right-2 z-10 flex items-center gap-1.5 rounded-full border border-border bg-background/85 backdrop-blur px-2.5 py-1"
        @click.stop
      >
        <Switch :id="cropSwitchId" v-model:checked="cropEnabled" />
        <label :for="cropSwitchId" class="crop-toggle-label" @click.stop>
          <Crop class="h-3.5 w-3.5" />
          {{ t("common.uploader.cropImage") }}
        </label>
      </div>

      <!-- inner flex wrapper for content centering -->
      <div
        class="flex flex-col items-center justify-center min-h-[196px] w-full"
      >
        <!-- Uploading overlay -->
        <div
          v-if="uploading"
          class="absolute inset-0 flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm rounded-lg z-10"
        >
          <Loader2 class="h-12 w-12 animate-spin text-primary mb-4" />
          <p class="text-sm text-muted-foreground">
            {{ message || t("common.uploader.uploading") }}
          </p>
          <Progress
            v-if="progress > 0"
            :model-value="progress * 100"
            class="w-64 mt-4"
          />
        </div>

        <!-- Image preview (imageMode) -->
        <template v-if="hasContent && isImageMode">
          <img
            class="uploaded-image"
            :class="{ hovering: isHovering }"
            :src="imgTarget"
            loading="lazy"
            alt="Uploaded image"
            @error="onImageError"
          />
        </template>

        <!-- File card (non-imageMode) — shown above the prompt -->
        <div v-else-if="hasContent" class="px-4 pt-4 w-full">
          <div
            class="flex items-center justify-between gap-4 rounded-lg bg-muted p-3"
          >
            <div class="flex items-center gap-3 flex-1 min-w-0">
              <div class="text-primary flex-shrink-0">
                <FileImage v-if="isImageFile" class="h-10 w-10" />
                <FileText v-else-if="isPdfFile" class="h-10 w-10" />
                <FileIcon v-else class="h-10 w-10" />
              </div>
              <div class="flex-1 min-w-0">
                <div class="font-semibold truncate text-sm">
                  {{ selectedFileName }}
                </div>
                <div class="text-xs text-muted-foreground flex gap-2 mt-0.5">
                  <span>{{ formatFileSize(selectedFileSize) }}</span>
                  <span>{{ selectedFileType }}</span>
                </div>
              </div>
            </div>
            <div class="flex gap-1 flex-shrink-0">
              <Button
                variant="ghost"
                size="icon"
                title="Replace"
                @click.stop="replaceFile"
              >
                <Upload class="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                title="Remove"
                @click.stop="removeFile"
              >
                <Trash2 class="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        <!-- Prompt: image mode -->
        <template v-if="isImageMode">
          <div
            class="flex flex-col items-center justify-center p-8 text-center"
          >
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
            <div class="mt-3">
              <p class="text-sm font-semibold">
                {{
                  isDragging
                    ? t("common.uploader.dropImageHere")
                    : hasContent
                      ? t("common.uploader.clickToReplaceImage")
                      : t("common.uploader.clickToUploadImage")
                }}
              </p>
              <p
                v-if="!isDragging && showText"
                class="text-sm text-muted-foreground mt-1"
              >
                {{ t("common.uploader.orDragAndDrop") }}
              </p>
            </div>
          </div>
        </template>

        <!-- Prompt: generic -->
        <template v-else>
          <div
            class="flex flex-col items-center justify-center p-8 text-center"
          >
            <div
              :class="
                cn(
                  'mb-4 transition-all',
                  hasError
                    ? 'text-destructive'
                    : isDragging
                      ? 'text-primary scale-110'
                      : isHovering
                        ? 'scale-105 text-muted-foreground'
                        : 'text-muted-foreground'
                )
              "
            >
              <AlertCircle v-if="hasError" class="h-12 w-12" />
              <FileUp v-else class="h-12 w-12" />
            </div>
            <p class="text-sm font-medium mb-1">
              <span v-if="hasError">{{
                t("common.uploader.uploadFailed")
              }}</span>
              <span v-else-if="isDragging">{{
                t("common.uploader.dropFileHere")
              }}</span>
              <span v-else-if="hasContent">{{
                t("common.uploader.dropAnotherFile")
              }}</span>
              <span v-else>{{ t("common.uploader.selectOrDropFile") }}</span>
            </p>
            <p
              v-if="!isDragging && !hasError && showText"
              class="text-xs text-muted-foreground"
            >
              Max {{ formatFileSize(maxFileSize) }} •
              <span
                :title="acceptTooltip || undefined"
                :class="
                  acceptTooltip ? 'underline decoration-dotted cursor-help' : ''
                "
                >{{ acceptSummary }}</span
              >
            </p>
            <p v-if="hasError" class="text-sm text-destructive mt-2">
              {{ errorMessage }}
            </p>
          </div>
        </template>
      </div>
      <!-- end inner flex wrapper -->
    </div>

    <!-- ── Crop modal — position:fixed so it covers the viewport from wherever it sits in the DOM ── -->
    <div v-if="uploadDialog" class="crop-overlay" @click.self="closeCropDialog">
      <div
        class="crop-modal"
        :class="{ 'crop-modal--fullscreen': isFullscreen }"
      >
        <div class="crop-modal-header">
          <span class="crop-modal-title">{{
            t("common.uploader.cropImageTitle")
          }}</span>
          <div class="flex gap-1">
            <Button variant="ghost" size="icon" @click="toggleFullscreen">
              <Minimize2 v-if="isFullscreen" class="h-4 w-4" />
              <Maximize2 v-else class="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" @click="closeCropDialog">
              <X class="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div class="crop-modal-body">
          <cropper
            v-if="imgSource"
            ref="cropperRef"
            :src="imgSource"
            :stencil-props="{
              aspectRatio,
              handlers: {},
              movable: true,
              resizable: true,
            }"
            :resize-image="{ adjustStencil: false }"
            :canvas="{ maxArea: 2096 * 2096 }"
            class="image-cropper"
          />
        </div>

        <div v-if="uploading" class="px-6 py-3">
          <Progress :model-value="progress * 100" class="h-1.5" />
          <p class="text-sm text-muted-foreground mt-2">
            {{ message }}
          </p>
        </div>

        <div class="crop-modal-footer">
          <Button
            variant="outline"
            :disabled="uploading"
            @click="closeCropDialog"
          >
            {{ t("common.uploader.cancel") }}
          </Button>
          <Button
            :disabled="uploading"
            class="upload-btn"
            @click="handleCropUpload"
          >
            <Loader2 v-if="uploading" class="h-4 w-4 mr-2 animate-spin" />
            {{ t("common.uploader.upload") }}
          </Button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Cropper } from "vue-advanced-cropper";
import "vue-advanced-cropper/dist/style.css";
import axios from "axios";
import { ref, computed, onMounted, onUnmounted, useId, watch } from "vue";
import { useI18n } from "vue-i18n";
import { handleSSEProgress } from "../../utils/sseHandler";
import { Button } from "./button";
import { Progress } from "./progress";
import { Switch } from "./switch";
import { useToast } from "./toast/use-toast";
import {
  AlertCircle,
  FileUp,
  FileImage,
  FileText,
  Loader2,
  Upload,
  Trash2,
  X,
  Maximize2,
  Minimize2,
  Crop,
} from "lucide-vue-next";
import { File as FileIcon } from "lucide-vue-next";
import { cn } from "../utils";

// ── Props ──────────────────────────────────────────────────────────────────
const props = withDefaults(
  defineProps<{
    getEndPoint?: string;
    postEndPoint: string;
    accept?: string;
    maxFileSize?: number;
    thresholdImageSize?: number;
    showText?: boolean;
    aspectRatio?: number;
    imageMode?: boolean;
    previewImage?: boolean;
  }>(),
  {
    accept: "*/*",
    maxFileSize: 50 * 1024 * 1024,
    thresholdImageSize: 2 * 1024 * 1024,
    showText: true,
    aspectRatio: undefined,
    imageMode: false,
    previewImage: true,
  }
);

const emit = defineEmits<{
  (e: "uploaded"): void;
  (e: "uploaded-with-uri", uri: string): void;
  (e: "removed"): void;
}>();

// ── Refs ───────────────────────────────────────────────────────────────────
const fileInput = ref<HTMLInputElement>();
const cropperRef = ref();
const { toast } = useToast();

const uploading = ref(false);
const progress = ref(0);
const message = ref("");
const isDragging = ref(false);
const isHovering = ref(false);
const dragCounter = ref(0);
const isFullscreen = ref(false);
const cropEnabled = ref(true);

// crop modal state
const uploadDialog = ref(false);
const imgSource = ref<string | null>(null);

// file state
const selectedFileName = ref("");
const selectedFileSize = ref(0);
const selectedFileType = ref("");
const imgTarget = ref("");
const imageHasError = ref(false);
const errorMessage = ref("");
const hasError = ref(false);

// pending file for non-crop path
const pendingFile = ref<File | null>(null);

// ── Computed ───────────────────────────────────────────────────────────────
const cropSwitchId = useId();
const { t } = useI18n();

const isImageMode = computed(() => props.imageMode);

const IMAGE_EXTENSIONS = [
  ".jpg",
  ".jpeg",
  ".png",
  ".gif",
  ".bmp",
  ".tiff",
  ".tif",
  ".webp",
  ".svg",
  ".heic",
  ".avif",
];

const acceptsImages = computed(() => {
  if (!props.accept) return false;
  const a = props.accept.toLowerCase();
  if (a === "*/*" || a === "*" || a.includes("image/")) return true;
  // extension-based accept (e.g. ".jpg,.png")
  return IMAGE_EXTENSIONS.some((ext) => a.includes(ext));
});

const isCropableImage = (file: File) => {
  return ["image/jpeg", "image/jpg", "image/png", "image/webp"].includes(
    file.type
  );
};

const hasContent = computed(() => {
  if (isImageMode.value) {
    if (!props.previewImage) return false;
    if (imageHasError.value) return false;
    return !!imgTarget.value && !imgTarget.value.includes("picsum.photos");
  }
  return !!selectedFileName.value;
});

const isImageFile = computed(() => selectedFileType.value.startsWith("image/"));
const isPdfFile = computed(() => selectedFileType.value === "application/pdf");

const acceptDescription = computed(() => {
  if (!props.accept || props.accept === "*/*") return "All files";
  return props.accept
    .split(",")
    .map((t) => t.trim().split("/").pop()?.toUpperCase())
    .join(", ");
});

// Maps known extension/mime groups to human labels
const AUDIO_EXTS = [
  ".mp3",
  ".wav",
  ".ogg",
  ".flac",
  ".aac",
  ".m4a",
  ".wma",
  ".amr",
  ".aiff",
];
const VIDEO_EXTS = [".mp4", ".mov", ".avi", ".mkv", ".webm"];
const DOC_EXTS = [".pdf", ".doc", ".docx", ".xls", ".xlsx", ".ppt", ".pptx"];

const acceptSummary = computed(() => {
  if (!props.accept || props.accept === "*/*" || props.accept === "*")
    return t("common.uploader.allFiles");
  const a = props.accept.toLowerCase();
  const labels: string[] = [];
  if (IMAGE_EXTENSIONS.some((e) => a.includes(e)) || a.includes("image/"))
    labels.push(t("common.uploader.imagesSupported"));
  if (AUDIO_EXTS.some((e) => a.includes(e)) || a.includes("audio/"))
    labels.push(t("common.uploader.audioSupported"));
  if (VIDEO_EXTS.some((e) => a.includes(e)) || a.includes("video/"))
    labels.push(t("common.uploader.videoSupported"));
  if (DOC_EXTS.some((e) => a.includes(e)))
    labels.push(t("common.uploader.documentsSupported"));
  if (labels.length === 0) return acceptDescription.value;
  return labels.join(" & ");
});

const acceptTooltip = computed(() => {
  if (!props.accept || props.accept === "*/*") return "";
  return props.accept
    .split(",")
    .map((t) => t.trim().replace(/^\./, "").toUpperCase())
    .join(", ");
});

// ── Helpers ────────────────────────────────────────────────────────────────
const formatFileSize = (bytes: number) => {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
};

const readAsDataURL = (blob: Blob): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target!.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });

const revokeImgSource = () => {
  if (imgSource.value?.startsWith("blob:")) {
    URL.revokeObjectURL(imgSource.value);
  }
  imgSource.value = null;
};

// ── Silent compression ─────────────────────────────────────────────────────
const compressImage = async (file: File): Promise<File> => {
  const MAX_DIM = 1920;
  const QUALITIES = [0.85, 0.7, 0.55];
  const threshold = props.thresholdImageSize;

  if (file.size <= threshold) return file;

  const bitmap = await createImageBitmap(file);
  const { width, height } = bitmap;

  let targetW = width;
  let targetH = height;
  if (width > MAX_DIM || height > MAX_DIM) {
    const ratio = Math.min(MAX_DIM / width, MAX_DIM / height);
    targetW = Math.round(width * ratio);
    targetH = Math.round(height * ratio);
  }

  const canvas = document.createElement("canvas");
  canvas.width = targetW;
  canvas.height = targetH;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(bitmap, 0, 0, targetW, targetH);
  bitmap.close();

  for (const quality of QUALITIES) {
    const blob = await new Promise<Blob | null>((res) =>
      canvas.toBlob(res, "image/jpeg", quality)
    );
    if (blob && blob.size <= threshold) {
      return new File([blob], file.name.replace(/\.[^.]+$/, ".jpg"), {
        type: "image/jpeg",
      });
    }
  }

  // Return best effort (lowest quality)
  const blob = await new Promise<Blob | null>((res) =>
    canvas.toBlob(res, "image/jpeg", 0.55)
  );
  return blob
    ? new File([blob], file.name.replace(/\.[^.]+$/, ".jpg"), {
        type: "image/jpeg",
      })
    : file;
};

// ── Validation ─────────────────────────────────────────────────────────────
const validateFile = (file: File): boolean => {
  if (file.size > props.maxFileSize) {
    errorMessage.value = t("common.uploader.fileTooLarge", {
      max: formatFileSize(props.maxFileSize),
    });
    hasError.value = true;
    toast({
      title: t("common.uploader.fileTooLarge", {
        max: formatFileSize(props.maxFileSize),
      }),
      description: errorMessage.value,
      variant: "destructive",
    });
    return false;
  }
  hasError.value = false;
  errorMessage.value = "";
  return true;
};

// ── Upload via SSE ─────────────────────────────────────────────────────────
const uploadFile = async (file: File) => {
  uploading.value = true;
  progress.value = 0;
  message.value = "Preparing upload…";

  try {
    const lastPos = { current: 0 };
    const fullText = { current: "" };
    const formData = new FormData();
    formData.append("file", file, file.name);

    await axios({
      url: props.postEndPoint,
      method: "POST",
      data: formData,
      headers: { "Content-Type": "multipart/form-data" },
      onDownloadProgress: (progressEvent) => {
        handleSSEProgress(progressEvent, lastPos, fullText, {
          onMessage: (msg) => {
            message.value = msg;
          },
          onInfo: (msg) => {
            if (msg.startsWith("uri:")) {
              let uri = msg.substring(4);
              if (uri.startsWith("/")) {
                uri = `${import.meta.env.VITE_HTTP_API ?? ""}${uri}`;
              }
              emit("uploaded-with-uri", uri);
              // if (isImageMode.value) imgTarget.value = uri;
              // Do NOT overwrite imgTarget with the remote URL here:
              // imgTarget already holds the local data URL (from crop/readAsDataURL)
              // which renders reliably. Fetching the remote URL cross-origin in
              // production fails (no cookies sent on <img> requests) and would
              // hide the image after a successful upload.
            }
            message.value = msg;
          },
          onError: (msg) => {
            toast({
              title: t("common.uploader.uploadErrorServer"),
              description: msg,
              variant: "destructive",
            });
            message.value = msg;
            progress.value = 0;
          },
          onProgress: (p) => {
            progress.value = p / 100;
            if (p === 100) emit("uploaded");
          },
        });
      },
    });

    toast({ title: t("common.uploader.uploadSuccess") });
  } catch (err: unknown) {
    toast({
      title: t("common.uploader.uploadError"),
      description:
        (err instanceof Error ? err.message : null) ||
        t("common.uploader.uploadErrorDesc"),
      variant: "destructive",
    });
  } finally {
    uploading.value = false;
  }
};

// ── Process file ───────────────────────────────────────────────────────────
const processFile = async (file: File) => {
  if (!validateFile(file)) return;

  selectedFileName.value = file.name;
  selectedFileSize.value = file.size;
  selectedFileType.value = file.type;

  if (cropEnabled.value && isCropableImage(file)) {
    // Open crop dialog
    revokeImgSource();
    imgSource.value = await readAsDataURL(file);
    uploadDialog.value = true;
    return;
  }

  // No crop — compress if needed then upload
  let finalFile = file;
  if (isCropableImage(file)) {
    finalFile = await compressImage(file);
  }

  pendingFile.value = finalFile;

  if (isImageMode.value) {
    imgTarget.value = await readAsDataURL(finalFile);
    imageHasError.value = false;
  }

  await uploadFile(finalFile);
};

// ── Crop upload ────────────────────────────────────────────────────────────
const handleCropUpload = async () => {
  if (!cropperRef.value) return;

  const { canvas } = cropperRef.value.getResult();
  if (!canvas) return;

  uploading.value = true;

  try {
    let blob: Blob = await new Promise<Blob>((res) =>
      canvas.toBlob((b: Blob | null) => res(b!), "image/jpeg", 0.9)
    );

    // Compress if still over threshold
    const threshold = props.thresholdImageSize;
    if (blob.size > threshold) {
      const QUALITIES = [0.85, 0.7, 0.55];
      for (const q of QUALITIES) {
        const compressed: Blob = await new Promise<Blob>((res) =>
          canvas.toBlob((b: Blob | null) => res(b!), "image/jpeg", q)
        );
        blob = compressed;
        if (blob.size <= threshold) break;
      }
    }

    const fileName = selectedFileName.value.replace(/\.[^.]+$/, ".jpg");
    const file = new File([blob], fileName, { type: "image/jpeg" });

    if (isImageMode.value) {
      imgTarget.value = canvas.toDataURL("image/jpeg", 0.9);
      imageHasError.value = false;
    }

    uploadDialog.value = false;
    revokeImgSource();

    await uploadFile(file);
  } finally {
    uploading.value = false;
  }
};

const closeCropDialog = () => {
  if (uploading.value) return;
  uploadDialog.value = false;
  isFullscreen.value = false;
  revokeImgSource();
  // Reset file input so same file can be re-selected
  if (fileInput.value) fileInput.value.value = "";
};

const toggleFullscreen = () => {
  isFullscreen.value = !isFullscreen.value;
};

// ── Input / drag handlers ──────────────────────────────────────────────────
const onInputChange = async (event: Event) => {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  if (!file) return;
  target.value = "";
  await processFile(file);
};

const onZoneClick = () => {
  fileInput.value?.click();
};

const onDragOver = (e: DragEvent) => {
  e.preventDefault();
  dragCounter.value++;
  isDragging.value = true;
};

const onDragLeave = (e: DragEvent) => {
  e.preventDefault();
  dragCounter.value--;
  if (dragCounter.value <= 0) {
    dragCounter.value = 0;
    isDragging.value = false;
  }
};

const onDrop = async (e: DragEvent) => {
  isDragging.value = false;
  dragCounter.value = 0;
  const file = e.dataTransfer?.files?.[0];
  if (file) await processFile(file);
};

const onImageError = () => {
  imageHasError.value = true;
};

// ── File management ────────────────────────────────────────────────────────
const replaceFile = () => {
  fileInput.value?.click();
};

const removeFile = () => {
  selectedFileName.value = "";
  selectedFileSize.value = 0;
  selectedFileType.value = "";
  imgTarget.value = "";
  imageHasError.value = false;
  if (fileInput.value) fileInput.value.value = "";
  emit("removed");
};

// ── Lifecycle ──────────────────────────────────────────────────────────────
onMounted(() => {
  if (props.getEndPoint && !props.getEndPoint.includes("picsum.photos")) {
    imgTarget.value = props.getEndPoint;
    imageHasError.value = false;
  }
});

watch(
  () => props.getEndPoint,
  (newVal) => {
    if (newVal && !newVal.includes("picsum.photos")) {
      imgTarget.value = newVal;
      imageHasError.value = false;
    }
  }
);

onUnmounted(() => {
  revokeImgSource();
});
</script>

<style scoped>
.b-uploader {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.crop-toggle-label {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  font-size: 0.875rem;
  cursor: pointer;
  user-select: none;
}

.drop-zone {
  cursor: pointer;
}

.uploaded-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 0.5rem;
  transition: transform 0.3s ease;
}

.uploaded-image.hovering {
  transform: scale(1.05);
}

/* ── Crop overlay (Teleport) ─────────────────────────────────────────────── */
.crop-overlay {
  position: fixed;
  inset: 0;
  z-index: 9999;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
}

.crop-modal {
  background: hsl(var(--background));
  border: 1px solid hsl(var(--border));
  border-radius: 0.75rem;
  display: flex;
  flex-direction: column;
  width: min(90vw, 900px);
  max-height: min(90vh, 100%);
  overflow: hidden;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.4);
}

.crop-modal--fullscreen {
  width: 100vw;
  height: 100vh;
  max-height: 100vh;
  border-radius: 0;
}

.crop-modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.5rem;
  border-bottom: 1px solid hsl(var(--border));
  flex-shrink: 0;
}

.crop-modal-title {
  font-size: 1rem;
  font-weight: 600;
}

.crop-modal-body {
  flex: 1;
  min-height: 0;
  padding: 1rem;
  display: flex;
  flex-direction: column;
}

.image-cropper {
  flex: 1;
  min-height: 0;
  border-radius: 0.5rem;
  overflow: hidden;
}

.crop-modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
  padding: 1rem 1.5rem;
  border-top: 1px solid hsl(var(--border));
  flex-shrink: 0;
}

/* Cropper internals */
:deep(.vue-advanced-cropper) {
  background: hsl(var(--muted));
  height: 100% !important;
  min-height: 200px;
}

:deep(.vue-advanced-cropper__background) {
  background: hsl(var(--muted));
}

:deep(.vue-simple-handler) {
  background: hsl(var(--primary));
  border: 2px solid white;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  width: 12px;
  height: 12px;
}

:deep(.vue-simple-line) {
  background: hsl(var(--primary) / 0.8);
}
</style>
