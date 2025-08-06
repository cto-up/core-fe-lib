<template>
  <q-uploader
    ref="uploader"
    class="full-width"
    label="Select or Drop file here (max 80mb)"
    flat
    hide-upload-btn
    :multiple="false"
    :accept="accept"
    :text-color="$q.dark.mode ? 'primary' : 'black'"
    :color="$q.dark.mode ? 'black' : 'primary'"
    @added="handleUpload"
    @removed="progress = 0"
    :filter="checkFileSize"
    @rejected="onRejected"
  />
  <q-linear-progress
    class="full-width"
    size="30px"
    :color="progressColor"
    :value="progress"
  >
    <div class="absolute-full flex flex-center">
      <div style="font-size: medium">{{ message }}</div>
    </div>
  </q-linear-progress>
</template>

<script lang="ts">
import axios from "axios";

import { computed, defineComponent, ref } from "vue";
import { type QRejectedEntry, type QUploader, useQuasar } from "quasar";
import { handleSSEProgress } from "../utils/sseHandler";

interface Option {
  size: number;
}

export default defineComponent({
  name: "FileUploadComponent",
  components: {},
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
      default: 1048576,
    },
  },
  setup(props, { emit }) {
    const $q = useQuasar();
    const uploader = ref<InstanceType<typeof QUploader>>();
    const fileInput = ref();
    const uploading = ref(false);
    const progress = ref(0.0);
    const progressStatus = ref("INFO");
    const progressColor = computed(() =>
      progressStatus.value == "INFO" ? "primary" : "negative"
    );
    const checkFileSize = function (files: readonly File[] | FileList) {
      if (Array.isArray(files)) {
        return files.filter((file) => file.size < props.maxFileSize);
      }
      return [];
    };

    const onRejected = function (rejectedEntries: QRejectedEntry[]) {
      // Notify plugin needs to be installed
      // https://quasar.dev/quasar-plugins/notify#Installation
      $q.notify({
        type: "negative",
        message:
          `${rejectedEntries.length} file(s) did not pass validation constraints` +
          JSON.stringify(rejectedEntries),
      });
    };
    const message = ref("");

    const selectedFile = ref<null | Blob>(null);

    const option = ref<Option>({
      size: 1,
      // outputType: 'jpeg', // jpeg || png || webp
    });

    const emitUploaded = () => {
      emit("uploaded");
    };

    const handleUpload = function (files: readonly File[]) {
      uploading.value = true;
      selectedFile.value = files[0];
      // Create a FormData object and append the Blob to it
      const formData: FormData = new FormData();
      formData.append("file", selectedFile.value as Blob);
      // Use refs for tracking position and full response
      const lastProcessedPosition = ref({
        current: 0,
      });
      const fullResponseText = ref({
        current: "",
      });

      // Now, use Axios to upload the image
      const endPoint = props.postEndPoint;

      axios({
        url: endPoint,
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
              onMessage: (inmessage) => {
                message.value = inmessage;
              },
              onInfo: (inmessage) => {
                message.value = inmessage;
              },
              onError: (inmessage) => {
                $q.notify({
                  type: "negative",
                  message: inmessage,
                });
                progress.value = 0;
                uploader.value?.reset();
                message.value = "Err: " + inmessage;
              },
              onProgress: (inProgress) => {
                progress.value = inProgress / 100;

                uploader.value?.updateFileStatus(
                  selectedFile.value as File,
                  "uploading",
                  10
                );
                if (inProgress === 100) {
                  if (
                    uploader.value != undefined &&
                    selectedFile.value != null
                  ) {
                    emitUploaded();
                    uploader.value?.updateFileStatus(
                      selectedFile.value as File,
                      "uploaded",
                      10
                    );
                    progress.value = 0;
                    uploader.value.reset();
                    message.value = "Done";
                    //uploader.value?.removeFile(selectedFile.value as File);
                  }
                }
              },
            }
          );
        },
      })
        .then(() => {
          uploading.value = false;
        })
        .catch((error: Error) => {
          console.error("Error uploading image:", error);
          $q.notify({
            type: "negative",
            message: error.message,
          });
        });
    };
    return {
      checkFileSize,
      onRejected,
      progress,
      progressColor,
      message,
      fileInput,
      option,
      uploader,
      handleUpload,
    };
  },
});
</script>

<style scoped></style>
