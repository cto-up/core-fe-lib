<template>
  <div class="audio-player">
    <div class="player-container">
      <!-- Audio element (hidden) -->
      <audio
        ref="audioElement"
        :src="audioUrl"
        preload="metadata"
        @loadedmetadata="onLoadedMetadata"
        @timeupdate="onTimeUpdate"
        @ended="onEnded"
        @play="isPlaying = true"
        @pause="isPlaying = false"
        @loadstart="isLoading = true"
        @canplay="isLoading = false"
        :crossorigin="crossorigin"
      ></audio>

      <!-- Album Art / Waveform Visualization -->
      <div v-if="!compact" class="album-art">
        <div class="waveform">
          <div
            v-for="n in 32"
            :key="n"
            class="wave-bar"
            :style="{ animationDelay: `${n * 0.1}s` }"
            :class="{ active: isPlaying }"
          ></div>
        </div>
      </div>

      <!-- Player Controls -->
      <div class="controls-section">
        <!-- Track Info -->
        <div v-if="!compact" class="track-info">
          <h3 class="track-title">{{ trackTitle || "Audio Track" }}</h3>
          <p class="track-artist">{{ trackArtist || "Unknown Artist" }}</p>
        </div>

        <!-- Progress Bar -->
        <div class="progress-section">
          <span class="time-display">{{ formatTime(currentTime) }}</span>
          <div class="progress-container" @click="seekTo">
            <div class="progress-track"></div>
            <div
              class="progress-fill"
              :style="{ width: progressPercentage + '%' }"
            ></div>
            <div
              class="progress-thumb"
              :style="{ left: progressPercentage + '%' }"
            ></div>
          </div>
          <span class="time-display">{{ formatTime(duration) }}</span>
        </div>

        <!-- Control Buttons -->
        <div class="controls">
          <button class="control-btn secondary" @click="seekBackward">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path
                d="M11.99 5V1l-5 5 5 5V7c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6h-2c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z"
              />
              <text
                x="12"
                y="16"
                text-anchor="middle"
                font-size="8"
                font-weight="bold"
              >
                15
              </text>
            </svg>
          </button>

          <button
            class="control-btn primary play-btn"
            @click="togglePlay"
            :disabled="isLoading"
          >
            <div v-if="isLoading" class="spinner"></div>
            <svg
              v-else-if="!isPlaying"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M8 5v14l11-7z" />
            </svg>
            <svg
              v-else
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
            </svg>
          </button>

          <button class="control-btn secondary" @click="seekForward">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path
                d="M12.01 5V1L17 6l-4.99 5V7c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6h2c0 4.42-3.58 8-8 8s-8-3.58-8-8 3.58-8 8-8z"
              />
              <text
                x="12"
                y="16"
                text-anchor="middle"
                font-size="8"
                font-weight="bold"
              >
                15
              </text>
            </svg>
          </button>
        </div>

        <!-- Volume Control -->
        <div class="volume-section">
          <button class="control-btn secondary" @click="toggleMute">
            <svg
              v-if="volume > 0.5"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path
                d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"
              />
            </svg>
            <svg
              v-else-if="volume > 0"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path
                d="M18.5 12c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM5 9v6h4l5 5V4L9 9H5z"
              />
            </svg>
            <svg
              v-else
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path
                d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"
              />
            </svg>
          </button>
          <div class="volume-slider">
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              v-model="volume"
              @input="setVolume"
              class="volume-input"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, onUnmounted, watch } from "vue";

export default {
  name: "AudioPlayer",
  props: {
    audioUrl: {
      type: String,
      required: true,
    },
    trackTitle: {
      type: String,
      default: "",
    },
    trackArtist: {
      type: String,
      default: "",
    },
    crossorigin: {
      type: String,
      default: "",
    },
    compact: {
      type: Boolean,
      default: false,
    },
  },
  setup(props) {
    const audioElement = ref(null);
    const isPlaying = ref(false);
    const isLoading = ref(false);
    const currentTime = ref(0);
    const duration = ref(0);
    const volume = ref(0.7);
    const progressPercentage = ref(0);

    const togglePlay = () => {
      if (audioElement.value) {
        if (isPlaying.value) {
          audioElement.value.pause();
        } else {
          audioElement.value.play();
        }
      }
    };

    const onLoadedMetadata = () => {
      if (audioElement.value) {
        duration.value = audioElement.value.duration;
      }
    };

    const onTimeUpdate = () => {
      if (audioElement.value) {
        currentTime.value = audioElement.value.currentTime;
        progressPercentage.value = (currentTime.value / duration.value) * 100;
      }
    };

    const onEnded = () => {
      isPlaying.value = false;
      currentTime.value = 0;
      progressPercentage.value = 0;
    };

    const seekTo = (event) => {
      if (audioElement.value && duration.value) {
        const rect = event.currentTarget.getBoundingClientRect();
        const clickX = event.clientX - rect.left;
        const percentage = clickX / rect.width;
        const seekTime = percentage * duration.value;
        audioElement.value.currentTime = seekTime;
      }
    };

    const seekForward = () => {
      if (audioElement.value) {
        audioElement.value.currentTime = Math.min(
          audioElement.value.currentTime + 15,
          duration.value
        );
      }
    };

    const seekBackward = () => {
      if (audioElement.value) {
        audioElement.value.currentTime = Math.max(
          audioElement.value.currentTime - 15,
          0
        );
      }
    };

    const toggleMute = () => {
      if (audioElement.value) {
        audioElement.value.muted = !audioElement.value.muted;
        volume.value = audioElement.value.muted ? 0 : audioElement.value.volume;
      }
    };

    const setVolume = () => {
      if (audioElement.value) {
        audioElement.value.volume = volume.value;
        audioElement.value.muted = volume.value === 0;
      }
    };

    const formatTime = (time) => {
      if (isNaN(time)) return "0:00";
      const minutes = Math.floor(time / 60);
      const seconds = Math.floor(time % 60);
      return `${minutes}:${seconds.toString().padStart(2, "0")}`;
    };

    onMounted(() => {
      if (audioElement.value) {
        audioElement.value.volume = volume.value;
      }
    });

    watch(
      () => props.audioUrl,
      () => {
        if (audioElement.value) {
          audioElement.value.load();
          isPlaying.value = false;
          currentTime.value = 0;
          progressPercentage.value = 0;
        }
      }
    );

    return {
      audioElement,
      isPlaying,
      isLoading,
      currentTime,
      duration,
      volume,
      progressPercentage,
      togglePlay,
      onLoadedMetadata,
      onTimeUpdate,
      onEnded,
      seekTo,
      seekForward,
      seekBackward,
      toggleMute,
      setVolume,
      formatTime,
    };
  },
};
</script>

<style scoped>
.audio-player {
  width: 100%;
  max-width: 480px;
  margin: 0 auto;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
}

.player-container {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 20px;
  padding: 24px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
  color: white;
  position: relative;
  overflow: hidden;
}

.player-container::before {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(
    45deg,
    rgba(255, 255, 255, 0.1) 0%,
    transparent 100%
  );
  pointer-events: none;
}

.album-art {
  width: 120px;
  height: 120px;
  margin: 0 auto 20px;
  border-radius: 60px;
  background: rgba(255, 255, 255, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(10px);
  border: 2px solid rgba(255, 255, 255, 0.2);
}

.waveform {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 2px;
  height: 40px;
}

.wave-bar {
  width: 3px;
  height: 8px;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 2px;
  transition: all 0.3s ease;
}

.wave-bar.active {
  animation: wave 1.5s ease-in-out infinite alternate;
  background: rgba(255, 255, 255, 0.8);
}

@keyframes wave {
  0% {
    height: 8px;
  }
  100% {
    height: 24px;
  }
}

.controls-section {
  position: relative;
  z-index: 1;
}

.track-info {
  text-align: center;
  margin-bottom: 20px;
}

.track-title {
  font-size: 18px;
  font-weight: 600;
  margin: 0 0 4px 0;
  color: white;
}

.track-artist {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.8);
  margin: 0;
}

.progress-section {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;
}

.time-display {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.8);
  min-width: 35px;
  font-variant-numeric: tabular-nums;
}

.progress-container {
  flex: 1;
  height: 6px;
  position: relative;
  cursor: pointer;
  border-radius: 3px;
  overflow: hidden;
}

.progress-track {
  width: 100%;
  height: 100%;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 3px;
}

.progress-fill {
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 3px;
  transition: width 0.1s ease;
}

.progress-thumb {
  position: absolute;
  top: 50%;
  width: 14px;
  height: 14px;
  background: white;
  border-radius: 50%;
  transform: translateX(-50%) translateY(-50%);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  opacity: 0;
  transition: opacity 0.2s ease;
}

.progress-container:hover .progress-thumb {
  opacity: 1;
}

.controls {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 16px;
  margin-bottom: 20px;
}

.control-btn {
  background: none;
  border: none;
  color: white;
  cursor: pointer;
  padding: 8px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.control-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  transform: scale(1.1);
}

.control-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}

.control-btn.primary {
  background: rgba(255, 255, 255, 0.15);
  padding: 16px;
  backdrop-filter: blur(10px);
}

.control-btn.primary:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.25);
}

.play-btn {
  position: relative;
}

.spinner {
  width: 24px;
  height: 24px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top: 2px solid white;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

.volume-section {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
}

.volume-slider {
  width: 80px;
}

.volume-input {
  width: 100%;
  height: 4px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 2px;
  outline: none;
  appearance: none;
  cursor: pointer;
}

.volume-input::-webkit-slider-thumb {
  appearance: none;
  width: 12px;
  height: 12px;
  background: white;
  border-radius: 50%;
  cursor: pointer;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.volume-input::-moz-range-thumb {
  width: 12px;
  height: 12px;
  background: white;
  border-radius: 50%;
  cursor: pointer;
  border: none;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

/* Responsive */
@media (max-width: 480px) {
  .player-container {
    padding: 20px;
  }

  .album-art {
    width: 100px;
    height: 100px;
  }

  .track-title {
    font-size: 16px;
  }

  .controls {
    gap: 12px;
  }

  .volume-slider {
    width: 60px;
  }
}
</style>
