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
    option-label="name"
    option-value="id"
    :loading="loading"
    @filter="filterFn"
  >
    <template v-slot:option="scope">
      <q-item v-bind="scope.itemProps">
        <q-item-section avatar>
          <q-avatar>
            <q-icon name="person" />
          </q-avatar>
        </q-item-section>
        <q-item-section>
          <q-item-label>{{ scope.opt.name }}</q-item-label>
          <q-item-label caption>{{ scope.opt.email }}</q-item-label>
        </q-item-section>
      </q-item>
    </template>

    <template v-slot:selected-item="scope">
      <q-chip
        removable
        dense
        @remove="scope.removeAtIndex(scope.index)"
        :tabindex="scope.tabindex"
        class="q-ma-none"
      >
        <q-avatar>
          <q-icon name="person" />
        </q-avatar>
        {{ scope.opt.name }}
      </q-chip>
    </template>
  </q-select>
</template>

<script lang="ts">
import axios from "axios";
import { useErrors } from "../composables/useErrors";
import { defineComponent, PropType, ref, watch } from "vue";

interface User {
  id: string;
  name: string;
  email: string;
}

export default defineComponent({
  name: "BUserSelectorID",
  props: {
    modelValue: {
      type: [String, Array] as PropType<string | string[]>,
      required: true,
    },
    multiple: {
      type: Boolean,
      required: false,
      default: false,
    },
    label: {
      type: String,
      required: true,
    },
    roles: {
      type: Array as PropType<string[]>,
      required: false,
    },
    excludeCurrentUser: {
      type: Boolean,
      required: false,
      default: false,
    },
    teamId: {
      type: String,
      required: false,
    },
  },
  emits: {
    "update:modelValue": (value: string | string[]) => true,
    "update:label": (value: string) => true,
  },

  setup(props, { emit }) {
    const { handleError } = useErrors();
    const loading = ref(false);
    const options = ref<User[]>([]);

    // Build the base URL for user fetching
    const buildUrl = (id?: string, query?: string) => {
      const url = new URL(
        id ? `/api/v1/users/${id}` : "/api/v1/users",
        window.location.origin
      );

      // If specific roles are required
      if (props.roles && props.roles.length > 0) {
        url.searchParams.append("roles", `${props.roles.join(",")}`);
      }

      // If team filtering is required
      if (props.teamId) {
        url.searchParams.append("teamId", props.teamId);
      }

      // If excluding current user
      if (props.excludeCurrentUser) {
        url.searchParams.append("excludeCurrentUser", "true");
      }

      // If searching by query
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
            id: props.modelValue,
            name: "",
            email: "",
          }
    );

    const loadOne = async (newValue: string | string[]) => {
      if (!newValue || (Array.isArray(newValue) && newValue.length === 0)) {
        return;
      }

      loading.value = true;
      try {
        if (props.multiple && Array.isArray(newValue)) {
          const promises = newValue.map((id) => axios.get(buildUrl(id)));
          const responses = await Promise.all(promises);
          theModel.value = responses.map((response) => ({
            id: response.data.id,
            name: response.data.name,
            email: response.data.email,
          }));
          emit("update:label", responses.map((r) => r.data.name).join(", "));
        } else if (!Array.isArray(newValue)) {
          const fetchedData = (await axios.get(buildUrl(newValue))).data;
          theModel.value = {
            id: fetchedData.id,
            name: fetchedData.name,
            email: fetchedData.email,
          };
          emit("update:label", fetchedData.name);
        }
      } catch (err) {
        handleError(err);
      } finally {
        loading.value = false;
      }
    };

    const onSelect = (val: any) => {
      if (props.multiple) {
        const values = val ? val.map((v: User) => v.id) : [];
        const labels = val ? val.map((v: User) => v.name).join(", ") : "";
        emit("update:modelValue", values);
        emit("update:label", labels);
      } else {
        emit("update:modelValue", val ? val.id : val);
        emit("update:label", val ? val.name : val);
      }
    };

    const filterFn = async (
      val: string,
      update: (fn: () => void) => void,
      abort: () => void
    ) => {
      /*if (val.length < 2) {
        abort();
        return;
      }*/

      update(async () => {
        loading.value = true;
        try {
          const response = await axios.get(buildUrl(undefined, val));
          options.value = response.data.map((user: any) => ({
            id: user.id,
            name: user.name,
            email: user.email,
          }));
        } catch (err) {
          handleError(err);
          options.value = [];
        } finally {
          loading.value = false;
        }
      });
    };

    watch(
      () => props.modelValue,
      async (newValue) => {
        loadOne(newValue);
      }
    );

    // Initial load
    loadOne(props.modelValue);

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
