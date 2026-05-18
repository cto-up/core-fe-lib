<template>
  <div class="flex flex-col items-center">
    <div ref="displayContent" class="flex flex-col items-center">
      <h1
        v-if="title"
        class="text-3xl font-bold text-foreground mb-2 text-center"
      >
        {{ title }}
      </h1>
      <h2
        v-if="subtitle"
        class="text-xl text-muted-foreground mb-8 text-center"
      >
        {{ subtitle }}
      </h2>
      <div
        class="flex justify-center items-center p-4 bg-white rounded-lg shadow-md border cursor-pointer"
        @click="$emit('click')"
      >
        <canvas ref="qrCanvas" class="rounded" />
      </div>
    </div>
    <div v-if="exportable" class="mt-8">
      <Button variant="default" @click="exportAsImage">
        <Download class="mr-2 h-4 w-4" />
        Export as Image
      </Button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, type Ref } from "vue";
import QRCodeLib from "qrcode";
import { Button } from "../ui/button";
import { Download } from "lucide-vue-next";

// Define props with TypeScript
interface Props {
  title?: string;
  subtitle?: string;
  url: string;
  size?: number;
  exportable?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  title: "",
  subtitle: "",
  url: "",
  size: 256,
  exportable: true,
});

defineEmits(["click"]);

// Define template refs with proper typing
const qrCanvas: Ref<HTMLCanvasElement | null> = ref(null);
const displayContent: Ref<HTMLDivElement | null> = ref(null);

const generateQR = async (
  text: string,
  canvas: HTMLCanvasElement
): Promise<void> => {
  if (!text) return;
  try {
    await QRCodeLib.toCanvas(canvas, text, {
      width: props.size,
      margin: 2,
      errorCorrectionLevel: "M",
    });
  } catch (error) {
    console.error("Error generating QR code:", error);
  }
};

const exportAsImage = async (): Promise<void> => {
  if (!displayContent.value) return;

  try {
    // Create a new canvas for the export
    const exportCanvas = document.createElement("canvas");
    const ctx = exportCanvas.getContext("2d");
    if (!ctx) return;

    // Set canvas size (you can adjust these dimensions)
    const width = 400;
    const height = 500;
    exportCanvas.width = width;
    exportCanvas.height = height;

    // Fill white background
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, width, height);

    // Draw title
    ctx.fillStyle = "#333333";
    ctx.font = "bold 24px Arial, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(props.title, width / 2, 60);

    // Draw subtitle
    ctx.fillStyle = "#666666";
    ctx.font = "16px Arial, sans-serif";
    ctx.fillText(props.subtitle, width / 2, 90);

    // Draw QR code
    if (qrCanvas.value) {
      const qrSize = 200;
      const qrX = (width - qrSize) / 2;
      const qrY = 120;

      // Draw QR code background/border
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(qrX - 10, qrY - 10, qrSize + 20, qrSize + 20);
      ctx.strokeStyle = "#dddddd";
      ctx.lineWidth = 1;
      ctx.strokeRect(qrX - 10, qrY - 10, qrSize + 20, qrSize + 20);

      // Draw the QR code from the canvas
      ctx.drawImage(qrCanvas.value, qrX, qrY, qrSize, qrSize);
    }

    // Convert canvas to blob and download
    exportCanvas.toBlob((blob: Blob | null) => {
      if (!blob) return;

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `qr-display-${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }, "image/png");
  } catch (error) {
    console.error("Error exporting image:", error);
  }
};

onMounted(() => {
  if (qrCanvas.value) {
    generateQR(props.url, qrCanvas.value);
  }
});

watch(
  () => props.url,
  (newUrl: string) => {
    if (qrCanvas.value) {
      generateQR(newUrl, qrCanvas.value);
    }
  }
);
</script>
