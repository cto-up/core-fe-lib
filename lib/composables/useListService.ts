import { Notify } from 'quasar';
import { QTableProps } from 'quasar';
import { i18n } from 'boot/i18n';
import { CancelablePromise } from 'src/openapi/core';
import { router } from 'src/router';
import { Ref } from 'vue';
import { use } from 'echarts';
import { useQueryParams } from './useQueryParams';
const { t } = i18n.global;

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

  const { setQueryParam } = useQueryParams();

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

      // Update the route accordingly
      setQueryParam('page', page + '');
      setQueryParam('sortBy', sortBy);
      setQueryParam('descending', descending + '');
      setQueryParam('rowsPerPage', rowsPerPage + '');
      setQueryParam('filter', filter?.value);
    } catch (error) {
      Notify.create({
        type: 'negative',
        message: t('App.info.error'),
      });
    } finally {
      loading.value = false;
    }
  };

  return { onRequest };
}
