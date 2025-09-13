<template>
  <div class="qr-display">
    <div ref="displayContent" class="display-content">
      <h1 v-if="title" class="title">{{ title }}</h1>
      <h2 v-if="subtitle" class="subtitle">{{ subtitle }}</h2>
      <div
        class="qr-code-container"
        style="cursor: pointer"
        @click="$emit('click')"
      >
        <canvas ref="qrCanvas" class="qr-code"></canvas>
      </div>
    </div>
    <div class="controls">
      <b-btn
        @click="exportAsImage"
        label="Export as Image"
        icon="download"
      ></b-btn>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, type Ref } from 'vue';

// Define props with TypeScript
interface Props {
  title: string;
  subtitle: string;
  url: string;
  size: number;
}

const props = withDefaults(defineProps<Props>(), {
  title: '',
  subtitle: '',
  url: '',
  size: 200,
});

defineEmits(['click']);

// Define template refs with proper typing
const qrCanvas: Ref<HTMLCanvasElement | null> = ref(null);
const displayContent: Ref<HTMLDivElement | null> = ref(null);

// Simple QR code generation function
const generateQR = (text: string, canvas: HTMLCanvasElement): void => {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const size = props.size;
  canvas.width = size;
  canvas.height = size;

  // This is a simplified QR code representation
  // For production, use a proper QR code library like 'qrcode'
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, size, size);

  ctx.fillStyle = '#000000';
  const cellSize = size / 25;

  // Create a simple pattern that represents a QR code
  // This is just for demonstration - use a real QR library for actual QR codes
  for (let i = 0; i < 25; i++) {
    for (let j = 0; j < 25; j++) {
      // Simple hash-based pattern generation
      const hash = (text.charCodeAt(i % text.length) * (i + j)) % 7;
      if (hash > 3) {
        ctx.fillRect(i * cellSize, j * cellSize, cellSize, cellSize);
      }
    }
  }

  // Add corner markers (typical QR code feature)
  const markerSize = cellSize * 7;

  // Top-left marker
  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, markerSize, markerSize);
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(
    cellSize,
    cellSize,
    markerSize - 2 * cellSize,
    markerSize - 2 * cellSize,
  );
  ctx.fillStyle = '#000000';
  ctx.fillRect(
    2 * cellSize,
    2 * cellSize,
    markerSize - 4 * cellSize,
    markerSize - 4 * cellSize,
  );

  // Top-right marker
  ctx.fillStyle = '#000000';
  ctx.fillRect(size - markerSize, 0, markerSize, markerSize);
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(
    size - markerSize + cellSize,
    cellSize,
    markerSize - 2 * cellSize,
    markerSize - 2 * cellSize,
  );
  ctx.fillStyle = '#000000';
  ctx.fillRect(
    size - markerSize + 2 * cellSize,
    2 * cellSize,
    markerSize - 4 * cellSize,
    markerSize - 4 * cellSize,
  );

  // Bottom-left marker
  ctx.fillStyle = '#000000';
  ctx.fillRect(0, size - markerSize, markerSize, markerSize);
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(
    cellSize,
    size - markerSize + cellSize,
    markerSize - 2 * cellSize,
    markerSize - 2 * cellSize,
  );
  ctx.fillStyle = '#000000';
  ctx.fillRect(
    2 * cellSize,
    size - markerSize + 2 * cellSize,
    markerSize - 4 * cellSize,
    markerSize - 4 * cellSize,
  );
};

const exportAsImage = async (): Promise<void> => {
  if (!displayContent.value) return;

  try {
    // Create a new canvas for the export
    const exportCanvas = document.createElement('canvas');
    const ctx = exportCanvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size (you can adjust these dimensions)
    const width = 400;
    const height = 500;
    exportCanvas.width = width;
    exportCanvas.height = height;

    // Fill white background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);

    // Draw title
    ctx.fillStyle = '#333333';
    ctx.font = 'bold 24px Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(props.title, width / 2, 60);

    // Draw subtitle
    ctx.fillStyle = '#666666';
    ctx.font = '16px Arial, sans-serif';
    ctx.fillText(props.subtitle, width / 2, 90);

    // Draw QR code
    if (qrCanvas.value) {
      const qrSize = 200;
      const qrX = (width - qrSize) / 2;
      const qrY = 120;

      // Draw QR code background/border
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(qrX - 10, qrY - 10, qrSize + 20, qrSize + 20);
      ctx.strokeStyle = '#dddddd';
      ctx.lineWidth = 1;
      ctx.strokeRect(qrX - 10, qrY - 10, qrSize + 20, qrSize + 20);

      // Draw the QR code from the canvas
      ctx.drawImage(qrCanvas.value, qrX, qrY, qrSize, qrSize);
    }

    // Convert canvas to blob and download
    exportCanvas.toBlob((blob: Blob | null) => {
      if (!blob) return;

      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `qr-display-${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }, 'image/png');
  } catch (error) {
    console.error('Error exporting image:', error);
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
  },
);
</script>

<style scoped>
.qr-display {
  display: flex;
  flex-direction: column;
  align-items: center;
  font-family: Arial, sans-serif;
}

.display-content {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.title {
  font-size: 2rem;
  font-weight: bold;
  color: #333;
  margin: 0 0 0.5rem 0;
  text-align: center;
}

.subtitle {
  font-size: 1.2rem;
  color: #666;
  margin: 0 0 2rem 0;
  text-align: center;
}

.qr-code-container {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 1rem;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.qr-code {
  border: 1px solid #ddd;
  border-radius: 4px;
}

.controls {
  margin-top: 2rem;
}

.export-btn {
  background: #007bff;
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 6px;
  font-size: 1rem;
  cursor: pointer;
  transition: background 0.2s ease;
}

.export-btn:hover {
  background: #0056b3;
}

.export-btn:active {
  transform: translateY(1px);
}
</style>
