<template>
  <div class="page">

    <transition name="toast-slide">
      <div v-if="toast.show" :class="['toast', toast.type]">
        <span class="toast-icon">{{ toast.type === 'success' ? '✓' : '✕' }}</span>
        {{ toast.message }}
      </div>
    </transition>

    <div class="topbar">
      <div>
        <h1>Manage Profiles</h1>
        <p>Create and manage user profiles with secure PINs</p>
      </div>
      <button class="btn-primary" @click="openCreate">
        + New profile
      </button>
    </div>

    <div class="two-col">

      <!-- LEFT: PROFILE LIST -->
      <div class="panel">
        <div class="panel-label">Your profiles</div>

        <div v-if="profiles.length" class="profile-list">
          <div
            v-for="p in profiles"
            :key="p.id"
            :class="['profile-item', { active: activeProfile?.id === p.id }]"
            @click="openEdit(p)"
          >
            <div class="profile-avatar" :style="{ background: avatarColor(p.name) }">
              {{ p.name.charAt(0).toUpperCase() }}
            </div>

            <div class="profile-info">
              <div class="profile-name">{{ p.name }}</div>
              <div class="profile-meta">
                <span v-if="p.name.toLowerCase() === 'admin'" class="admin-badge">Admin</span>
                <span v-else class="profile-pin-hint">
                  PIN <span class="pin-value">{{ visiblePin === p.id ? p.pin : '••••' }}</span>
                </span>
              </div>
            </div>

            <div class="item-actions" @click.stop>
              <button
                class="action-btn"
                @click="togglePin(p.id)"
                :title="visiblePin === p.id ? 'Hide PIN' : 'Show PIN'"
              >
                <svg viewBox="0 0 16 16" fill="none" width="14" height="14">
                  <template v-if="visiblePin === p.id">
                    <path d="M2 2l12 12M6.5 6.6A2 2 0 0010 10" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>
                    <path d="M4.5 4.6C2.8 5.7 1.5 7.5 1.5 8c0 .8 2.9 4.5 6.5 4.5 1.3 0 2.5-.4 3.5-1.1" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>
                    <path d="M8 3.5c3.6 0 6.5 3.7 6.5 4.5 0 .4-.5 1.2-1.3 2" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>
                  </template>
                  <template v-else>
                    <ellipse cx="8" cy="8" rx="6.5" ry="4.5" stroke="currentColor" stroke-width="1.4"/>
                    <circle cx="8" cy="8" r="2" stroke="currentColor" stroke-width="1.4"/>
                  </template>
                </svg>
              </button>
              <button class="action-btn edit" @click="openEdit(p)" title="Edit">
                <svg viewBox="0 0 16 16" fill="none" width="14" height="14">
                  <path d="M11 2l3 3-8 8H3v-3l8-8z" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/>
                </svg>
              </button>
              <button
                class="action-btn danger"
                @click="askDelete(p)"
                title="Delete"
                :disabled="p.name.toLowerCase() === 'admin'"
              >
                <svg viewBox="0 0 16 16" fill="none" width="14" height="14">
                  <path d="M2 4h12M5 4V2h6v2M6 7v5M10 7v5M3 4l1 9h8l1-9" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </button>
            </div>
          </div>
        </div>

        <div v-else class="empty-state">
          <p>No profiles yet.</p>
          <p>Click <strong>New profile</strong> to get started.</p>
        </div>
      </div>

      <!-- RIGHT: EDITOR PANEL -->
      <div class="panel editor-panel" v-if="editorMode">

        <div class="editor-header">
          <div>
            <div class="panel-label">
              {{ editorMode === 'create' ? 'New profile' : 'Edit profile' }}
            </div>
            <div v-if="editorMode === 'edit'" class="active-badge">
              {{ editProfile.name }}
            </div>
          </div>
          <button class="btn-ghost-sm" @click="closeEditor">✕</button>
        </div>

        <!-- PROFILE NAME -->
        <div class="form-group">
          <label class="form-label">Profile name</label>
          <input
            v-model="editProfile.name"
            class="form-input"
            placeholder="e.g. Manager"
            :disabled="editorMode === 'edit' && editProfile.name.toLowerCase() === 'admin'"
          />
        </div>

        <!-- PIN -->
        <div class="form-group">
          <label class="form-label">{{ editorMode === 'create' ? '4-digit PIN' : 'PIN' }}</label>
          <div class="pin-field">
            <input
              v-model="editProfile.pin"
              class="form-input pin-input"
              :type="showPin ? 'text' : 'password'"
              placeholder="••••"
              maxlength="4"
              @input="editProfile.pin = editProfile.pin.replace(/[^0-9]/g, '').slice(0,4)"
            />
            <button class="pin-toggle" @click="showPin = !showPin" type="button">
              <svg viewBox="0 0 16 16" fill="none" width="15" height="15">
                <template v-if="showPin">
                  <path d="M2 2l12 12M6.5 6.6A2 2 0 0010 10" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>
                  <path d="M4.5 4.6C2.8 5.7 1.5 7.5 1.5 8c0 .8 2.9 4.5 6.5 4.5 1.3 0 2.5-.4 3.5-1.1" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>
                  <path d="M8 3.5c3.6 0 6.5 3.7 6.5 4.5 0 .4-.5 1.2-1.3 2" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>
                </template>
                <template v-else>
                  <ellipse cx="8" cy="8" rx="6.5" ry="4.5" stroke="currentColor" stroke-width="1.4"/>
                  <circle cx="8" cy="8" r="2" stroke="currentColor" stroke-width="1.4"/>
                </template>
              </svg>
            </button>
          </div>
          <div class="pin-dots">
            <span v-for="i in 4" :key="i" :class="['dot', { filled: editProfile.pin?.length >= i }]"></span>
          </div>
        </div>

        <div class="editor-footer">
          <button class="btn-ghost" @click="closeEditor">Cancel</button>
          <button
            class="btn-primary"
            @click="editorMode === 'create' ? createProfile() : updateProfile()"
            :disabled="saving"
          >
            <span v-if="saving">Saving…</span>
            <span v-else>{{ editorMode === 'create' ? 'Create profile' : 'Save changes' }}</span>
          </button>
        </div>

      </div>

      <div class="panel placeholder-panel" v-else>
        <div class="placeholder-content">
          <div class="placeholder-icon">👤</div>
          <p>Select a profile to edit,<br>or create a new one.</p>
        </div>
      </div>

    </div>

    <!-- DELETE MODAL -->
    <div v-if="showDeleteModal" class="modal-backdrop" @click.self="cancelDelete">
      <div class="modal">
        <div class="modal-header">
          <h3>Delete profile</h3>
          <p>This action cannot be undone</p>
        </div>
        <div class="modal-body">
          <p>Are you sure you want to delete <strong>{{ deleteTarget?.name }}</strong>?</p>
        </div>
        <div class="modal-footer">
          <button class="btn-ghost" @click="cancelDelete">Cancel</button>
          <button class="btn-danger" @click="confirmDelete">Delete</button>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import api from '@/api/axios'

const profiles       = ref([])
const activeProfile  = ref(null)
const editorMode     = ref(null)
const saving         = ref(false)
const showPin        = ref(false)
const visiblePin     = ref(null)
const editProfile    = ref({ name: '', pin: '' })
const showDeleteModal = ref(false)
const deleteTarget   = ref(null)
const activeUser     = JSON.parse(localStorage.getItem('user'))

const toast = ref({ show: false, message: '', type: 'success' })
const showToast = (message, type = 'success') => {
  toast.value = { show: true, message, type }
  setTimeout(() => { toast.value.show = false }, 2500)
}

const COLORS = ['#6366f1','#0ea5e9','#10b981','#f59e0b','#ec4899','#8b5cf6','#14b8a6','#f97316']
const avatarColor = (name) => COLORS[name.charCodeAt(0) % COLORS.length]
const togglePin   = (id) => { visiblePin.value = visiblePin.value === id ? null : id }

const loadProfiles = async () => {
  try {
    const res = await api.get(`/profiles/${activeUser.id}`)
    profiles.value = res.data
  } catch (err) {
    showToast('Failed to load profiles', 'error')
  }
}

onMounted(loadProfiles)

const openCreate = () => {
  activeProfile.value  = null
  editorMode.value     = 'create'
  showPin.value        = false
  editProfile.value    = { name: '', pin: '' }
}

const openEdit = (p) => {
  activeProfile.value = p
  editorMode.value    = 'edit'
  showPin.value       = false
  editProfile.value   = { ...p, pin: p.pin ?? '' }
}

const closeEditor = () => {
  editorMode.value    = null
  activeProfile.value = null
}

const createProfile = async () => {
  if (!editProfile.value.name.trim()) return showToast('Profile name required', 'error')
  if (editProfile.value.pin.length !== 4) return showToast('PIN must be 4 digits', 'error')
  saving.value = true
  try {
    await api.post('/profiles', {
      name: editProfile.value.name,
      pin:  editProfile.value.pin,
      userId: activeUser.id
    })
    await loadProfiles()
    closeEditor()
    showToast('Profile created', 'success')
  } catch (err) {
    showToast('Failed to create profile', 'error')
  } finally {
    saving.value = false
  }
}

/* ── Now updates BOTH name and PIN ── */
const updateProfile = async () => {
  if (!editProfile.value.name.trim()) return showToast('Profile name required', 'error')
  if (editProfile.value.pin.length !== 4) return showToast('PIN must be 4 digits', 'error')
  saving.value = true
  try {
    await api.put(`/profiles/${editProfile.value.id}`, {
      name: editProfile.value.name,
      pin:  editProfile.value.pin,
    })
    await loadProfiles()
    closeEditor()
    showToast('Profile updated', 'success')
  } catch (err) {
    showToast('Failed to update profile', 'error')
  } finally {
    saving.value = false
  }
}

const askDelete = (p) => {
  if (p.name.toLowerCase() === 'admin') return
  deleteTarget.value    = p
  showDeleteModal.value = true
}

const confirmDelete = async () => {
  if (!deleteTarget.value) return
  try {
    await api.delete(`/profiles/${deleteTarget.value.id}`)
    if (activeProfile.value?.id === deleteTarget.value.id) closeEditor()
    showDeleteModal.value = false
    deleteTarget.value    = null
    await loadProfiles()
    showToast('Profile deleted', 'success')
  } catch (err) {
    showToast('Delete failed', 'error')
  }
}

const cancelDelete = () => {
  deleteTarget.value    = null
  showDeleteModal.value = false
}
</script>

<style scoped>
.page {
  padding: 24px;
  background: #f6f8fb;
  min-height: 100vh;
  font-family: Inter, Arial, sans-serif;
  color: #111827;
  box-sizing: border-box;
}

.toast { position: fixed; top: 20px; right: 20px; display: flex; align-items: center; gap: 8px; padding: 10px 16px; border-radius: 10px; color: white; font-size: 13px; font-weight: 500; z-index: 9999; box-shadow: 0 4px 16px rgba(0,0,0,0.15); }
.toast.success { background: #22c55e; }
.toast.error   { background: #ef4444; }
.toast-icon { font-size: 14px; }
.toast-slide-enter-active, .toast-slide-leave-active { transition: all 0.25s ease; }
.toast-slide-enter-from, .toast-slide-leave-to { opacity: 0; transform: translateY(-8px); }

.topbar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; flex-wrap: wrap; gap: 10px; }
.topbar h1 { font-size: 20px; font-weight: 600; margin: 0; }
.topbar p  { font-size: 13px; color: #6b7280; margin: 2px 0 0; }

.btn-primary { background: #111827; color: white; border: none; padding: 9px 16px; border-radius: 10px; font-size: 13px; font-weight: 500; cursor: pointer; display: inline-flex; align-items: center; gap: 6px; transition: background 0.15s; }
.btn-primary:hover    { background: #1f2937; }
.btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
.btn-ghost { background: transparent; border: 1px solid #e5e7eb; color: #6b7280; padding: 8px 14px; border-radius: 10px; font-size: 13px; cursor: pointer; transition: all 0.15s; }
.btn-ghost:hover { background: #f3f4f6; }
.btn-ghost-sm { background: transparent; border: none; color: #9ca3af; font-size: 16px; cursor: pointer; padding: 4px 8px; border-radius: 6px; }
.btn-ghost-sm:hover { background: #f3f4f6; color: #374151; }
.btn-danger { background: #ef4444; color: white; border: none; padding: 9px 16px; border-radius: 10px; font-size: 13px; cursor: pointer; transition: background 0.15s; }
.btn-danger:hover { background: #dc2626; }

.two-col { display: grid; grid-template-columns: 300px 1fr; gap: 16px; align-items: start; }

.panel { background: white; border: 1px solid #eef2f7; border-radius: 14px; padding: 16px; }
.panel-label { font-size: 11px; font-weight: 600; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 12px; }

.profile-list { display: flex; flex-direction: column; gap: 6px; }

.profile-item { display: flex; align-items: center; gap: 10px; padding: 10px 12px; border: 1px solid #eef2f7; border-radius: 10px; cursor: pointer; transition: all 0.15s; }
.profile-item:hover  { border-color: #d1d5db; background: #fafafa; }
.profile-item.active { border-color: #bfdbfe; background: #eff6ff; }

.profile-avatar { width: 34px; height: 34px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 13px; font-weight: 700; color: white; flex-shrink: 0; }

.profile-info { flex: 1; min-width: 0; }
.profile-name { font-size: 13px; font-weight: 500; color: #111827; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.profile-meta { font-size: 11px; color: #9ca3af; margin-top: 2px; }
.profile-item.active .profile-name { color: #1d4ed8; }
.profile-item.active .profile-meta { color: #93c5fd; }

.admin-badge { display: inline-block; background: #fef3c7; color: #92400e; border: 1px solid #fde68a; border-radius: 99px; font-size: 10px; font-weight: 600; padding: 1px 7px; }

.pin-value { font-family: monospace; letter-spacing: 2px; font-weight: 600; color: #374151; }

/* ── Mature action buttons ── */
.item-actions { display: flex; gap: 3px; margin-left: 4px; flex-shrink: 0; }

.action-btn {
  width: 28px;
  height: 28px;
  border-radius: 7px;
  border: 1px solid transparent;
  background: transparent;
  color: #9ca3af;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s;
  flex-shrink: 0;
}
.action-btn:hover { background: #f3f4f6; color: #374151; border-color: #e5e7eb; }
.action-btn.edit:hover   { background: #eff6ff; color: #1d4ed8; border-color: #bfdbfe; }
.action-btn.danger       { color: #9ca3af; }
.action-btn.danger:hover { background: #fef2f2; color: #dc2626; border-color: #fecaca; }
.action-btn:disabled     { opacity: 0.25; cursor: not-allowed; pointer-events: none; }

.editor-panel { display: flex; flex-direction: column; gap: 16px; }
.editor-header { display: flex; justify-content: space-between; align-items: flex-start; }
.active-badge { font-size: 13px; font-weight: 500; color: #1d4ed8; background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 99px; padding: 2px 10px; display: inline-block; margin-top: 4px; }

.form-group { display: flex; flex-direction: column; gap: 6px; }
.form-label { font-size: 12px; color: #6b7280; font-weight: 500; }

.form-input { width: 100%; padding: 9px 12px; border: 1px solid #e5e7eb; border-radius: 10px; font-size: 13px; color: #111827; background: white; outline: none; box-sizing: border-box; transition: border-color 0.15s; }
.form-input:focus    { border-color: #3b82f6; }
.form-input:disabled { background: #f9fafb; color: #9ca3af; cursor: not-allowed; }

.pin-field { display: flex; gap: 8px; align-items: center; }
.pin-input  { letter-spacing: 6px; font-size: 18px; font-weight: 700; flex: 1; }
.pin-toggle { background: transparent; border: 1px solid #e5e7eb; border-radius: 8px; width: 38px; height: 38px; cursor: pointer; display: flex; align-items: center; justify-content: center; flex-shrink: 0; color: #6b7280; transition: all 0.15s; }
.pin-toggle:hover { background: #f3f4f6; color: #374151; }

.pin-dots { display: flex; gap: 8px; margin-top: 4px; }
.dot { width: 10px; height: 10px; border-radius: 50%; background: #e5e7eb; transition: background 0.2s; }
.dot.filled { background: #3b82f6; }

.editor-footer { display: flex; justify-content: flex-end; align-items: center; gap: 8px; padding-top: 14px; border-top: 1px solid #eef2f7; margin-top: 4px; }

.placeholder-panel { display: flex; align-items: center; justify-content: center; min-height: 300px; border: 1px dashed #e5e7eb !important; background: #fafafa !important; }
.placeholder-content { text-align: center; color: #9ca3af; }
.placeholder-icon { font-size: 32px; margin-bottom: 12px; opacity: 0.4; }
.placeholder-content p { font-size: 13px; line-height: 1.6; margin: 0; }

.empty-state { text-align: center; padding: 24px 0; color: #9ca3af; font-size: 13px; line-height: 1.7; }

.modal-backdrop { position: fixed; inset: 0; background: rgba(0,0,0,0.4); display: flex; justify-content: center; align-items: center; z-index: 9999; }
.modal { background: white; border-radius: 16px; width: 400px; max-width: 92%; overflow: hidden; box-shadow: 0 20px 60px rgba(0,0,0,0.2); }
.modal-header { padding: 18px 20px; border-bottom: 1px solid #eef2f7; }
.modal-header h3 { margin: 0; font-size: 15px; font-weight: 600; color: #dc2626; }
.modal-header p  { margin: 4px 0 0; font-size: 12px; color: #9ca3af; }
.modal-body { padding: 18px 20px; font-size: 13px; color: #374151; line-height: 1.6; }
.modal-footer { display: flex; justify-content: flex-end; gap: 8px; padding: 14px 20px; border-top: 1px solid #eef2f7; background: #fafafa; }

/* ── Responsive ── */
@media (max-width: 768px) {
  .page       { padding: 56px 12px 12px; }
  .two-col    { grid-template-columns: 1fr; }
  .topbar     { flex-direction: column; align-items: flex-start; }
  .btn-primary { width: 100%; justify-content: center; }

  /* Modal slides up from bottom on mobile */
  .modal-backdrop { align-items: flex-end; }
  .modal { width: 100%; max-width: 100%; border-radius: 16px 16px 0 0; }
}
</style>