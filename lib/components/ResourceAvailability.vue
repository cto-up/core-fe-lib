<template>
  <!-- Year row -->
  <div class="row date-header">
    <div
      v-for="yearGroup in yearGroups"
      :key="yearGroup.year"
      :style="'width: ' + yearGroup.width + '%'"
      class="date-header-cell"
    >
      {{ yearGroup.year }}
    </div>
  </div>
  <!-- Month row -->
  <div v-if="yearGroups.length <= 2" class="row date-header">
    <div
      v-for="monthGroup in monthGroups"
      :key="monthGroup.key"
      :style="'width: ' + monthGroup.width + '%'"
      class="date-header-cell"
    >
      {{ formatMonth(monthGroup.date) }}
    </div>
  </div>
  <!-- Day row -->
  <div v-if="dateRange.length <= 60" class="row date-header">
    <div
      v-for="date in dateRange"
      :key="date.toDateString()"
      :style="'width: ' + dateWidth + '%'"
      class="date-header-cell"
    >
      {{ formatDay(date) }}
      <q-tooltip>
        {{ formatLongDate(date) }}
      </q-tooltip>
    </div>
  </div>
  <q-expansion-item
    v-for="(projectStaffing, projectId) in groupedStaffing"
    :key="projectId"
    expand-separator
    default-opened
  >
    <template v-slot:header>
      <q-item-section avatar>
        <q-avatar :icon="projectStaffing.icon" text-color="white"></q-avatar>
      </q-item-section>

      <q-item-section> {{ projectStaffing.name }} </q-item-section>

      <q-item-section side>
        <q-btn
          flat
          icon="arrow_circle_right"
          @click="handleGoToProject(projectId)"
        >
          <q-tooltip> Go to project </q-tooltip>
        </q-btn>
      </q-item-section>
    </template>

    <div
      class="row gantt-row"
      v-for="staffing in projectStaffing.staffings"
      :key="staffing.id"
    >
      <div
        :class="
          'gantt-task ' +
          (staffing.status == 'FORECAST' ? 'forecast' : 'actual')
        "
        :style="calculateTaskPosition(staffing)"
      >
        <q-icon
          :name="
            staffing.status === 'FORECAST' ? 'self_improvement' : 'how_to_reg'
          "
        />
        {{ staffing.resource?.name }} - {{ staffing.allocation }}%
        <q-tooltip>
          {{ staffing.start_date }} - {{ staffing.end_date }}
        </q-tooltip>
      </div>
    </div>
  </q-expansion-item>
</template>

<script lang="ts" setup>
import useDate from 'composables/useDate';
import { DefaultService, StaffingView } from 'src/openapi/project';
import { computed, onMounted, ref, watch } from 'vue';
import { useRouter } from 'vue-router';

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

const router = useRouter();

const visibleFromDate = computed(() => new Date(props.from_date));

const visibleToDate = computed(() => new Date(props.to_date));

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

type ProjectStaffingView = {
  id: string;
  name: string;
  icon?: string;
  staffings: StaffingView[];
};

const groupedStaffing = computed(() => {
  return staffingList.value.reduce(
    (acc: Record<string, ProjectStaffingView>, staffing: StaffingView) => {
      const projectId = staffing.project?.id || 'Unassigned';
      if (!acc[projectId]) {
        acc[projectId] = {
          id: projectId,
          icon: staffing.project?.icon,
          name: staffing.project?.name || 'Unassigned',
          staffings: [],
        };
      }
      acc[projectId].staffings.push(staffing);
      return acc;
    },
    {}
  );
});

const daysBetween = (start: Date, end: Date) => {
  return Math.round(Math.abs(+start - +end) / 8.64e7);
};

const formatLongDate = (date: Date) => {
  const options: Intl.DateTimeFormatOptions = {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  };
  return date.toLocaleDateString('en-US', options);
};

const yearGroups = computed(() => {
  const groups: { year: number; count: number; width: number }[] = [];

  if (!dateRange.value[0]) {
    return groups;
  }

  let currentYear = dateRange.value[0].getFullYear();
  let count = 0;

  dateRange.value.forEach((date) => {
    if (date.getFullYear() === currentYear) {
      count++;
    } else {
      groups.push({ year: currentYear, count, width: count * dateWidth.value });
      currentYear = date.getFullYear();
      count = 1;
    }
  });

  groups.push({ year: currentYear, count, width: count * dateWidth.value });
  return groups;
});

const monthGroups = computed(() => {
  const groups: { key: string; date: Date; count: number; width: number }[] =
    [];
  let currentKey = `${dateRange.value[0].getFullYear()}-${dateRange.value[0].getMonth()}`;
  let currentDate = dateRange.value[0];
  let count = 0;

  dateRange.value.forEach((date) => {
    const key = `${date.getFullYear()}-${date.getMonth()}`;
    if (key === currentKey) {
      count++;
    } else {
      groups.push({
        key: currentKey,
        date: currentDate,
        count,
        width: count * dateWidth.value,
      });
      currentKey = key;
      currentDate = date;
      count = 1;
    }
  });

  groups.push({
    key: currentKey,
    date: currentDate,
    count,
    width: count * dateWidth.value,
  });
  return groups;
});

const formatMonth = (date: Date) => {
  return date.toLocaleString('default', { month: 'short' });
};

const formatDay = (date: Date) => {
  return date.getDate();
};

const updateDateRange = () => {
  dateRange.value = [];
  const endDate = new Date(visibleToDate.value);
  endDate.setHours(23, 59, 59, 999); // Set to end of day
  for (
    let d = new Date(visibleFromDate.value);
    d <= endDate;
    d = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1)
  ) {
    const dateToAdd = new Date(d);
    dateRange.value.push(dateToAdd);
  }
};

// Generate date range for the Gantt chart (e.g., entire month of September 2024)
const dateRange = ref<Date[]>([]);

updateDateRange();
// Calculate the task position based on its start and end dates
const calculateTaskPosition = (task: StaffingView) => {
  let visibleTaskStartDate;
  if (task.start_date) {
    visibleTaskStartDate = new Date(task.start_date);
  } else {
    console.error('visibleTaskStartDate task.start_date null');
    visibleTaskStartDate = new Date();
  }
  let visibleTaskEndDate;
  if (task.end_date) {
    visibleTaskEndDate = new Date(task.end_date);
  } else {
    console.error('visibleTaskEndDate task.end_date null');
    visibleTaskEndDate = new Date();
  }

  visibleTaskStartDate =
    visibleTaskStartDate < visibleFromDate.value
      ? visibleFromDate.value
      : visibleTaskStartDate;
  visibleTaskEndDate =
    visibleTaskEndDate > visibleToDate.value
      ? visibleToDate.value
      : visibleTaskEndDate;

  const isVisible =
    visibleTaskStartDate <= visibleToDate.value ||
    visibleTaskEndDate >= visibleFromDate.value;

  const totalDays = daysBetween(visibleFromDate.value, visibleToDate.value) + 1;
  const startOffset = daysBetween(visibleFromDate.value, visibleTaskStartDate);
  const duration = daysBetween(visibleTaskStartDate, visibleTaskEndDate) + 1;
  const width = (duration / totalDays) * 100;
  const left = (startOffset / totalDays) * 100;

  return {
    left: `${left}%`,
    width: `${width}%`,
    display: isVisible ? 'block' : 'none',
  };
};

const dateWidth = computed(() => {
  const totalDays = daysBetween(visibleFromDate.value, visibleToDate.value) + 1;
  return 100 / totalDays;
});

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

const handleGoToProject = (projectID: string) => {
  router.push({
    name: 'edit-project',
    params: { id: projectID },
  });
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
.date-header {
  justify-content: space-between;
  position: relative;
}

.date-header-cell {
  text-align: center;
  border: 1px solid rgba(205, 205, 205, 0.1);
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
  border-radius: 4px;
  padding-left: 7px;
  white-space: nowrap;
  position: 'relative';
  height: '40px';
}
.forecast {
  background-color: #29b6f6;
}
.actual {
  background-color: #4caf50;
}
</style>
