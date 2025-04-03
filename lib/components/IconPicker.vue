<template>
  <div class="icon-picker">
    <q-btn
      :icon="modelValue || 'add'"
      round
      color="primary"
      @click="openDialog"
    />
    <span v-if="modelValue" class="q-ml-sm"> Click change Icon </span>
    <span v-else class="q-ml-sm"> Click to select Icon </span>
    <q-dialog v-model="isDialogOpen">
      <q-card style="min-width: 350px">
        <q-card-section>
          <div class="text-h6">Select an Icon</div>
        </q-card-section>

        <q-card-section class="q-pt-none">
          <q-input
            v-model="searchQuery"
            placeholder="Search icons"
            outlined
            dense
            class="q-mb-md"
          >
            <template v-slot:append>
              <q-icon name="search" />
            </template>
          </q-input>

          <div class="row q-col-gutter-sm">
            <div
              v-for="icon in filteredIcons"
              :key="icon"
              class="col-2 col-sm-1"
            >
              <q-btn
                :icon="icon"
                flat
                round
                :color="modelValue === icon ? 'primary' : 'grey'"
                @click="selectIcon(icon)"
              />
            </div>
          </div>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Cancel" color="primary" v-close-popup />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useQuasar } from 'quasar';
// list is taken from https://fonts.google.com/metadata/icons
import rowIcons from '../assets/raw-icons.json';

defineProps({
  modelValue: {
    type: String,
    default: '',
  },
});

const emit = defineEmits(['update:modelValue']);

const $q = useQuasar();
const searchQuery = ref('');
const isDialogOpen = ref(false);

// This is a sample list of icons. You can expand this list or fetch it from an API.
const icons = rowIcons['icons'].map((icon) => icon.name);

const filteredIcons = computed(() => {
  if (!searchQuery.value) return icons;
  return icons.filter((icon) =>
    icon.toLowerCase().includes(searchQuery.value.toLowerCase())
  );
});

const selectIcon = (icon) => {
  emit('update:modelValue', icon);
  $q.notify({
    message: `Selected icon: ${icon}`,
    color: 'positive',
  });
  isDialogOpen.value = false;
};

const openDialog = () => {
  isDialogOpen.value = true;
  searchQuery.value = '';
};
</script>

<style scoped>
.icon-picker {
  display: inline-flex;
  align-items: center;
}
</style>
