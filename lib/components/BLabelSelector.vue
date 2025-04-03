<template>
  <q-select
    v-model="theModel"
    filled
    :disable="disable"
    :multiple="multiple"
    :label="label"
    :options="options"
    use-input
    use-chips
    :loading="loading"
    @filter="filterFn"
    @add="add"
    @remove="remove"
  />
</template>

<script lang="ts">
import axios from "axios";
import { useErrors } from "../composables/useErrors";
import { computed, defineComponent, ref } from "vue";
import { Option } from "../../dev/src/components/types";
export default defineComponent({
  name: "BLabelSelector",
  props: {
    disable: {
      type: Boolean,
      required: false,
    },
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
    optionLabel: {
      type: String,
      required: true,
    },
    url: {
      type: String,
      required: true,
    },
  },
  emits: ["update:modelValue", "add", "remove"],

  setup(props, { emit }) {
    const { handleError } = useErrors();
    const loading = ref(false);

    const theModel = computed({
      get: () => (props.modelValue ? props.modelValue : null),
      set: (value) => emit("update:modelValue", value),
    });

    const options = ref([]);

    const add = (detail: { value: Option }) => {
      emit("add", detail.value);
    };
    const remove = (detail: { value: Option }) => {
      emit("remove", detail.value);
    };

    return {
      add,
      remove,
      theModel,
      options,
      loading,
      filterFn(
        val: string,
        update: (fn: () => void) => void,
        abort: () => void
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
              url = url + "?q=" + val.toLocaleLowerCase() + "&detail=basic";
            }
            try {
              const fetchedData = (await axios.get(url, {})).data;
              options.value = fetchedData.map(
                (option: Record<string, string>) => option[props.optionLabel]
              );
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
