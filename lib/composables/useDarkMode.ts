import { useQuasar, LocalStorage } from 'quasar';

export default function useDarkMode() {
  const $q = useQuasar();

  const initializeDarkMode = () => {
    const darkMode = LocalStorage.getItem('dark-mode');

    if (darkMode !== null) {
      $q.dark.set(darkMode === 'true' || darkMode === true);
    } else {
      $q.dark.set(false);
      LocalStorage.set('dark-mode', 'false');
    }
  };

  const changeMode = () => {
    $q.dark.toggle();
    LocalStorage.set('dark-mode', $q.dark.isActive ? 'true' : 'false');
  };

  return {
    initializeDarkMode,
    changeMode,
    isDarkMode: () => $q.dark.isActive,
  };
}
