<template>
  <!-- ...... -->
  <q-select
    v-model="locale"
    :options="localeOptions"
    :label="$t('actions.language')"
    dense
    borderless
    emit-value
    map-options
    options-dense
    style="min-width: 150px"
    @update:model-value="updateLocale"
  />
  <!-- ...... -->
</template>

<script>
import { useI18n } from 'vue-i18n';

export default {
  setup() {
    const { locale } = useI18n({ useScope: 'global' });
    // Retrieve language preference from localStorage or use browser language
    const savedLocale = localStorage.getItem('user-locale');
    if (savedLocale) {
      locale.value = savedLocale;
    } else if (navigator.language.startsWith('fr')) {
      locale.value = 'fr';
    } else {
      locale.value = 'en-US';
    }
    const updateLocale = (newLocale) => {
      localStorage.setItem('user-locale', newLocale);
      locale.value = newLocale;
    };
    return {
      updateLocale,
      locale,
      localeOptions: [
        { value: 'en-US', label: 'English' },
        { value: 'fr', label: 'Français' },
      ],
    };
  },
};
</script>
