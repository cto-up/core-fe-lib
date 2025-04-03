// src/composables/useQueryParams.ts

import { useRouter, useRoute, type LocationQuery } from 'vue-router';
import { computed, nextTick, ref } from 'vue';

export function useQueryParams() {
  const router = useRouter();
  const route = useRoute();

  const currentQuery = computed(() => route.query);

  const setQueryParam = (key: string, value: string | null) => {
    if (route.query[key] === value) return;

    const query: LocationQuery = { ...route.query };
    if (!value) {
      delete query[key];
    } else {
      query[key] = value;
    }
    router.replace({ query });
  };

  const setMultipleQueryParams = (params: Record<string, string | null>) => {
    const query: LocationQuery = { ...route.query };
    let changed = false;

    Object.entries(params).forEach(([key, value]) => {
      if (route.query[key] !== value) {
        changed = true;
        if (value === null) {
          delete query[key];
        } else {
          query[key] = value;
        }
      }
    });

    if (changed) {
      router.replace({ query });
    }
  };

  const removeQueryParam = (key: string) => {
    if (key in route.query) {
      const query = { ...route.query };
      delete query[key];
      router.replace({ query });
    }
  };


  const pagination = ref({
    sortBy: (route.query.sortBy as string) || '',
    descending: route.query.descending === 'true',
    page: Number.parseInt(route.query.page as string) || 1,
    rowsPerPage: Number.parseInt(route.query.rowsPerPage as string) || 10,
    rowsNumber: 1000000,
  });

  const goToPreviousPage = async function () {
    if (pagination.value.page > 1) {
      pagination.value.page -= 1;
      await nextTick();
      setQueryParam('page', pagination.value.page + '');
    }
  };

  return {
    pagination,
    goToPreviousPage,
    currentQuery,
    setQueryParam,
    setMultipleQueryParams,
    removeQueryParam,
  };
}
