import { type QTableProps } from 'quasar';
import { type CancelablePromise } from '../openapi/core';
import { type Ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useErrors } from './useErrors';

// Define a proper type for columns and rows, adjust as needed
interface TableColumn {
  field: string;
  label: string;
}

interface TableRow {
  [key: string]: string | number | null | undefined;
}

export const getCellValue = (col: TableColumn, row: TableRow): string | number => {
  return row[col.field] ?? '';
};

export interface ListService<T> {
  listService: (
    page: number,
    rowsPerPage: number,
    sortBy: string,
    order: 'asc' | 'desc',
    q?: string
  ) => CancelablePromise<Array<T>>;
}
interface UseListServiceParams<T> {
  listService: ListService<T>;
  rows: Ref<T[]>;
  pagination: Ref<QTableProps['pagination']>;
  loading: Ref<boolean>;
  filter?: Ref<string>
}

export default function useListService<T>({
  listService,
  rows,
  pagination,
  loading,
  filter,
}: UseListServiceParams<T>) {
  const route = useRoute();
  const router = useRouter();
  const { handleError } = useErrors();

  const onRequest: QTableProps['onRequest'] = async (props) => {
    const { page, rowsPerPage, sortBy, descending } = props.pagination;
    loading.value = true;

    try {
      const response = await listService.listService(
        page,
        rowsPerPage,
        sortBy,
        descending ? 'desc' : 'asc',
        filter?.value
      );

      rows.value = response;
      pagination.value = {
        ...pagination.value,
        rowsPerPage,
        sortBy,
        descending,
        page,
      };

      // Batch update query parameters
      const query = { ...route.query };
      query.page = page + '';
      query.sortBy = sortBy;
      query.descending = descending + '';
      query.rowsPerPage = rowsPerPage + '';
      query.filter = filter?.value || null;

      await router.push({
        path: route.path,
        query
      });
    } catch (error) {
      handleError(error);
    } finally {
      loading.value = false;
    }
  };

  return { onRequest };
}
