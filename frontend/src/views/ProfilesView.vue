<template>
  <div class="page">

    <!-- ===== TOPBAR ===== -->
    <div class="topbar">
      <div class="logo-wrap">
        <div class="logo-mark">
          {{ orgInitials }}
        </div>
        <span class="logo-text">{{ organizationName || 'IMISS' }}</span>
      </div>
      <button class="btn-logout" @click="logout">
        <LogOut :size="14" />
        Logout
      </button>
    </div>

    <!-- ===== HERO ===== -->
    <div class="hero">
      <h1>Who's using the system?</h1>
      <p>Select a profile to continue</p>
    </div>

    <!-- ===== PROFILE GRID ===== -->
    <div class="profile-grid">
      <div
        v-for="p in profiles"
        :key="p.id"
        class="profile-card"
        @click="openModal(p)"
      >
        <div class="avatar" :style="{ background: avatarColor(p.name) }">
          {{ p.name.charAt(0).toUpperCase() }}
        </div>
        <div class="profile-name">{{ p.name }}</div>
        <div class="profile-hint">
          <span v-if="p.name.toLowerCase() === 'admin'" class="admin-badge">Admin</span>
          <span v-else class="pin-hint">PIN required</span>
        </div>
      </div>
    </div>

    <!-- ===== PIN MODAL ===== -->
    <transition name="modal-fade">
      <div v-if="showModal" class="modal-backdrop" @click.self="closeModal">
        <div class="modal" :class="{ shake: shakeError }">

          <div class="modal-header">
            <div class="modal-avatar" :style="{ background: avatarColor(selectedProfile?.name || '') }">
              {{ selectedProfile?.name?.charAt(0).toUpperCase() }}
            </div>
            <div>
              <h3>{{ selectedProfile?.name }}</h3>
              <p>Enter your PIN to continue</p>
            </div>
            <button class="btn-ghost-sm" @click="closeModal">✕</button>
          </div>

          <transition name="error-slide">
            <div v-if="errorMessage" class="error-box">
              <span>✕</span> {{ errorMessage }}
            </div>
          </transition>

          <div class="pin-dots">
            <span v-for="i in 4" :key="i" :class="['dot', { filled: pin.length >= i }]"></span>
          </div>

          <input
            v-model="pin"
            type="password"
            maxlength="4"
            inputmode="numeric"
            placeholder="Enter PIN"
            class="pin-input"
            ref="pinInput"
            @input="pin = pin.replace(/[^0-9]/g, '').slice(0, 4)"
            @keyup.enter="verifyPin"
          />

          <div class="modal-footer">
            <button class="btn-ghost" @click="closeModal">Cancel</button>
            <button class="btn-primary" @click="verifyPin" :disabled="pin.length !== 4">
              Continue →
            </button>
          </div>

        </div>
      </div>
    </transition>

  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick } from 'vue'
import { LogOut } from 'lucide-vue-next'
import api from '@/api/axios'
import { useRouter } from 'vue-router'

const router = useRouter()

const profiles = ref([])
const selectedProfile = ref(null)
const pin = ref('')
const showModal = ref(false)
const errorMessage = ref('')
const shakeError = ref(false)
const pinInput = ref(null)

/* ===== ORGANIZATION ===== */
const organizationName = ref('')

const orgInitials = computed(() => {
  const name = organizationName.value || 'IMISS'
  return name
    .split(' ')
    .map(w => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
})

/* ===== AVATAR COLOR ===== */
const COLORS = [
  '#6366f1','#0ea5e9','#10b981','#f59e0b',
  '#ec4899','#8b5cf6','#14b8a6','#f97316'
]
const avatarColor = (name) => name ? COLORS[name.charCodeAt(0) % COLORS.length] : '#6366f1'

/* ===== LOAD ===== */
onMounted(async () => {
  try {
    const token = localStorage.getItem('token')
    const user  = localStorage.getItem('user')
    if (!token || !user) { profiles.value = []; return }

    const parsedUser = JSON.parse(user)
    organizationName.value = parsedUser.organizationName || ''

    const res = await api.get(`/profiles/${parsedUser.id}`)
    profiles.value = res.data
  } catch (err) {
    console.error('Failed to load profiles:', err)
    profiles.value = []
  }
})

/* ===== MODAL ===== */
const openModal = async (profile) => {
  selectedProfile.value = profile
  pin.value = ''
  errorMessage.value = ''
  showModal.value = true
  await nextTick()
  pinInput.value?.focus()
}

const closeModal = () => {
  showModal.value = false
  selectedProfile.value = null
  pin.value = ''
  errorMessage.value = ''
}

/* ===== VERIFY ===== */
const verifyPin = async () => {
  if (!selectedProfile.value || pin.value.length !== 4) return

  if (pin.value === selectedProfile.value.pin) {
    try {
      const res = await api.get(`/profiles/single/${selectedProfile.value.id}`)
      const profile = res.data

      const isAdmin = profile.team?.toLowerCase() === 'admin' || profile.name?.toLowerCase() === 'admin'

      localStorage.setItem('activeProfile', JSON.stringify({
        id: profile.id,
        userId: profile.userId,
        name: profile.name,
        team: profile.team
      }))

      if (isAdmin) {
        showModal.value = false
        window.location.href = '/dashboard'
      } else {
        const user = JSON.parse(localStorage.getItem('user') || '{}')
        const modulesRes = await api.get(`/modules/${user.id}`)
        const allModules = modulesRes.data || []

        const assignedModules = allModules.filter(m => {
          const allowed = m.allowedProfiles || []
          return allowed.map(String).includes(String(profile.id))
        })

        if (assignedModules.length > 0) {
          showModal.value = false
          window.location.href = `/dashboard/module/${assignedModules[0].id}`
        } else {
          errorMessage.value = 'No modules assigned to this profile. Contact your admin.'
          pin.value = ''
          shakeError.value = true
          setTimeout(() => (shakeError.value = false), 400)
        }
      }
    } catch (err) {
      console.error('Profile fetch failed:', err)
      errorMessage.value = 'Something went wrong. Please try again.'
      pin.value = ''
    }
  } else {
    errorMessage.value = 'Incorrect PIN. Please try again.'
    shakeError.value = true
    setTimeout(() => (shakeError.value = false), 400)
    pin.value = ''
  }
}

/* ===== LOGOUT ===== */
const logout = () => {
  localStorage.removeItem('token')
  localStorage.removeItem('user')
  localStorage.removeItem('activeProfile')
  sessionStorage.setItem('loggedOut', 'true')
  router.replace('/')
}
</script>

<style scoped>
.page {
  min-height: 100vh;
  background: #111827;
  display: flex;
  flex-direction: column;
  align-items: center;
  font-family: Inter, Arial, sans-serif;
  padding-bottom: 60px;
}

.topbar {
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 28px;
  box-sizing: border-box;
  border-bottom: 1px solid rgba(255,255,255,0.06);
}

.logo-wrap {
  display: flex;
  align-items: center;
  gap: 9px;
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
}

.logo-text {
  font-size: 15px;
  font-weight: 700;
  color: white;
  letter-spacing: 0.5px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 220px;
}

.btn-logout {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: transparent;
  border: 1px solid rgba(239,68,68,0.3);
  color: rgba(239,68,68,0.8);
  padding: 7px 13px;
  border-radius: 9px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s;
  font-family: Inter, Arial, sans-serif;
  flex-shrink: 0;
}
.btn-logout:hover {
  background: rgba(239,68,68,0.1);
  border-color: #ef4444;
  color: #ef4444;
}

.hero {
  text-align: center;
  margin: 56px 0 40px;
  color: white;
}
.hero h1 {
  font-size: 26px;
  font-weight: 700;
  margin: 0 0 8px;
  color: white;
}
.hero p {
  font-size: 14px;
  color: rgba(255,255,255,0.4);
  margin: 0;
}

.profile-grid {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 16px;
  width: 100%;
  max-width: 700px;
  padding: 0 20px;
  box-sizing: border-box;
}

.profile-card {
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 16px;
  padding: 28px 20px 22px;
  width: 150px;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
}
.profile-card:hover {
  background: rgba(255,255,255,0.08);
  border-color: rgba(255,255,255,0.18);
  transform: translateY(-4px);
  box-shadow: 0 12px 32px rgba(0,0,0,0.3);
}

.avatar {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
  font-weight: 700;
  color: white;
}

.profile-name { font-size: 14px; font-weight: 600; color: white; }
.profile-hint  { font-size: 11px; }

.admin-badge {
  background: rgba(251,191,36,0.15);
  color: #fbbf24;
  border: 1px solid rgba(251,191,36,0.25);
  border-radius: 99px;
  padding: 2px 8px;
  font-size: 10px;
  font-weight: 600;
}

.pin-hint { color: rgba(255,255,255,0.25); }

.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.65);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 9999;
  backdrop-filter: blur(4px);
}

.modal {
  background: white;
  border-radius: 18px;
  width: 360px;
  max-width: 92%;
  overflow: hidden;
  box-shadow: 0 24px 64px rgba(0,0,0,0.4);
}

.modal-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 20px 20px 16px;
  border-bottom: 1px solid #eef2f7;
}

.modal-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  font-weight: 700;
  color: white;
  flex-shrink: 0;
}

.modal-header h3 { margin: 0; font-size: 15px; font-weight: 600; color: #111827; }
.modal-header p  { margin: 2px 0 0; font-size: 12px; color: #9ca3af; }

.btn-ghost-sm {
  margin-left: auto;
  background: transparent;
  border: none;
  color: #9ca3af;
  font-size: 16px;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 6px;
  flex-shrink: 0;
}
.btn-ghost-sm:hover { background: #f3f4f6; color: #374151; }

.error-box {
  margin: 14px 20px 0;
  background: #fef2f2;
  border: 1px solid #fecaca;
  color: #dc2626;
  padding: 9px 12px;
  border-radius: 9px;
  font-size: 12px;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 6px;
}
.error-slide-enter-active, .error-slide-leave-active { transition: all 0.2s ease; }
.error-slide-enter-from, .error-slide-leave-to { opacity: 0; transform: translateY(-6px); }

.pin-dots {
  display: flex;
  justify-content: center;
  gap: 10px;
  margin: 20px 0 0;
}
.dot {
  width: 12px; height: 12px;
  border-radius: 50%;
  background: #e5e7eb;
  transition: background 0.2s;
}
.dot.filled { background: #3b82f6; }

.pin-input {
  display: block;
  width: calc(100% - 40px);
  margin: 12px 20px 0;
  padding: 11px 12px;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  font-size: 22px;
  font-weight: 700;
  letter-spacing: 10px;
  text-align: center;
  color: #111827;
  outline: none;
  box-sizing: border-box;
  transition: border-color 0.15s;
  font-family: Inter, Arial, sans-serif;
}
.pin-input:focus { border-color: #3b82f6; box-shadow: 0 0 0 3px rgba(59,130,246,0.1); }

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding: 16px 20px;
  border-top: 1px solid #eef2f7;
  background: #fafafa;
  margin-top: 16px;
}

.btn-ghost {
  background: transparent;
  border: 1px solid #e5e7eb;
  color: #6b7280;
  padding: 8px 14px;
  border-radius: 10px;
  font-size: 13px;
  cursor: pointer;
  font-family: Inter, Arial, sans-serif;
  transition: all 0.15s;
}
.btn-ghost:hover { background: #f3f4f6; }

.btn-primary {
  background: #111827;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 10px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  font-family: Inter, Arial, sans-serif;
  transition: background 0.15s;
}
.btn-primary:hover    { background: #1f2937; }
.btn-primary:disabled { opacity: 0.4; cursor: not-allowed; }

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  20%       { transform: translateX(-8px); }
  40%       { transform: translateX(8px); }
  60%       { transform: translateX(-6px); }
  80%       { transform: translateX(6px); }
}
.shake { animation: shake 0.35s ease; }

.modal-fade-enter-active, .modal-fade-leave-active { transition: all 0.2s ease; }
.modal-fade-enter-from, .modal-fade-leave-to { opacity: 0; transform: scale(0.96); }

@media (max-width: 480px) {
  .hero h1 { font-size: 20px; }
  .profile-card { width: 130px; padding: 22px 14px 18px; }
  .logo-text { max-width: 140px; }
}
</style>