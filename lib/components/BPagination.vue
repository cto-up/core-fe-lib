<template>
  <q-btn
    v-if="scope.pagesNumber > 2"
    icon="first_page"
    color="grey-8"
    round
    dense
    flat
    :disable="scope.isFirstPage"
    @click="scope.firstPage"
  ></q-btn>
  <q-btn
    icon="chevron_left"
    color="grey-8"
    round
    dense
    flat
    :disable="scope.isFirstPage"
    @click="scope.prevPage"
  ></q-btn>
  <q-btn
    icon="chevron_right"
    color="grey-8"
    round
    dense
    flat
    :disable="scope.isLastPage"
    @click="scope.nextPage"
  ></q-btn>
  <!--q-btn
                  v-if="scope.pagesNumber > 2"
                  icon="last_page"
                  color="grey-8"
                  round
                  dense
                  flat
                  :disable="scope.isLastPage"
                  @click="scope.lastPage"
                ></q-btn-->
</template>

<script lang="ts" setup>
interface Scope {
  pagination: {
    sortBy: string | null;
    descending: boolean;
    page: number;
    rowsPerPage: number;
  };
  pagesNumber: number;
  isFirstPage: boolean;
  isLastPage: boolean;
  firstPage: () => void;
  prevPage: () => void;
  nextPage: () => void;
  lastPage: () => void;
  inFullscreen: boolean;
  toggleFullscreen: () => void;
}

defineProps<{
  scope: Scope;
}>();
</script>
