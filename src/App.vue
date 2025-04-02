<script setup lang="ts">
import { ref } from "vue";
import DarkModeSwitch from "../lib/components/DarkModeSwitch.vue";
import BDateTime from "../lib/components/BDateTime.vue";
import BDate from "../lib/components/BDate.vue";
import BDiv from "../lib/components/BDiv.vue";
import DatePicker from "../lib/components/DatePicker.vue";
import IconPicker from "../lib/components/IconPicker.vue";
import SavingProcessIndicator from "../lib/components/SavingProcessIndicator.vue";
import CloudWords from "../lib/components/CloudWords.vue";

// Required variables for components
const date = ref("2025-04-22T22:00:00.000Z");
const icon = ref("home");
const resourceIds = ref(["1", "2"]);
const projectIds = ref(["1", "2"]);

// Sample data for CloudWords
const words = ref([
  { text: "Vue", weight: 5 },
  { text: "Component", weight: 3 },
  { text: "Library", weight: 4 },
]);

// Translation fields
const translationFields = [
  { name: "title", display: "Title" },
  { name: "description", display: "Description" },
];
</script>

<template>
  <div class="q-pa-md">
    <DarkModeSwitch />
    <table class="component-table">
      <thead>
        <tr>
          <th>Component Name</th>
          <th>Preview</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>BDateTime</td>
          <td>
            <BDateTime v-model="date" label="Date and Time" />
          </td>
        </tr>
        <tr>
          <td>BDate</td>
          <td>
            <BDate v-model="date" label="Date" />
          </td>
        </tr>
        <tr>
          <td>BDiv</td>
          <td>
            <BDiv text="Sample Text">This is a sample div</BDiv>
          </td>
        </tr>
        <tr>
          <td>DatePicker</td>
          <td>
            <DatePicker v-model="date" />
          </td>
        </tr>
        <tr>
          <td>CloudWords</td>
          <td>
            <CloudWords :words="words" />
          </td>
        </tr>
        <tr>
          <td>IconPicker</td>
          <td>
            <IconPicker v-model="icon" />
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<style scoped>
.component-table {
  width: 100%;
  border-collapse: collapse;
  margin: 20px 0;
}

.component-table th,
.component-table td {
  border: 1px solid rgb(200, 200, 200, 0.2);
  padding: 12px;
  text-align: left;
}

.component-table th {
  background-color: rgb(200, 200, 200, 0.2);
  font-weight: bold;
}

.component-table tr:hover {
  background-color: rgb(200, 200, 200, 0.1);
}

/* First column width */
.component-table th:first-child,
.component-table td:first-child {
  width: 200px;
}
</style>
