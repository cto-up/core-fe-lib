import { ref, onBeforeMount, onUnmounted } from 'vue';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function usePwaInstall() {
  const deferredPrompt = ref<BeforeInstallPromptEvent | null>(null);

  const handleBeforeInstallPrompt = (e: Event) => {
    console.log('handleBeforeInstallPrompt', e);
      e.preventDefault();
      deferredPrompt.value = e as BeforeInstallPromptEvent;
  };

  const promptInstall = async (): Promise<void> => {
    if (!deferredPrompt.value) {
      console.warn('PWA install event is not available.');
      return;
    }

    // Trigger the install prompt
    await deferredPrompt.value.prompt();
    const { outcome } = await deferredPrompt.value.userChoice;

    if (outcome === 'accepted') {
      console.log('User accepted the PWA installation.');
    } else {
      console.log('User dismissed the PWA installation.');
    }

    // Reset the event after use
    deferredPrompt.value = null;
  };

  // Add and clean up the event listener
  onBeforeMount(() => {
    console.log('onBeforeMount: beforeinstallprompt');
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  });

  onUnmounted(() => {
    console.log('onUnmounted: beforeinstallprompt');
    window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  });

  return {
    promptInstall,
    deferredPrompt,
  };
}
