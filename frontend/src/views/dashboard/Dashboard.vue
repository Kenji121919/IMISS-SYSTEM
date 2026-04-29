<template>
  <div class="layout">
    <Sidebar :collapsed="collapsed" @toggle="collapsed = !collapsed" />

    <div class="content">
      <router-view />
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import Sidebar from '../../components/Sidebar.vue'

const collapsed = ref(false)
</script>

<style>
.layout {
  display: flex;
  width: 100vw;
  height: 100vh; /* 🔥 CRITICAL */
  overflow: hidden;
}

.content {
  flex: 1;
  height: 100vh; /* 🔥 CRITICAL */
  overflow-y: auto;
  background: #f5f5f5;
}
</style>