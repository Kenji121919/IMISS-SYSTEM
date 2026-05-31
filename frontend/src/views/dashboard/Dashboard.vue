<template>
  <div class="layout">

    <!-- Mobile hamburger (only shows on mobile when sidebar is closed) -->
    <button
      v-if="isMobile && collapsed"
      class="hamburger"
      @click="collapsed = false"
      title="Open menu"
    >
      <Menu :size="18" />
    </button>

    <Sidebar :collapsed="collapsed" @toggle="collapsed = !collapsed" />

    <div class="content" :class="{ 'mobile-content': isMobile }">
      <router-view />
    </div>

  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import Sidebar from '../../components/Sidebar.vue'
import { Menu } from 'lucide-vue-next'

const MOBILE_BP = 768
const isMobile  = ref(window.innerWidth <= MOBILE_BP)
const collapsed = ref(window.innerWidth <= MOBILE_BP)

const onResize = () => {
  const mobile = window.innerWidth <= MOBILE_BP
  isMobile.value  = mobile
  // Auto-collapse when shrinking to mobile
  if (mobile) collapsed.value = true
  // Auto-expand when going back to desktop
  if (!mobile) collapsed.value = false
}

onMounted(()  => window.addEventListener('resize', onResize))
onUnmounted(() => window.removeEventListener('resize', onResize))
</script>

<style>
.layout {
  display: flex;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  position: relative;
}

.content {
  flex: 1;
  height: 100vh;
  overflow-y: auto;
  background: #f5f5f5;
  min-width: 0;        /* prevents flex blowout */
}

/* On mobile the sidebar is a fixed overlay so content takes full width */
.content.mobile-content {
  width: 100%;
}

/* Hamburger button — fixed top-left on mobile */
.hamburger {
  position: fixed;
  top: 12px;
  left: 12px;
  z-index: 60;
  background: #111827;
  color: white;
  border: none;
  border-radius: 8px;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(0,0,0,0.25);
  transition: background 0.15s;
}
.hamburger:hover {
  background: #1f2937;
}
</style>