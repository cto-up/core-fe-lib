<template>
  <div id="q-app" style="min-height: 100vh">
    <div class="q-pa-md row justify-center">
      <div style="width: 100%; max-width: 400px">
        <q-chat-message
          :text="['Have you seen Quasar?']"
          sent
          text-color="white"
          bg-color="primary"
        >
          <template v-slot:name>me</template>
          <template v-slot:stamp>7 minutes ago</template>
          <template v-slot:avatar>
            <img
              class="q-message-avatar q-message-avatar--sent"
              src="https://cdn.quasar.dev/img/avatar4.jpg"
            />
          </template>
        </q-chat-message>

        <q-chat-message bg-color="amber">
          <template v-slot:name>Mary</template>
          <template v-slot:avatar>
            <img
              class="q-message-avatar q-message-avatar--received"
              src="https://cdn.quasar.dev/img/avatar2.jpg"
            />
          </template>

          <div>
            Already building an app with it...
            <img
              src="https://cdn.quasar.dev/img/discord-qeart.png"
              class="my-emoji"
            />
          </div>

          <q-spinner-dots size="2rem"></q-spinner-dots>
        </q-chat-message>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
defineProps({
  page: {
    type: Number,
    required: false,
  },
  nextDisable: {
    type: Boolean,
    required: false,
  },
});
</script>

<style scoped>
[dark='true']:not([color='primary']) {
  background: rgb(60, 60, 60);
}

[dark='false']:not([color='primary']) {
  background: rgb(241, 241, 241);
}
</style>
