<template>
  <div class="home">
    <h1>Welcome to IMISS Dashboard</h1>
    <p v-if="isAdmin">
      Use the sidebar to manage profiles and create modules.
    </p>
    <p v-else>
      No modules assigned yet. Please contact admin.
    </p>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const activeProfile = JSON.parse(localStorage.getItem('activeProfile'))

const isAdmin = computed(() => {
  return activeProfile?.team?.toLowerCase() === 'admin'
})
</script>

<style scoped>
.home {
  padding: 30px;
}
</style>