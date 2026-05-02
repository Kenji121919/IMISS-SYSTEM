<template>
  <div class="sidebar" :class="{ collapsed }">

    <!-- TOP -->
    <div class="top">
      <h2 v-if="!collapsed" class="logo">IMISS</h2>

      <button class="toggle" @click="$emit('toggle')">
        <Menu />
      </button>
    </div>

    <!-- MENU -->
    <ul class="menu">

      <li v-for="item in menuItems" :key="item.id">
        <router-link
          :to="item.path"
          class="link"
          active-class="active"
        >
          <component :is="item.icon" class="icon" v-if="item.icon" />
          <span v-if="!collapsed">{{ item.name }}</span>
        </router-link>
      </li>

      <!-- EMPTY STATE -->
      <li v-if="menuItems.length === 0" class="empty">
        <span v-if="!collapsed">No modules yet</span>
      </li>

    </ul>

    <!-- LOGOUT -->
    <div class="logout">
      <button @click="logout">
        <LogOut class="icon" />
        <span v-if="!collapsed">Logout</span>
      </button>
    </div>

  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import api from '@/api/axios'

import {
  Menu,
  LogOut,
  User,
  Settings,
  LayoutGrid
} from 'lucide-vue-next'

defineProps({
  collapsed: Boolean
})

const menuItems = ref([])

/* =========================
   LOAD SIDEBAR MENU (FIXED)
========================= */
onMounted(async () => {
  try {
    const activeProfile = JSON.parse(localStorage.getItem('activeProfile'))
    const user = JSON.parse(localStorage.getItem('user'))

    if (!activeProfile || !user) return

    const isAdmin = activeProfile.team?.toLowerCase() === 'admin'

    // ✅ FIX: load ALL modules (NOT user.id)
    const res = await api.get('/modules')

    const modules = res.data || []

    console.log('Modules loaded:', modules)

    if (isAdmin) {
      menuItems.value = [
        {
          id: 'admin-1',
          name: 'Manage Profiles',
          path: '/dashboard/manage-profiles',
          icon: User
        },
        {
          id: 'admin-2',
          name: 'Manage Modules',
          path: '/dashboard/manage-modules',
          icon: Settings
        },

        ...modules.map(mod => ({
          id: mod.id,
          name: mod.name,
          path: `/dashboard/module/${mod.id}`,
          icon: LayoutGrid
        }))
      ]
    } else {
      menuItems.value = modules
        .filter(mod => {
          try {
            const allowed = JSON.parse(mod.allowedProfiles || '[]')
            return allowed.includes(activeProfile.id)
          } catch {
            return false
          }
        })
        .map(mod => ({
          id: mod.id,
          name: mod.name,
          path: `/dashboard/module/${mod.id}`,
          icon: LayoutGrid
        }))
    }

  } catch (err) {
    console.error('Sidebar load error:', err)
    menuItems.value = [] // prevent UI crash
  }
})

/* =========================
   LOGOUT
========================= */
const logout = () => {
  localStorage.clear()
  window.location.href = '/'
}
</script>

<style>
/* SIDEBAR */
.sidebar {
  width: 240px;
  height: 100vh;
  background: #111;
  color: white;
  display: flex;
  flex-direction: column;
  transition: 0.3s ease;
  overflow: hidden;
}

.sidebar.collapsed {
  width: 70px;
}

/* TOP */
.top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
}

/* MENU */
.menu {
  flex: 1;
  list-style: none;
  padding: 15px;
  margin: 0;
}

/* LINK */
.link {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  color: white;
  text-decoration: none;
  border-radius: 8px;
  transition: 0.3s;
}

.link:hover {
  background: #222;
  transform: translateX(3px);
}

.link.active {
  background: #1e90ff;
  box-shadow: 0 0 12px #1e90ff;
}

/* ICON */
.icon {
  width: 22px;
  height: 22px;
}

/* COLLAPSED */
.sidebar.collapsed .link {
  justify-content: center;
}

/* EMPTY STATE */
.empty {
  color: #888;
  padding: 10px;
  text-align: center;
}

/* TOGGLE BUTTON */
.toggle {
  display: flex;
  align-items: center;
  padding: 8px;
  background: black;
  border: none;
  color: white;
  border-radius: 6px;
  cursor: pointer;
}

.toggle:hover {
  background: #222;
}

/* LOGOUT */
.logout {
  padding: 10px;
}

.logout button {
  width: 100%;
  background: red;
  border: none;
  color: white;
  padding: 10px;
  cursor: pointer;
  display: flex;
  gap: 10px;
  justify-content: center;
}
</style>