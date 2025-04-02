<script setup lang="ts">
import { ref } from "vue";
import DarkModeSwitch from "../lib/components/DarkModeSwitch.vue";
import BDateTime from "../lib/components/BDateTime.vue";
import BDate from "../lib/components/BDate.vue";
import BDiv from "../lib/components/BDiv.vue";
import DatePicker from "../lib/components/DatePicker.vue";
import IconPicker from "../lib/components/IconPicker.vue";
import CloudWords from "../lib/components/CloudWords.vue";
import BLabelSelector from "../lib/components/BLabelSelector.vue";
import BPeriodDateTimePicker from "../lib/components/BPeriodDateTimePicker.vue";
import BSelectorID from "../lib/components/BSelectorID.vue";
import MarkdownEditor from "../lib/components/MarkdownEditor.vue";
import MarkdownBlock from "../lib/components/MarkdownBlock.vue";

// Required variables for components
const date = ref("2025-04-22T22:00:00.000Z");
const fromDate = ref("2025-04-22T22:00:00.000Z");
const toDate = ref("2025-04-23T22:00:00.000Z");
const icon = ref("home");
const selectedLabel = ref(null);
const selectedId = ref("");
const markdownContent = ref("**Hello** _world_");

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
          <td>IconPicker</td>
          <td>
            <IconPicker v-model="icon" />
          </td>
        </tr>
        <tr>
          <td>CloudWords</td>
          <td>
            <CloudWords :words="words" />
          </td>
        </tr>
        <tr>
          <td>BLabelSelector</td>
          <td>
            <BLabelSelector
              v-model="selectedLabel"
              label="Select Label"
              option-label="name"
              url="/api/labels"
            />
          </td>
        </tr>
        <tr>
          <td>BPeriodDateTimePicker</td>
          <td>
            <BPeriodDateTimePicker
              v-model:fromDate="fromDate"
              v-model:toDate="toDate"
              label="Period"
            />
          </td>
        </tr>
        <tr>
          <td>BSelectorID</td>
          <td>
            <BSelectorID
              v-model="selectedId"
              label="Select Item"
              option-value="id"
              option-label="name"
              url="/api/items"
            />
          </td>
        </tr>
        <tr>
          <td>MarkdownEditor</td>
          <td>
            <MarkdownEditor
              v-model="markdownContent"
              :initial-content="markdownContent"
              :active-buttons="[
                'bold',
                'italic',
                'strike',
                'heading',
                'bullet_list',
                'ordered_list',
              ]"
            />
          </td>
        </tr>
        <tr>
          <td>MarkdownBlock</td>
          <td>
            <MarkdownBlock :content="markdownContent" />
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
