<template>
  <div :class="missing ? 'italic text-muted-foreground' : undefined">
    {{ missing ? fallback : theModel[optionLabel] }}
  </div>
</template>

<script lang="ts">
import axios from "axios";
import { useErrors } from "../composables/useErrors";
import { defineComponent, ref, watch, type PropType } from "vue";

export default defineComponent({
  name: "BTextID",
  props: {
    modelValue: {
      type: [String, undefined] as PropType<string | undefined>,
      required: false,
      default: undefined,
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
    /** Shown in place of the label when the id resolves to nothing. */
    fallback: {
      type: String,
      required: false,
      default: "—",
    },
  },

  setup(props) {
    const { handleError } = useErrors();
    const missing = ref(false);
    const theModel = ref({
      [props.optionValue]: props.modelValue,
      [props.optionLabel]: "",
    });

    const loadOne = async (newValue: string | undefined) => {
      if (!newValue) {
        return;
      }
      try {
        const fetchedData = (await axios.get(`${props.url}/${newValue}`)).data;
        theModel.value = {
          [props.optionValue]: fetchedData[props.optionValue],
          [props.optionLabel]: fetchedData[props.optionLabel],
        };
        missing.value = false;
      } catch (err) {
        // This is a display-only id -> label lookup. A reference the caller
        // can no longer resolve is a blank label, not an error the user can
        // act on — so 404/403 degrade to `fallback` instead of a toast.
        const status =
          (err as { status?: number; response?: { status?: number } })
            ?.status ??
          (err as { response?: { status?: number } })?.response?.status;
        if (status === 404 || status === 403) {
          missing.value = true;
          return;
        }
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
      missing,
    };
  },
});
</script>
