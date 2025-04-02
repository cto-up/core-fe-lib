<template>
  <q-select
    clearable
    v-model="theModel"
    filled
    :multiple="multiple"
    :label="label"
    :options="options"
    map-options
    fill-input
    use-chips
    :hide-selected="!multiple"
    input-debounce="500"
    use-input
    :option-label="optionLabel"
    :option-value="optionValue"
    :loading="loading"
    @filter="filterFn"
  />
</template>

<script lang="ts">
import axios from 'axios';
import { useErrors } from 'composables/useErrors';
import { computed, defineComponent, ref } from 'vue';

interface Option {
  label: string;
  value: string | number; // Adjust as needed
}

export default defineComponent({
  name: 'BSelector',
  props: {
    modelValue: {
      type: Object, // Type Annotation
      default: () => null,
    },
    multiple: {
      type: Boolean,
      required: false,
    },
    label: {
      type: String,
      required: true,
    },
    optionValue: {
      type: String,
      required: true,
    },
    optionLabel: {
      type: String,
      required: true,
    },
    url: {
      type: String,
      required: true,
    },
  },
  emits: ['update:modelValue'],

  setup(props, { emit }) {
    const { handleError } = useErrors();
    const loading = ref(false);

    const theModel = computed({
      get: () => (props.modelValue ? props.modelValue : null),
      set: (value) => emit('update:modelValue', value),
    });

    const options = ref<Option[]>([]);

    return {
      theModel,
      options,
      loading,
      filterFn(
        val: string,
        update: (fn: () => void) => void,
        abort: () => void,
      ) {
        if (val.length < 1) {
          abort();
          return;
        }
        update(() => {
          (async function fetchList() {
            loading.value = true;

            let url = props.url;
            if (val) {
              url = url + '?q=' + val.toLocaleLowerCase() + '&detail=basic';
            }
            try {
              const fetchedData = (await axios.get(url, {})).data;
              options.value = fetchedData ?? []; //[...(fetchedData ?? [])];
            } catch (err) {
              handleError(err);
            } finally {
              loading.value = false;
            }
          })();
        });
      },
    };
  },
});
</script>
