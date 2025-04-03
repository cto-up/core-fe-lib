<template>
  <q-select
    clearable
    v-model="theModel"
    @update:model-value="onSelect"
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
import axios from "axios";
import { useErrors } from "../composables/useErrors";
import { defineComponent, PropType, ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import { boolean } from "zod";

interface Option {
  label: string;
  value: string | number; // Adjust as needed
}

export default defineComponent({
  name: "BSelectorID",
  props: {
    modelValue: {
      type: [String, Array] as PropType<string | string[]>,
      required: true,
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
    "update:modelValue": (value: string | string[]) => true,
    "update:label": (value: string) => true,
    "update:extra": (value: string) => true,
  },

  setup(props, { emit }) {
    const { locale } = useI18n();
    const { handleError } = useErrors();
    const loading = ref(false);

    // Function to build URL with language parameter
    const buildUrl = (baseUrl: string, id?: string, query?: string) => {
      const url = new URL(
        id ? `${baseUrl}/${id}` : baseUrl,
        window.location.origin
      );

      url.searchParams.append("detail", "basic");

      if (props.useI18n) {
        url.searchParams.append("lang", locale.value);
      }

      if (query) {
        url.searchParams.append("q", query.toLowerCase());
      }

      return url.pathname + url.search;
    };

    // Initialize theModel based on multiple prop
    const theModel = ref(
      props.multiple
        ? []
        : {
            [props.optionValue]: props.modelValue,
            [props.optionLabel]: "",
          }
    );

    const loadOne = async (newValue: string | string[]) => {
      if (!newValue || (Array.isArray(newValue) && newValue.length === 0)) {
        return;
      }

      loading.value = true;
      try {
        if (props.multiple && Array.isArray(newValue)) {
          const promises = newValue.map((id) =>
            axios.get(buildUrl(props.url, id))
          );
          const responses = await Promise.all(promises);
          theModel.value = responses.map((response) => ({
            [props.optionValue]: response.data[props.optionValue],
            [props.optionLabel]: response.data[props.optionLabel],
          }));
          emit(
            "update:label",
            responses.map((r) => r.data[props.optionLabel]).join(", ")
          );
        } else if (!Array.isArray(newValue)) {
          const fetchedData = (await axios.get(buildUrl(props.url, newValue)))
            .data;
          theModel.value = {
            [props.optionValue]: fetchedData[props.optionValue],
            [props.optionLabel]: fetchedData[props.optionLabel],
          };
          emit("update:label", fetchedData[props.optionLabel]);
        }
      } catch (err) {
        handleError(err);
      } finally {
        loading.value = false;
      }
    };

    const loadExtra = async (newValue: string | string[]) => {
      if (
        !newValue ||
        !props.optionExtra ||
        (Array.isArray(newValue) && newValue.length === 0)
      ) {
        return;
      }

      loading.value = true;
      try {
        if (props.multiple && Array.isArray(newValue)) {
          const promises = newValue.map((id) =>
            axios.get(buildUrl(props.url, id))
          );
          const responses = await Promise.all(promises);
          const extraValues = responses
            .map((r) => r.data[props.optionExtra])
            .join(", ");
          emit("update:extra", extraValues);
        } else if (!Array.isArray(newValue)) {
          const fetchedData = (await axios.get(buildUrl(props.url, newValue)))
            .data;
          emit("update:extra", fetchedData[props.optionExtra]);
        }
      } catch (err) {
        handleError(err);
      } finally {
        loading.value = false;
      }
    };

    loadOne(props.modelValue);

    const onSelect = (val: any) => {
      if (props.multiple) {
        const values = val ? val.map((v: any) => v[props.optionValue]) : [];
        const labels = val
          ? val.map((v: any) => v[props.optionLabel]).join(", ")
          : "";
        emit("update:modelValue", values);
        emit("update:label", labels);
        loadExtra(values);
      } else {
        emit("update:modelValue", val ? val[props.optionValue] : val);
        emit("update:label", val ? val[props.optionLabel] : val);
        loadExtra(val ? val[props.optionValue] : val);
      }
    };

    watch(
      () => props.modelValue,
      async (newValue) => {
        loadOne(newValue);
      }
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

    const options = ref<Option[]>([]);

    const filterFn = async (
      val: string,
      update: (fn: () => void) => void,
      abort: () => void
    ) => {
      /*if (val.length < 1) {
        abort();
        return;
      }*/
      update(() => {
        loading.value = true;
        axios
          .get(buildUrl(props.url, undefined, val))
          .then(({ data }) => {
            options.value = data ?? [];
          })
          .catch(handleError)
          .finally(() => {
            loading.value = false;
          });
      });
    };

    return {
      theModel,
      options,
      loading,
      onSelect,
      filterFn,
    };
  },
});
</script>
