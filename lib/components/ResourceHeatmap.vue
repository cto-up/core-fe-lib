<template>
  <v-chart
    ref="chart"
    :option="option"
    :style="'height: ' + chartHeight + 'px; width: 1000px'"
  />
</template>

<script lang="ts" setup>
import { DefaultService, Resource, StaffingView } from 'src/openapi/project';
import { computed, nextTick, onMounted, ref, watch } from 'vue';
import { use } from 'echarts/core';
import { HeatmapChart } from 'echarts/charts';
import {
  TooltipComponent,
  GridComponent,
  VisualMapComponent,
  DataZoomComponent,
} from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import VChart from 'vue-echarts';
import useDate from 'composables/useDate';
use([
  DataZoomComponent,
  TooltipComponent,
  GridComponent,
  VisualMapComponent,
  HeatmapChart,
  CanvasRenderer,
]);

const props = defineProps({
  resource_ids: {
    type: Array<string>,
    required: false,
    default: () => [],
  },
  project_ids: {
    type: Array<string>,
    required: false,
    default: () => [],
  },
  from_date: {
    type: String,
    required: true,
  },
  to_date: {
    type: String,
    required: true,
  },
});

const staffingList = ref<StaffingView[]>([]);

const chart = ref();

const resizeChart = () => {
  chart.value?.resize();
};

const visibleFromDate = computed(() => new Date(props.from_date));

const visibleToDate = computed(() => new Date(props.to_date));

export type ResourceWithStaffings = Resource & {
  staffings: StaffingView[];
};

const resourcesWithStaffings = computed<ResourceWithStaffings[]>(() => {
  const resourceMap: { [key: string]: ResourceWithStaffings } = {};

  staffingList.value.forEach((staffing) => {
    if (staffing.resource) {
      const resourceId = staffing.resource.id;

      // If the resource doesn't exist in the map, add it
      if (!resourceMap[resourceId]) {
        resourceMap[resourceId] = {
          ...staffing.resource,
          staffings: [],
        };
      }
      // Push the current staffing to the resource's staffing array
      resourceMap[resourceId].staffings.push(staffing);
    }
  });
  // Convert the map values to an array
  return Object.values(resourceMap);
});

const chartHeight = computed(() => {
  const newHeight = resourcesWithStaffings.value.length * 20 + 200;
  return newHeight;
});
watch(chartHeight, async () => {
  await nextTick(); // Wait until DOM updates are done
  resizeChart();
});
watch(
  [
    () => props.project_ids,
    () => props.resource_ids,
    () => props.from_date,
    () => props.to_date,
  ],
  () => {
    handleQuery();
    updateDateRange();
  }
);

// Generate dates for the x-axis (7 days from today)

let option = computed(() => {
  // Generate random data
  const data = [];
  for (let i = 0; i < resourcesWithStaffings.value.length; i++) {
    // loop over dateRange
    for (let j = 0; j < dateRange.value.length; j++) {
      // sum allocations
      let sum = 0;
      resourcesWithStaffings.value[i].staffings.forEach((s) => {
        const date = dateRange.value[j];
        // if date is between s.start_date and s.end_date
        if (
          s.end_date &&
          date <= new Date(s.end_date) &&
          s.start_date &&
          date >= new Date(s.start_date)
        ) {
          sum += s.allocation ?? 0;
        }
      });
      data.push([j, i, sum || '-']);
    }
  }

  return {
    tooltip: {
      position: 'top',
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      formatter: function (params: any) {
        const date = dateRange.value[params.data[0]];
        const resourceWIthStaffings = resourcesWithStaffings.value[
          params.data[1]
        ] as ResourceWithStaffings;
        let infoString = resourceWIthStaffings.name;

        resourceWIthStaffings.staffings.forEach((s) => {
          // if date is between s.start_date and s.end_date
          if (
            s.end_date &&
            date <= new Date(s.end_date) &&
            s.start_date &&
            date >= new Date(s.start_date)
          )
            infoString += `<br>${s.project?.name}: ${s.allocation}% [${s.start_date} : ${s.end_date}]`;
        });

        return infoString;
      },
    },
    grid: {
      height: '50%',
      top: '10%',
    },
    xAxis: {
      type: 'category',
      data: dateRange.value.map((d) => ISODateToDateString(d)),
      splitArea: {
        show: true,
      },
    },
    yAxis: {
      type: 'category',
      data: resourcesWithStaffings.value.map((s) => s.name),
      splitArea: {
        show: true,
      },
    },
    dataZoom: [
      {
        type: 'slider',
        xAxisIndex: 0,
        filterMode: 'weakFilter',
        height: 20,
        bottom: 0,
        start: 0,
        end: 100,
        handleIcon:
          'path://M10.7,11.9H9.3c-4.9,0.3-8.8,4.4-8.8,9.4c0,5,3.9,9.1,8.8,9.4h1.3c4.9-0.3,8.8-4.4,8.8-9.4C19.5,16.3,15.6,12.2,10.7,11.9z M13.3,24.4H6.7V23h6.6V24.4z M13.3,19.6H6.7v-1.4h6.6V19.6z',
        handleSize: '80%',
        showDetail: false,
      },
    ],
    visualMap: {
      min: 0,
      max: 300,
      calculable: true,
      orient: 'horizontal',
      left: 'center',
      bottom: '15%',
    },
    series: [
      {
        name: 'Activity Heatmap',
        type: 'heatmap',
        data: data,
        label: {
          show: true,
        },
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowColor: 'rgba(0, 0, 0, 0.5)',
          },
        },
      },
    ],
  };
});
const updateDateRange = () => {
  dateRange.value.splice(0, dateRange.value.length);
  for (
    let d = new Date(visibleFromDate.value.getTime());
    d <= visibleToDate.value;
    d.setDate(d.getDate() + 1)
  ) {
    dateRange.value.push(new Date(d));
  }
};

// Generate date range for the Gantt chart (e.g., entire month of September 2024)
const dateRange = ref<Date[]>([]);

updateDateRange();
// Calculate the task position based on its start and end dates

const handleQuery = async () => {
  const newStaffingList = await DefaultService.listStaffings(
    1,
    1000000,
    undefined,
    undefined,
    props.resource_ids,
    props.project_ids,
    props.from_date,
    props.to_date
  );

  staffingList.value.splice(0, staffingList.value.length, ...newStaffingList);
};

const { ISODateToDateString } = useDate();

onMounted(async () => {
  staffingList.value = await DefaultService.listStaffings(
    1,
    1000000,
    'name',
    'asc',
    props.resource_ids,
    props.project_ids,
    ISODateToDateString(visibleFromDate.value),
    ISODateToDateString(visibleToDate.value)
  );
  //Object.assign(project, response);
});
</script>

<style scoped>
.gantt-header {
  display: flex;
  justify-content: space-between;
  position: relative;
}

.gantt-header-cell {
  flex: 1;
  text-align: center;
  border-right: 1px solid #ccc;
  padding: 5px;
}
.gantt-row {
  position: relative;
  height: 30px;
}
.gantt-task {
  position: absolute;
  top: 5px;
  height: 20px;
  background-color: #29b6f6;
  border-radius: 4px;
  padding-left: 7px;
  white-space: nowrap;
  position: 'relative';
  height: '40px';
}
</style>
