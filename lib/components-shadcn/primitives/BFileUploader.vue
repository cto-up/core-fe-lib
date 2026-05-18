<template>
  <div class="file-uploader">
    <UploaderBase
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
      <template #content>
        <div class="p-4 rounded-lg bg-muted">
          <div class="flex items-center justify-between gap-4">
            <div class="flex items-center gap-4 flex-1 min-w-0">
              <div class="text-primary flex-shrink-0">
                <FileImage v-if="isImageFile" class="h-12 w-12" />
                <FileText v-else-if="isPdfFile" class="h-12 w-12" />
                <File v-else class="h-12 w-12" />
              </div>

              <div class="flex-1 min-w-0">
                <div class="font-semibold truncate">
                  {{ selectedFileName }}
                </div>
                <div class="text-sm text-muted-foreground flex gap-3">
                  <span>{{ formatFileSize(selectedFileSize) }}</span>
                  <span>{{ selectedFileType }}</span>
                </div>
              </div>
            </div>

            <div class="flex gap-2">
              <Button
                variant="ghost"
                size="icon"
                title="Replace File"
                @click.stop="replaceFile"
              >
                <Upload class="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                title="Remove File"
                @click.stop="removeFile"
              >
                <Trash2 class="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </template>

      <template #prompt="{ isDragging, isHovering }">
        <div class="flex flex-col items-center">
          <div
            :class="
              cn(
                'mb-4 transition-all',
                hasError && 'text-destructive',
                !hasError && isDragging && 'text-primary scale-110',
                !hasError && isHovering && 'scale-105'
              )
            "
          >
            <AlertCircle v-if="hasError" class="h-12 w-12" />
            <FileUp v-else class="h-12 w-12" />
          </div>

          <div class="text-center">
            <p class="text-sm font-medium mb-1">
              <span v-if="hasError">Upload failed</span>
              <span v-else-if="isDragging">Drop file here</span>
              <span v-else>Select or Drop file here</span>
            </p>

            <p
              v-if="!isDragging && !hasError && showText"
              class="text-xs text-muted-foreground"
            >
              Max {{ formatFileSize(maxFileSize) }} •
              {{ getAcceptDescription() }}
            </p>

            <p v-if="hasError" class="text-sm text-destructive mt-2">
              {{ errorMessage }}
            </p>
          </div>
        </div>
      </template>
    </UploaderBase>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import axios from "axios";
import { UploaderBase } from "../ui/uploader-base";
import { Button } from "../ui/button";
import { useToast } from "../ui/toast";
import {
  File,
  FileImage,
  FileText,
  FileUp,
  Upload,
  Trash2,
  AlertCircle,
} from "lucide-vue-next";
import { cn } from "../utils";
import { handleSSEProgress } from "../../utils/sseHandler";

interface Props {
  postEndPoint: string;
  accept: string;
  showText?: boolean;
  maxFileSize?: number;
  queryParams?: Record<string, any>;
}

const props = withDefaults(defineProps<Props>(), {
  showText: true,
  maxFileSize: 1048576 * 80, // 80MB
  queryParams: () => ({}),
});

const emit = defineEmits<{
  uploaded: [];
  removed: [];
}>();

const { toast } = useToast();

const uploaderBase = ref<InstanceType<typeof UploaderBase>>();
const uploading = ref(false);
const progress = ref(0);
const message = ref("");
const hasError = ref(false);
const errorMessage = ref("");

const selectedFile = ref<File | null>(null);
const selectedFileName = ref("");
const selectedFileSize = ref(0);
const selectedFileType = ref("");

const hasFile = computed(() => selectedFile.value !== null);
const isImageFile = computed(() => selectedFileType.value.startsWith("image/"));
const isPdfFile = computed(() => selectedFileType.value === "application/pdf");

const onZoneClick = () => {
  if (!hasFile.value) {
    uploaderBase.value?.clickFileInput();
  }
};

const validateFile = (file: File): { valid: boolean; error?: string } => {
  if (file.size > props.maxFileSize) {
    return {
      valid: false,
      error: `File size exceeds ${formatFileSize(props.maxFileSize)} limit`,
    };
  }

  if (props.accept && props.accept !== "*/*") {
    const acceptedTypes = props.accept.split(",").map((type) => type.trim());
    const fileType = file.type;
    const fileExtension = "." + file.name.split(".").pop()?.toLowerCase();

    const isAccepted = acceptedTypes.some((acceptType) => {
      if (acceptType.startsWith(".")) {
        return acceptType === fileExtension;
      } else if (acceptType.includes("*")) {
        const baseType = acceptType.split("/")[0];
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
  errorMessage.value = "";
};

const clearFile = () => {
  selectedFile.value = null;
  selectedFileName.value = "";
  selectedFileSize.value = 0;
  selectedFileType.value = "";
  progress.value = 0;
  message.value = "";
  hasError.value = false;
  errorMessage.value = "";
};

const processFile = (file: File) => {
  const validation = validateFile(file);

  if (!validation.valid) {
    hasError.value = true;
    errorMessage.value = validation.error || "Invalid file";
    toast({
      title: validation.error,
      variant: "destructive",
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
  emit("removed");
};

const handleUpload = () => {
  if (!selectedFile.value) return;

  uploading.value = true;
  progress.value = 0;
  message.value = "Preparing upload...";
  hasError.value = false;

  const formData = new FormData();
  formData.append("file", selectedFile.value);

  const lastProcessedPosition = ref({ current: 0 });
  const fullResponseText = ref({ current: "" });

  let url = props.postEndPoint;
  if (props.queryParams && Object.keys(props.queryParams).length > 0) {
    const params = new URLSearchParams();
    Object.entries(props.queryParams).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, String(value));
      }
    });
    url = `${props.postEndPoint}?${params.toString()}`;
  }

  axios({
    url,
    data: formData,
    headers: {
      "Content-Type": "multipart/form-data",
    },
    method: "POST",
    onDownloadProgress: (progressEvent) => {
      handleSSEProgress(
        progressEvent,
        lastProcessedPosition.value,
        fullResponseText.value,
        {
          onMessage: (inmessage: string) => {
            message.value = inmessage;
          },
          onInfo: (inmessage: string) => {
            message.value = inmessage;
          },
          onError: (inmessage: string) => {
            toast({
              title: inmessage,
              variant: "destructive",
            });
            progress.value = 0;
            message.value = "Error: " + inmessage;
            hasError.value = true;
            errorMessage.value = inmessage;
            uploading.value = false;
          },
          onProgress: (inProgress: number) => {
            progress.value = inProgress / 100;
            if (inProgress === 100) {
              emit("uploaded");
              message.value = "Upload complete!";
              setTimeout(() => {
                uploading.value = false;
                clearFile();
              }, 2000);
            }
          },
        }
      );
    },
  })
    .then(() => {
      // Handle success if needed
    })
    .catch((error: Error) => {
      console.error("Error uploading file:", error);
      uploading.value = false;
      hasError.value = true;
      errorMessage.value = error.message;
      toast({
        title: "Upload failed",
        description: error.message,
        variant: "destructive",
      });
    });
};

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

const getAcceptDescription = (): string => {
  if (!props.accept || props.accept === "*/*") {
    return "All files";
  }

  const types = props.accept.split(",").map((type) => type.trim());
  const descriptions = types.map((type) => {
    if (type.includes("image/")) return "Images";
    if (type.includes("video/")) return "Videos";
    if (type.includes("audio/")) return "Audio";
    if (type.includes("application/pdf")) return "PDF";
    if (type.includes("text/")) return "Text files";
    return type;
  });

  return [...new Set(descriptions)].join(", ");
};
</script>
