<template>
  <Card class="qr-display">
    <CardContent class="pt-6">
      <div ref="displayContent" class="display-content space-y-4">
        <h1 v-if="title" class="text-2xl font-bold text-center">
          {{ title }}
        </h1>
        <h2 v-if="subtitle" class="text-lg text-muted-foreground text-center">
          {{ subtitle }}
        </h2>

        <div
          class="qr-code-container flex justify-center p-4 bg-white rounded-lg"
          :class="{ 'cursor-pointer': clickable }"
          @click="handleClick"
        >
          <canvas ref="qrCanvas" class="qr-code" />
        </div>

        <div class="flex justify-center">
          <Button variant="outline" @click="exportAsImage">
            <Download class="mr-2 h-4 w-4" />
            Export as Image
          </Button>
        </div>
      </div>
    </CardContent>
  </Card>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, type Ref } from "vue";
import QRCodeLib from "qrcode";
import { Card, CardContent } from "../card";
import { Button } from "../button";
import { Download } from "lucide-vue-next";

interface Props {
  title?: string;
  subtitle?: string;
  url: string;
  size?: number;
  clickable?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  title: "",
  subtitle: "",
  url: "",
  size: 256,
  clickable: true,
});

const emit = defineEmits<{
  click: [];
}>();

const qrCanvas: Ref<HTMLCanvasElement | null> = ref(null);
const displayContent: Ref<HTMLDivElement | null> = ref(null);

const generateQR = async (text: string, canvas: HTMLCanvasElement) => {
  try {
    await QRCodeLib.toCanvas(canvas, text, {
      width: props.size,
      margin: 2,
      color: {
        dark: "#000000",
        light: "#FFFFFF",
      },
    });
  } catch (error) {
    console.error("Error generating QR code:", error);
  }
};

const handleClick = () => {
  if (props.clickable) {
    emit("click");
  }
};

const exportAsImage = async () => {
  if (!displayContent.value || !qrCanvas.value) return;

  try {
    const exportCanvas = document.createElement("canvas");
    const ctx = exportCanvas.getContext("2d");
    if (!ctx) return;

    const width = 400;
    const height = props.title || props.subtitle ? 500 : 350;
    exportCanvas.width = width;
    exportCanvas.height = height;

    // Fill white background
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, width, height);

    let yOffset = 40;

    // Draw title
    if (props.title) {
      ctx.fillStyle = "#333333";
      ctx.font = "bold 24px Arial, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(props.title, width / 2, yOffset);
      yOffset += 40;
    }

    // Draw subtitle
    if (props.subtitle) {
      ctx.fillStyle = "#666666";
      ctx.font = "16px Arial, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(props.subtitle, width / 2, yOffset);
      yOffset += 40;
    }

    // Draw QR code
    const qrSize = props.size;
    const qrX = (width - qrSize) / 2;
    const qrY = yOffset;

    // Draw QR code background/border
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(qrX - 10, qrY - 10, qrSize + 20, qrSize + 20);
    ctx.strokeStyle = "#dddddd";
    ctx.lineWidth = 1;
    ctx.strokeRect(qrX - 10, qrY - 10, qrSize + 20, qrSize + 20);

    // Draw the QR code from the canvas
    ctx.drawImage(qrCanvas.value, qrX, qrY, qrSize, qrSize);

    // Convert canvas to blob and download
    exportCanvas.toBlob((blob: Blob | null) => {
      if (!blob) return;

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `qr-code-${Date.now()}.png`;
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
  if (qrCanvas.value && props.url) {
    generateQR(props.url, qrCanvas.value);
  }
});

watch(
  () => props.url,
  (newUrl: string) => {
    if (qrCanvas.value && newUrl) {
      generateQR(newUrl, qrCanvas.value);
    }
  }
);
</script>

<style scoped>
.qr-code-container {
  transition: transform 0.2s ease;
}

.qr-code-container.cursor-pointer:hover {
  transform: scale(1.02);
}

.qr-code {
  border-radius: 8px;
}
</style>
