<template>
  <input
    class="file-input"
    ref="fileInput"
    type="file"
    @change="handleAdd"
    @input="handleAdd"
    style="display: none"
    accept="image/*"
  />
  <q-img
    class="cursor-pointer"
    :style="`max-height: ${height}px; max-width: ${width}px;`"
    :src="imgTarget"
    @error="displayFallbackImage"
    @click="fileInput.click()"
    loading="lazy"
  >
    <div v-if="showText" class="absolute-bottom text-h6">Choose an Image</div>
  </q-img>
  <q-dialog v-model="uploadDialog">
    <q-card>
      <q-card-section class="q-pb-none">
        <cropper
          ref="cropper"
          :src="imgSource"
          @change="change"
          :stencil-props="{
            aspectRatio: 1,
          }"
          :canvas="{
            maxArea: 2096 * 2096,
          }"
        />
      </q-card-section>
      <q-card-actions class="q-pa-md" align="right">
        <b-btn label="Close" v-close-popup />
        <b-btn color="primary" label="Upload" @click="handleUpload" />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script lang="ts">
import { Cropper } from 'vue-advanced-cropper';
import 'vue-advanced-cropper/dist/style.css';
import axios from 'axios';
import { defineComponent, onMounted, onUnmounted, ref } from 'vue';
import { useQuasar } from 'quasar';

interface Option {
  size: number;
  outputType: string;
}
interface ChangeEvent {
  coordinates: { x: number; y: number }; // Adjust this based on your actual structure
  canvas: HTMLCanvasElement;
}
export default defineComponent({
  name: 'ImageUploadComponent',
  components: {
    Cropper,
  },
  props: {
    getEndPoint: {
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
    height: {
      type: Number,
      required: true,
    },
    width: {
      type: Number,
      required: true,
    },
  },
  setup(props) {
    const uploadDialog = ref(false);
    const $q = useQuasar();
    const imgSource = ref<string | ArrayBuffer | null>(null);
    const imgTarget = ref<string>('https://picsum.photos/200');
    const fileInput = ref();
    const cropper = ref();
    const uploading = ref(false);

    const option = ref<Option>({
      size: 1,
      outputType: 'jpeg', // jpeg || png || webp
    });

    const handleAdd = async (event: Event): Promise<void> => {
      revoke();
      const target = event.target as HTMLInputElement; // Cast to HTMLInputElement
      if (target && target.files) {
        const files = target.files;
        if (files && files[0]) {
          uploadDialog.value = true;
          imgSource.value = (await read(files[0])) as string;
        }
      }
    };

    const handleUpload = async function () {
      uploading.value = true;
      let myCanvas: HTMLCanvasElement;
      const { canvas } = cropper.value.getResult();
      myCanvas = canvas;
      const blob: Blob | null = await new Promise<Blob | null>((resolve) =>
        myCanvas.toBlob(resolve)
      );

      // Create a FormData object and append the Blob to it
      const formData: FormData = new FormData();
      if (blob) formData.append('file', blob, 'image.jpg'); // 'image' is the field name you want to use

      // Now, use Axios to upload the image
      const endPoint = props.postEndPoint;
      axios
        .post(endPoint, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        })
        .then(() => {
          uploading.value = false;
          imgTarget.value = myCanvas.toDataURL();
          uploadDialog.value = false;
        })
        .catch((error) => {
          console.error('Error uploading image:', error);
          $q.notify({
            type: 'negative',
            message: error.message,
          });
        });
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
      // You able to do different manipulations at a canvas
      // but there we just get a cropped image, that can be used
      // as src for <img/> to preview result
      // this.image = canvas.toDataURL();
    };

    const revoke = function () {
      if (imgSource.value) {
        URL.revokeObjectURL(imgSource.value as string);
        imgSource.value = null;
      }
    };

    function displayFallbackImage() {
      imgTarget.value = 'https://picsum.photos/200';
    }

    onMounted(() => {
      if (props.getEndPoint) {
        imgTarget.value = props.getEndPoint;
      }
      /*const endPoint = props.getEndPoint;
      axios
        .get(endPoint)
        .then((response) => {
          // Encode the string using Base64 encoding.
          const base64String = btoa(encodeURIComponent(response.data));
          const base64Image = `data:image/jpeg;base64,${base64String}`; // + btoa(unescape(encodeURIComponent(response.data)))
          console.log('Image downloaded successfully:');
          console.log(base64Image);
          imgTarget.value = base64Image; // myCanvas.toDataURL()



        })
        .catch((error) => {
          console.error('Error loading image:', error);
        });*/
    });

    onUnmounted(() => {
      revoke();
    });

    return {
      uploadDialog,
      imgSource,
      imgTarget,
      fileInput,
      cropper,
      option,
      handleAdd,
      handleUpload,
      change,
      displayFallbackImage,
    };
  },
});
</script>

<style>
.cropper {
  background: #ddd;
}
</style>
