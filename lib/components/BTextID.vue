<template>
  <div>{{ theModel[optionLabel] }}</div>
</template>

<script lang="ts">
import axios from "axios";
import { useErrors } from "../composables/useErrors";
import { defineComponent, ref, watch } from "vue";

export default defineComponent({
  name: "BTextID",
  props: {
    modelValue: {
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

  setup(props) {
    const { handleError } = useErrors();
    const theModel = ref({
      [props.optionValue]: props.modelValue,
      [props.optionLabel]: "",
    });

    const loadOne = async (newValue: string) => {
      if (!newValue) {
        return;
      }
      try {
        const fetchedData = (await axios.get(`${props.url}/${newValue}`)).data;
        theModel.value = {
          [props.optionValue]: fetchedData[props.optionValue],
          [props.optionLabel]: fetchedData[props.optionLabel],
        };
      } catch (err) {
        handleError(err);
      }
    };

    watch(
      () => props.modelValue,
      async (newValue) => {
        loadOne(newValue);
      },
      { immediate: true }
    );

    return {
      theModel,
    };
  },
});
</script>
