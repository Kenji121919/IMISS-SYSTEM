<template>
  <div class="sidebar" :class="{ collapsed }">

    <!-- ===== TOP / LOGO ===== -->
    <div class="sidebar-top">
  <div class="logo-wrap">
    <span v-if="!collapsed" class="logo-text">IMISS</span>
  </div>
  <button class="toggle-btn" @click="$emit('toggle')" :title="collapsed ? 'Expand' : 'Collapse'">
    <Menu :size="16" />
  </button>
</div>

<!-- PROFILE BADGE -->
<div class="profile-badge" :class="{ collapsed }">
  <div class="profile-badge-avatar" :style="{ background: avatarColor(activeProfile.name || '') }">
    {{ activeProfile.name?.charAt(0).toUpperCase() }}
  </div>
  <div v-if="!collapsed" class="profile-badge-info">
    <div class="profile-badge-name">{{ activeProfile.name }}</div>
    
  </div>
</div>

    <!-- ===== MENU ===== -->
    <div class="menu-wrap">

      <!-- ADMIN SECTION -->
      <div v-if="adminItems.length" class="menu-section">
        <div v-if="!collapsed" class="section-label">Admin</div>
        <div v-else class="section-divider"></div>

        <router-link
          v-for="item in adminItems"
          :key="item.id"
          :to="item.path"
          class="menu-link"
          :active-class="item.exact ? '' : 'active'"
          :exact-active-class="item.exact ? 'active' : ''"
          :title="collapsed ? item.name : ''"
        >
          <component :is="item.icon" :size="17" class="menu-icon" />
          <span v-if="!collapsed" class="menu-label">{{ item.name }}</span>
        </router-link>
      </div>

      <!-- MODULES SECTION -->
      <div v-if="moduleItems.length" class="menu-section">
        <div v-if="!collapsed" class="section-label">Modules</div>
        <div v-else class="section-divider"></div>

        <router-link
          v-for="item in moduleItems"
          :key="item.id"
          :to="item.path"
          class="menu-link"
          active-class="active"
          :title="collapsed ? item.name : ''"
        >
          <component :is="item.icon" :size="17" class="menu-icon" />
          <span v-if="!collapsed" class="menu-label">{{ item.name }}</span>
        </router-link>
      </div>

      <!-- EMPTY STATE -->
      <div v-if="!adminItems.length && !moduleItems.length" class="empty-state">
        <span v-if="!collapsed">No modules available</span>
        <span v-else>—</span>
      </div>

    </div>

    <!-- ===== BOTTOM ACTIONS ===== -->
    <div class="sidebar-bottom">
      <div class="bottom-divider"></div>

      <!-- BACK TO PROFILE -->
      <button
        class="bottom-btn secondary"
        @click="backToProfile"
        :title="collapsed ? 'Switch profile' : ''"
      >
        <User :size="16" class="menu-icon" />
        <span v-if="!collapsed">Switch profile</span>
      </button>

      <!-- LOGOUT -->
      <button
        class="bottom-btn danger"
        @click="logout"
        :title="collapsed ? 'Logout' : ''"
      >
        <LogOut :size="16" class="menu-icon" />
        <span v-if="!collapsed">Logout</span>
      </button>
    </div>

  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import api from '@/api/axios'
import { Menu, LogOut, User, Settings, LayoutGrid, LayoutDashboard, BarChart2 } from 'lucide-vue-next'
defineProps({ collapsed: Boolean })
defineEmits(['toggle'])

const activeProfile = JSON.parse(localStorage.getItem('activeProfile') || '{}')
const COLORS = [
  '#6366f1','#0ea5e9','#10b981','#f59e0b',
  '#ec4899','#8b5cf6','#14b8a6','#f97316'
]
const avatarColor = (name) => name ? COLORS[name.charCodeAt(0) % COLORS.length] : '#6366f1'
const menuItems = ref([])

/* ===== SPLIT ITEMS ===== */
const adminItems = computed(() => menuItems.value.filter(i => i.isAdmin))
const moduleItems = computed(() => menuItems.value.filter(i => !i.isAdmin))

/* ===== LOAD ===== */
onMounted(async () => {
  try {
    const activeProfile = JSON.parse(localStorage.getItem('activeProfile'))
    const user = JSON.parse(localStorage.getItem('user'))
    if (!activeProfile || !user) return

    const isAdmin =
      activeProfile.team?.toLowerCase?.() === 'admin' ||
      activeProfile.name?.toLowerCase?.() === 'admin'

    const res = await api.get(`/modules/${user.id}`)
    const modules = res.data || []

if (isAdmin) {
  menuItems.value = [
    //{ id: 'admin-0', name: 'Dashboard',       path: '/dashboard',                  icon: LayoutDashboard, isAdmin: true, exact: true },
    { id: 'admin-a', name: 'Analytics',        path: '/dashboard/analytics',        icon: BarChart2,       isAdmin: true },
    { id: 'admin-1', name: 'Manage Profiles',  path: '/dashboard/manage-profiles',  icon: User,            isAdmin: true },
    { id: 'admin-2', name: 'Manage Modules',   path: '/dashboard/manage-modules',   icon: Settings,        isAdmin: true },
    { id: 'admin-3', name: 'Audit Trail',      path: '/dashboard/audit-trail',      icon: Settings,        isAdmin: true },
    ...modules.map(mod => ({
      id:      mod.id,
      name:    mod.name,
      path:    `/dashboard/module/${mod.id}`,
      icon:    LayoutGrid,
      isAdmin: false
    }))
  ]
} else {
  menuItems.value = [
    //{ id: 'user-dash', name: 'My Dashboard', path: '/dashboard/my-dashboard', icon: LayoutDashboard, isAdmin: false },
    ...modules
      .filter(mod => {
        try {
          const allowed = typeof mod.allowedProfiles === 'string'
            ? JSON.parse(mod.allowedProfiles)
            : mod.allowedProfiles || []
          return allowed.includes(activeProfile.id)
        } catch { return false }
      })
      .map(mod => ({
        id:      mod.id,
        name:    mod.name,
        path:    `/dashboard/module/${mod.id}`,
        icon:    LayoutGrid,
        isAdmin: false
      }))
  ]
}
  } catch (err) {
    console.error('Sidebar load error:', err)
    menuItems.value = []
  }
})

/* ===== ACTIONS ===== */
const backToProfile = () => {
  localStorage.removeItem('activeProfile')
  window.location.href = '/profiles'
}

const logout = () => {
  localStorage.clear()
  window.location.href = '/'
}
</script>

<style scoped>
/* ===== SIDEBAR ===== */
.sidebar {
  width: 240px;
  height: 100vh;
  background: #111827;
  color: white;
  display: flex;
  flex-direction: column;
  transition: width 0.25s ease;
  overflow: hidden;
  flex-shrink: 0;
  border-right: 1px solid rgba(255,255,255,0.06);
}

.sidebar.collapsed {
  width: 64px;
}

/* ===== TOP ===== */
.sidebar-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 12px;
  border-bottom: 1px solid rgba(255,255,255,0.06);
  min-height: 56px;
  flex-shrink: 0;
}

.logo-wrap {
  display: flex;
  align-items: center;
  gap: 9px;
  overflow: hidden;
}

.logo-mark {
  width: 30px;
  height: 30px;
  background: #3b82f6;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: 800;
  color: white;
  letter-spacing: 0.5px;
  flex-shrink: 0;
  font-family: Inter, Arial, sans-serif;
}

.logo-text {
  font-size: 15px;
  font-weight: 700;
  color: white;
  letter-spacing: 1px;
  font-family: Inter, Arial, sans-serif;
  white-space: nowrap;
}

.toggle-btn {
  width: 28px;
  height: 28px;
  border: none;
  background: rgba(255,255,255,0.06);
  color: #9ca3af;
  border-radius: 7px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: all 0.15s;
}
.toggle-btn:hover {
  background: rgba(255,255,255,0.12);
  color: white;
}

/* ===== MENU ===== */
.menu-wrap {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 8px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  scrollbar-width: thin;
  scrollbar-color: rgba(255,255,255,0.1) transparent;
}

.menu-section {
  display: flex;
  flex-direction: column;
  gap: 2px;
  margin-bottom: 6px;
}

.section-label {
  font-size: 10px;
  font-weight: 600;
  color: rgba(255,255,255,0.3);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  padding: 6px 8px 4px;
  white-space: nowrap;
  font-family: Inter, Arial, sans-serif;
}

.section-divider {
  height: 1px;
  background: rgba(255,255,255,0.08);
  margin: 6px 4px;
}

/* ===== LINKS ===== */
.menu-link {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 9px 10px;
  border-radius: 9px;
  color: rgba(255,255,255,0.6);
  text-decoration: none;
  font-size: 13px;
  font-weight: 500;
  font-family: Inter, Arial, sans-serif;
  transition: all 0.15s;
  white-space: nowrap;
  overflow: hidden;
}

.menu-link:hover {
  background: rgba(255,255,255,0.07);
  color: white;
}

.menu-link.active {
  background: rgba(59,130,246,0.15);
  color: #60a5fa;
  border: 1px solid rgba(59,130,246,0.2);
}

.menu-link.active .menu-icon {
  color: #3b82f6;
}

.sidebar.collapsed .menu-link {
  justify-content: center;
  padding: 9px;
}

.menu-icon {
  flex-shrink: 0;
  color: currentColor;
}

.menu-label {
  overflow: hidden;
  text-overflow: ellipsis;
}

/* ===== EMPTY STATE ===== */
.empty-state {
  font-size: 12px;
  color: rgba(255,255,255,0.25);
  text-align: center;
  padding: 16px 8px;
  font-family: Inter, Arial, sans-serif;
}

/* ===== BOTTOM ===== */
.sidebar-bottom {
  flex-shrink: 0;
  padding: 8px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.bottom-divider {
  height: 1px;
  background: rgba(255,255,255,0.08);
  margin-bottom: 6px;
}

.bottom-btn {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 9px 10px;
  border-radius: 9px;
  border: none;
  cursor: pointer;
  font-size: 13px;
  font-weight: 500;
  font-family: Inter, Arial, sans-serif;
  transition: all 0.15s;
  white-space: nowrap;
  overflow: hidden;
}

.sidebar.collapsed .bottom-btn {
  justify-content: center;
  padding: 9px;
}

/* Secondary (Switch Profile) */
.bottom-btn.secondary {
  background: transparent;
  color: rgba(255,255,255,0.5);
}
.bottom-btn.secondary:hover {
  background: rgba(255,255,255,0.07);
  color: white;
}

/* Danger (Logout) */
.bottom-btn.danger {
  background: transparent;
  color: rgba(239,68,68,0.7);
}
.bottom-btn.danger:hover {
  background: rgba(239,68,68,0.1);
  color: #ef4444;
}

.profile-badge {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-bottom: 1px solid rgba(255,255,255,0.06);
  flex-shrink: 0;
}
.profile-badge.collapsed {
  justify-content: center;
  padding: 10px;
}
.profile-badge-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  font-weight: 700;
  color: white;
  flex-shrink: 0;
}
.profile-badge-info {
  overflow: hidden;
}
.profile-badge-name {
  font-size: 13px;
  font-weight: 600;
  color: white;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.profile-badge-role {
  font-size: 11px;
  color: rgba(255,255,255,0.35);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>