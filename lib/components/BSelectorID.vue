<template>
  <q-select
    clearable
    :model-value="internalModel"
    @update:model-value="onSelect"
    filled
    :multiple="multiple"
    :label="label"
    :options="options"
    map-options
    use-chips
    :hide-selected="isEmpty"
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
import { useErrors } from '../composables/useErrors';
import { computed, defineComponent, type PropType, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';

interface Option {
  label: string;
  value: string | number; // Adjust as needed
}

export default defineComponent({
  name: 'BSelectorID',
  props: {
    modelValue: {
      type: [String, Array, undefined] as PropType<
        string | string[] | undefined
      >,
      required: false,
      default: undefined,
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
    optionExtra: {
      type: String,
      required: false,
    },
    url: {
      type: String,
      required: true,
    },
    useI18n: {
      type: Boolean,
      require: false,
      default: false,
    },
  },
  emits: {
    'update:modelValue': (value: string | string[] | undefined) => true,
    'update:label': (value: string) => true,
    'update:extra': (value: string) => true,
  },

  setup(props, { emit }) {
    const { locale } = useI18n();
    const { handleError } = useErrors();
    const loading = ref(false);
    const options = ref<Option[]>([]);
    // Initialize internalModel based on multiple prop
    const internalModel = ref(props.modelValue ?? (props.multiple ? [] : {}));

    const lastFilterValue = ref('NONSENSE');

    // Function to build URL with language parameter
    const buildUrl = (baseUrl: string, id?: string, query?: string) => {
      const url = new URL(
        id ? `${baseUrl}/${id}` : baseUrl,
        window.location.origin,
      );

      url.searchParams.append('detail', 'basic');

      if (props.useI18n) {
        url.searchParams.append('lang', locale.value);
      }

      if (query) {
        url.searchParams.append('q', query.toLowerCase());
      }

      return url.pathname + url.search;
    };

    const isEmpty = computed(() => {
      return (
        !internalModel.value ||
        (Array.isArray(internalModel.value) && internalModel.value.length === 0)
      );
    });

    const loadOne = async (newValue: string | string[] | undefined) => {
      console.log('loadOne', newValue);
      if (!newValue) {
        emit('update:label', '');
        emit('update:modelValue', undefined);
        options.value = [];
        internalModel.value = props.multiple ? [] : '';

        if (props.optionExtra) {
          emit('update:extra', '');
        }
        return;
      }

      loading.value = true;
      try {
        if (props.multiple && Array.isArray(newValue)) {
          const promises = newValue.map((id) =>
            axios.get(buildUrl(props.url, id)),
          );
          const responses = await Promise.all(promises);

          internalModel.value = responses.map((response) => ({
            [props.optionValue]: response.data[props.optionValue],
            [props.optionLabel]: response.data[props.optionLabel],
          }));
          emit(
            'update:label',
            responses.map((r) => r.data[props.optionLabel]).join(', '),
          );
        } else if (!Array.isArray(newValue)) {
          const fetchedData = (await axios.get(buildUrl(props.url, newValue)))
            .data;

          const option = {
            [props.optionValue]: fetchedData[props.optionValue],
            [props.optionLabel]: fetchedData[props.optionLabel],
          };

          // options.value = [option];

          internalModel.value = option;
          emit('update:label', fetchedData[props.optionLabel]);
        }
      } catch (err) {
        handleError(err);
      } finally {
        loading.value = false;
      }
    };

    const loadExtra = async (newValue: string | string[]) => {
      if (!props.optionExtra) {
        return;
      }
      if (!newValue || (Array.isArray(newValue) && newValue.length === 0)) {
        return;
      }

      loading.value = true;
      try {
        if (props.multiple && Array.isArray(newValue)) {
          const promises = newValue.map((id) =>
            axios.get(buildUrl(props.url, id)),
          );
          const responses = await Promise.all(promises);
          const extraValues = responses
            .map((r) =>
              props.optionExtra ? r.data[props.optionExtra] : undefined,
            )
            .join(', ');
          emit('update:extra', extraValues);
        } else if (!Array.isArray(newValue)) {
          const fetchedData = (await axios.get(buildUrl(props.url, newValue)))
            .data;
          emit('update:extra', fetchedData[props.optionExtra]);
        }
      } catch (err) {
        handleError(err);
      } finally {
        loading.value = false;
      }
    };

    loadOne(props.modelValue);

    const onSelect = (val: any) => {
      console.log('onSelect', val);
      if (!val || (Array.isArray(val) && val.length === 0)) {
        emit('update:modelValue', props.multiple ? [] : undefined);
        emit('update:label', '');
        return; // Or perform a different action for no selection
      }
      if (props.multiple) {
        const values = val ? val.map((v: any) => v[props.optionValue]) : [];
        const labels = val
          ? val.map((v: any) => v[props.optionLabel]).join(', ')
          : '';
        emit('update:modelValue', values);
        emit('update:label', labels);
        loadExtra(values);
      } else {
        internalModel.value = val;
        emit('update:modelValue', val ? val[props.optionValue] : val);
        emit('update:label', val ? val[props.optionLabel] : val);
        if (!props.optionExtra) {
          return;
        }
        loadExtra(val ? val[props.optionValue] : val);
      }
    };

    watch(
      () => props.modelValue,
      async (newValue) => {
        if (props.modelValue === internalModel.value) {
          return;
        }
        loadOne(newValue);
      },
    );

    // Watch for locale changes and reload data if useI18n is true
    watch(locale, () => {
      if (props.useI18n && props.modelValue) {
        loadOne(props.modelValue);
        if (props.optionExtra) {
          loadExtra(props.modelValue);
        }
      }
    });

    const filterFn = async (
      val: string,
      update: (fn: () => void) => void,
      abort: () => void,
    ) => {
      if (val === lastFilterValue.value) {
        update(() => {
          console.log('same value');
        });
        return; // Prevent triggering for the same value
      }
      lastFilterValue.value = val;

      update(() => {
        loading.value = true;
        console.log('updating');
        axios
          .get(buildUrl(props.url, undefined, val))
          .then(({ data }) => {
            console.log('data', data, 'val', val);

            options.value = data ?? [];

            console.log('options.value', options.value);
          })
          .catch(handleError)
          .finally(() => {
            loading.value = false;
          });
      });
    };

    return {
      internalModel,
      options,
      loading,
      onSelect,
      filterFn,
      isEmpty,
    };
  },
});
</script>
