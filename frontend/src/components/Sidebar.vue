<template>
  <div>
    <transition name="fade">
      <div
        v-if="isMobile && !collapsed"
        class="sidebar-backdrop"
        @click="$emit('toggle')"
      />
    </transition>

    <div class="sidebar" :class="{ collapsed, mobile: isMobile }">

      <!-- ===== TOP / LOGO ===== -->
      <div class="sidebar-top">
        <div class="logo-wrap">
          <span v-if="!collapsed" class="logo-text">{{ organizationName || 'IMISS' }}</span>
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
            @click="onNavClick"
          >
            <component :is="item.icon" :size="17" class="menu-icon" />
            <span v-if="!collapsed" class="menu-label">{{ item.name }}</span>
          </router-link>
        </div>

        <div v-if="moduleItems.length" class="menu-section">
          <div v-if="!collapsed" class="section-label">Modules</div>
          <div v-else class="section-divider"></div>

          <router-link
            v-for="item in moduleItems"
            :key="item.id"
            :to="item.path"
            class="menu-link"
            :active-class="'active'"
            :title="collapsed ? item.name : ''"
            @click="markSeen(item.id)"
          >
            <div class="menu-icon-wrap">
              <component :is="item.icon" :size="17" class="menu-icon" />
              <!-- Unseen badge: dot when collapsed, count when expanded -->
              <span
                v-if="unseenCounts[item.id] > 0"
                :class="['unseen-badge', { dot: collapsed }]"
              >
                <template v-if="!collapsed">{{ unseenCounts[item.id] > 99 ? '99+' : unseenCounts[item.id] }}</template>
              </span>
            </div>
            <span v-if="!collapsed" class="menu-label">{{ item.name }}</span>
          </router-link>
        </div>

        <div v-if="!adminItems.length && !moduleItems.length" class="empty-state">
          <span v-if="!collapsed">No modules available</span>
          <span v-else>—</span>
        </div>

      </div>

      <!-- ===== BOTTOM ACTIONS ===== -->
      <div class="sidebar-bottom">
        <div class="bottom-divider"></div>

        <button class="bottom-btn secondary" @click="backToProfile" :title="collapsed ? 'Switch profile' : ''">
          <User :size="16" class="menu-icon" />
          <span v-if="!collapsed">Switch profile</span>
        </button>

        <button class="bottom-btn danger" @click="logout" :title="collapsed ? 'Logout' : ''">
          <LogOut :size="16" class="menu-icon" />
          <span v-if="!collapsed">Logout</span>
        </button>
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import api from '@/api/axios'
import { Menu, LogOut, User, Settings, LayoutGrid, BarChart2 } from 'lucide-vue-next'

const props = defineProps({ collapsed: Boolean })
const emit  = defineEmits(['toggle', 'update:collapsed'])

const route         = useRoute()
const activeProfile = JSON.parse(localStorage.getItem('activeProfile') || '{}')
const COLORS = [
  '#6366f1','#0ea5e9','#10b981','#f59e0b',
  '#ec4899','#8b5cf6','#14b8a6','#f97316'
]
const avatarColor = (name) => name ? COLORS[name.charCodeAt(0) % COLORS.length] : '#6366f1'
const menuItems = ref([])

/* ===== ORGANIZATION ===== */
const organizationName = ref('')
try {
  const user = JSON.parse(localStorage.getItem('user') || '{}')
  organizationName.value = user.organizationName || ''
} catch {}

const orgInitials = computed(() => {
  const name = organizationName.value || 'IM'
  return name
    .split(' ')
    .map(w => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
})

/* ===== MOBILE DETECTION ===== */
const MOBILE_BP = 768
const isMobile  = ref(window.innerWidth <= MOBILE_BP)

const onResize = () => {
  const nowMobile = window.innerWidth <= MOBILE_BP
  if (nowMobile && !isMobile.value && !props.collapsed) emit('toggle')
  if (!nowMobile && isMobile.value && props.collapsed)  emit('toggle')
  isMobile.value = nowMobile
}

const onNavClick = () => {
  if (isMobile.value && !props.collapsed) emit('toggle')
}

/* ===== UNSEEN BADGE LOGIC ===== */
// localStorage key: `imiss_last_seen_{moduleId}` → ISO timestamp string
const unseenCounts = ref({})

const SEEN_KEY = (id) => `imiss_last_seen_${id}`

const markSeen = (moduleId) => {
  localStorage.setItem(SEEN_KEY(moduleId), new Date().toISOString())
  unseenCounts.value[moduleId] = 0
  onNavClick()
}

// Fetch logs for all module items and count those newer than last-seen timestamp
const refreshUnseenCounts = async () => {
  const modules = moduleItems.value
  if (!modules.length) return

  await Promise.allSettled(
    modules.map(async (item) => {
      try {
        // If user is currently viewing this module, treat as seen
        if (route.params.id && String(route.params.id) === String(item.id)) {
          localStorage.setItem(SEEN_KEY(item.id), new Date().toISOString())
          unseenCounts.value[item.id] = 0
          return
        }

        const lastSeen = localStorage.getItem(SEEN_KEY(item.id))
        const res      = await api.get(`/logs/module/${item.id}`)
        const logs     = res.data || []

        if (!lastSeen) {
          // Never visited — all existing logs count as unseen
          unseenCounts.value[item.id] = logs.length
        } else {
          const lastSeenDate = new Date(lastSeen)
          unseenCounts.value[item.id] = logs.filter(log => {
            const created = log.createdAt || log.created_at || log.timestamp
            return created && new Date(created) > lastSeenDate
          }).length
        }
      } catch {
        // Silently skip if module logs can't be fetched
        unseenCounts.value[item.id] = unseenCounts.value[item.id] ?? 0
      }
    })
  )
}

/* ===== LOAD MENU ITEMS ===== */
const loadMenuItems = async () => {
  try {
    const storedProfile = JSON.parse(localStorage.getItem('activeProfile'))
    const user          = JSON.parse(localStorage.getItem('user'))
    if (!storedProfile || !user) return

    const isAdmin =
      storedProfile.team?.toLowerCase?.() === 'admin' ||
      storedProfile.name?.toLowerCase?.() === 'admin'

    const res     = await api.get(`/modules/${user.id}`)
    const modules = res.data || []

    if (isAdmin) {
      menuItems.value = [
        { id: 'admin-a', name: 'Analytics',       path: '/dashboard/analytics',       icon: BarChart2, isAdmin: true },
        { id: 'admin-1', name: 'Manage Profiles', path: '/dashboard/manage-profiles', icon: User,      isAdmin: true },
        { id: 'admin-2', name: 'Manage Modules',  path: '/dashboard/manage-modules',  icon: Settings,  isAdmin: true },
        { id: 'admin-3', name: 'Audit Trail',     path: '/dashboard/audit-trail',     icon: Settings,  isAdmin: true },
        ...modules.map(mod => ({
          id:      mod.id,
          name:    mod.name,
          path:    `/dashboard/module/${mod.id}`,
          icon:    LayoutGrid,
          isAdmin: false
        }))
      ]
    } else {
      menuItems.value = modules
        .filter(mod => {
          try {
            const allowed = typeof mod.allowedProfiles === 'string'
              ? JSON.parse(mod.allowedProfiles)
              : mod.allowedProfiles || []
            return allowed.includes(storedProfile.id)
          } catch { return false }
        })
        .map(mod => ({
          id:      mod.id,
          name:    mod.name,
          path:    `/dashboard/module/${mod.id}`,
          icon:    LayoutGrid,
          isAdmin: false
        }))
    }

    // After loading modules, compute unseen counts
    await refreshUnseenCounts()
  } catch (err) {
    console.error('Sidebar load error:', err)
    menuItems.value = []
  }
}

/* ===== POLLING: refresh unseen counts every 30s ===== */
let unseenPollInterval = null

const startUnseenPolling = () => {
  unseenPollInterval = setInterval(() => {
    if (!document.hidden) refreshUnseenCounts()
  }, 30_000)
}

const stopUnseenPolling = () => {
  if (unseenPollInterval) { clearInterval(unseenPollInterval); unseenPollInterval = null }
}

/* ===== LISTEN FOR MODULE-CREATED EVENT (from ManageModules page) ===== */
const onModuleCreated = () => loadMenuItems()

onMounted(async () => {
  window.addEventListener('resize', onResize)
  window.addEventListener('imiss:module-created', onModuleCreated)

  if (isMobile.value && !props.collapsed) emit('toggle')

  await loadMenuItems()
  startUnseenPolling()
})

onUnmounted(() => {
  window.removeEventListener('resize', onResize)
  window.removeEventListener('imiss:module-created', onModuleCreated)
  stopUnseenPolling()
})

const adminItems  = computed(() => menuItems.value.filter(i => i.isAdmin))
const moduleItems = computed(() => menuItems.value.filter(i => !i.isAdmin))

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
.sidebar-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 40;
}
.fade-enter-active, .fade-leave-active { transition: opacity 0.25s ease; }
.fade-enter-from, .fade-leave-to       { opacity: 0; }

.sidebar {
  width: 240px;
  height: 100vh;
  background: #111827;
  color: white;
  display: flex;
  flex-direction: column;
  transition: width 0.25s ease, transform 0.25s ease;
  overflow: hidden;
  flex-shrink: 0;
  border-right: 1px solid rgba(255,255,255,0.06);
  position: relative;
  z-index: 50;
}

.sidebar.collapsed { width: 64px; }

.sidebar.mobile {
  position: fixed;
  top: 0; left: 0;
  height: 100vh;
  width: 240px;
  transform: translateX(0);
  box-shadow: 4px 0 24px rgba(0,0,0,0.4);
}
.sidebar.mobile.collapsed {
  width: 240px;
  transform: translateX(-100%);
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
  gap: 8px;
}

.logo-wrap {
  display: flex;
  align-items: center;
  gap: 9px;
  overflow: hidden;
  min-width: 0;
}

.logo-mark {
  width: 28px;
  height: 28px;
  background: #3b82f6;
  border-radius: 7px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  font-weight: 800;
  color: white;
  letter-spacing: 0.3px;
  flex-shrink: 0;
}

.logo-text {
  font-size: 1.4rem;
  font-weight: 700;
  color: white;
  letter-spacing: 1px;
  transition: all 0.3s ease;
}

.logo-text:hover {
  color: #4facfe;
  transform: translateX(3px);
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
.toggle-btn:hover { background: rgba(255,255,255,0.12); color: white; }

/* ===== PROFILE BADGE ===== */
.profile-badge {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-bottom: 1px solid rgba(255,255,255,0.06);
  flex-shrink: 0;
}
.profile-badge.collapsed { justify-content: center; padding: 10px; }

.profile-badge-avatar {
  width: 32px; height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  font-weight: 700;
  color: white;
  flex-shrink: 0;
}
.profile-badge-info { overflow: hidden; }
.profile-badge-name {
  font-size: 13px;
  font-weight: 600;
  color: white;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
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

.menu-section { display: flex; flex-direction: column; gap: 2px; margin-bottom: 6px; }

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
.menu-link:hover  { background: rgba(255,255,255,0.07); color: white; }
.menu-link.active {
  background: rgba(59,130,246,0.15);
  color: #60a5fa;
  border: 1px solid rgba(59,130,246,0.2);
}
.menu-link.active .menu-icon { color: #3b82f6; }

.sidebar:not(.mobile).collapsed .menu-link { justify-content: center; padding: 9px; }

/* ===== ICON WRAP + UNSEEN BADGE ===== */
.menu-icon-wrap {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.menu-icon  { flex-shrink: 0; color: currentColor; }
.menu-label { overflow: hidden; text-overflow: ellipsis; flex: 1; }

/* Count badge (expanded sidebar) */
.unseen-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 18px;
  height: 18px;
  padding: 0 5px;
  border-radius: 99px;
  background: #ef4444;
  color: white;
  font-size: 10px;
  font-weight: 700;
  line-height: 1;
  margin-left: auto;
  flex-shrink: 0;
  box-shadow: 0 1px 4px rgba(239,68,68,0.4);
  /* Subtle pulse to draw attention */
  animation: badge-pulse 2.5s ease-in-out infinite;
}

/* Dot badge (collapsed sidebar) */
.unseen-badge.dot {
  position: absolute;
  top: -3px;
  right: -4px;
  min-width: 8px;
  width: 8px;
  height: 8px;
  padding: 0;
  border: 1.5px solid #111827;
  border-radius: 50%;
}

@keyframes badge-pulse {
  0%, 100% { opacity: 1; }
  50%       { opacity: 0.7; }
}

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

.bottom-divider { height: 1px; background: rgba(255,255,255,0.08); margin-bottom: 6px; }

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

.sidebar:not(.mobile).collapsed .bottom-btn { justify-content: center; padding: 9px; }

.bottom-btn.secondary { background: transparent; color: rgba(255,255,255,0.5); }
.bottom-btn.secondary:hover { background: rgba(255,255,255,0.07); color: white; }
.bottom-btn.danger    { background: transparent; color: rgba(239,68,68,0.7); }
.bottom-btn.danger:hover { background: rgba(239,68,68,0.1); color: #ef4444; }
</style>