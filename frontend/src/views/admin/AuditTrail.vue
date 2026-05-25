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
        <h1>Audit trail</h1>
        <p>{{ filteredLogs.length }} of {{ auditLogs.length }} entries</p>
      </div>
      <div class="topbar-actions">
        <select v-model="actionFilter" class="filter-select">
          <option value="all">All actions</option>
          <option value="CREATE">Created</option>
          <option value="UPDATE">Updated</option>
          <option value="DELETE">Deleted</option>
        </select>
        <select v-model="moduleFilter" class="filter-select">
          <option value="all">All modules</option>
          <option v-for="m in modules" :key="m.id" :value="m.id">{{ m.name }}</option>
        </select>
        <div class="search-wrap">
          <span class="search-icon">⌕</span>
          <input v-model="searchQuery" type="text" placeholder="Search user or field…" class="search-input" />
        </div>
      </div>
    </div>

    <div class="panel" v-if="!loading">
      <div class="table-wrapper">
        <table class="table">
          <thead>
            <tr>
              <th>When</th>
              <th>Action</th>
              <th>Module</th>
              <th>Done by</th>
              <th>Log #</th>
              <th class="th-wide">Changes</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="pagedLogs.length === 0">
              <td colspan="6" class="empty-row">
                <div class="empty-state">
                  <div class="empty-icon">☰</div>
                  <p>No audit entries found</p>
                </div>
              </td>
            </tr>
            <tr v-for="entry in pagedLogs" :key="entry.id" class="audit-row">
              <td class="td-when">
                <div class="when-date">{{ formatDate(entry.createdAt) }}</div>
                <div class="when-time">{{ formatTime(entry.createdAt) }}</div>
              </td>
              <td>
                <span :class="['action-badge', entry.action.toLowerCase()]">
                  {{ actionLabel(entry.action) }}
                </span>
              </td>
              <td class="td-module">{{ moduleName(entry.moduleId) }}</td>
              <td class="td-user">{{ getProfileName(entry) }}</td>
              <td class="td-logid">#{{ entry.logId }}</td>
              <td class="td-diff">
                <!-- CREATE: show all after fields -->
                <template v-if="entry.action === 'CREATE' && entry.after">
                  <div v-for="(val, key) in entry.after" :key="key" class="diff-row">
                    <span class="diff-key">{{ key }}</span>
                    <span class="diff-arrow">→</span>
                    <span class="diff-new">{{ val }}</span>
                  </div>
                </template>

                <!-- UPDATE: show only changed fields -->
                <template v-else-if="entry.action === 'UPDATE' && entry.diff">
                  <div v-for="(change, key) in entry.diff" :key="key" class="diff-row">
                    <span class="diff-key">{{ key }}</span>
                    <span class="diff-old">{{ change.from ?? '—' }}</span>
                    <span class="diff-arrow">→</span>
                    <span class="diff-new">{{ change.to ?? '—' }}</span>
                  </div>
                  <div v-if="!Object.keys(entry.diff).length" class="diff-none">No field changes</div>
                </template>

                <!-- DELETE: show what was deleted -->
                <template v-else-if="entry.action === 'DELETE' && entry.before">
                  <div v-for="(val, key) in entry.before" :key="key" class="diff-row">
                    <span class="diff-key">{{ key }}</span>
                    <span class="diff-old">{{ val }}</span>
                    <span class="diff-arrow">→</span>
                    <span class="diff-deleted">deleted</span>
                  </div>
                </template>

                <span v-else class="diff-none">—</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div class="pagination-bar" v-if="totalPages > 1 || filteredLogs.length > 0">
        <div class="pagination-info">
          Showing {{ paginationFrom }}–{{ paginationTo }} of {{ filteredLogs.length }}
        </div>
        <div class="pagination-controls">
          <select v-model="pageSize" class="page-size-select" @change="currentPage = 1">
            <option :value="25">25 / page</option>
            <option :value="50">50 / page</option>
            <option :value="100">100 / page</option>
          </select>
          <button class="page-btn" @click="currentPage = 1" :disabled="currentPage === 1">«</button>
          <button class="page-btn" @click="currentPage--" :disabled="currentPage === 1">‹</button>
          <template v-for="p in visiblePages" :key="p">
            <button v-if="p !== '...'" :class="['page-btn', { active: p === currentPage }]" @click="currentPage = p">{{ p }}</button>
            <span v-else class="page-ellipsis">…</span>
          </template>
          <button class="page-btn" @click="currentPage++" :disabled="currentPage === totalPages">›</button>
          <button class="page-btn" @click="currentPage = totalPages" :disabled="currentPage === totalPages">»</button>
        </div>
      </div>
    </div>

    <div class="panel placeholder-panel" v-else>
      <div class="placeholder-content">
        <div class="placeholder-icon">☰</div>
        <p>Loading audit trail…</p>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import api from '@/api/axios'

const auditLogs  = ref([])
const modules    = ref([])
const profiles   = ref([])
const loading    = ref(true)
const searchQuery   = ref('')
const actionFilter  = ref('all')
const moduleFilter  = ref('all')
const currentPage   = ref(1)
const pageSize      = ref(25)
const toast = ref({ show: false, message: '', type: 'success' })

const showToast = (message, type = 'success') => {
  toast.value = { show: true, message, type }
  setTimeout(() => { toast.value.show = false }, 2500)
}

const user = JSON.parse(localStorage.getItem('user') || '{}')

onMounted(async () => {
  try {
    const [auditRes, modulesRes, profilesRes] = await Promise.all([
      api.get('/audit'),
      api.get(`/modules/${user.id}`),
      api.get(`/profiles/${user.id}`),   // ← fetch profiles to resolve names
    ])
    auditLogs.value = auditRes.data
    modules.value   = modulesRes.data
    profiles.value  = profilesRes.data
  } catch (err) {
    console.error(err)
    showToast('Failed to load audit trail', 'error')
  } finally {
    loading.value = false
  }
})

/* ─── HELPERS ─────────────────────────────────────────── */

const moduleName = (id) =>
  modules.value.find(m => m.id === id)?.name ?? `Module ${id}`

/**
 * Resolve "Done by" with multiple fallbacks:
 * 1. entry.profileName  (if backend already joins it)
 * 2. profiles list lookup by entry.profileId
 * 3. '—' if nothing found
 */
const getProfileName = (entry) => {
  if (entry.profileName) return entry.profileName
  if (entry.profileId) {
    const found = profiles.value.find(p => p.id === entry.profileId)
    if (found) return found.name
  }
  return '—'
}

const actionLabel = (action) =>
  ({ CREATE: 'Created', UPDATE: 'Updated', DELETE: 'Deleted' })[action] ?? action

const formatDate = (dt) =>
  new Date(dt).toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' })

const formatTime = (dt) =>
  new Date(dt).toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' })

/* ─── FILTERING ───────────────────────────────────────── */

const filteredLogs = computed(() => auditLogs.value.filter(e => {
  if (actionFilter.value !== 'all' && e.action !== actionFilter.value) return false
  if (moduleFilter.value !== 'all' && e.moduleId !== moduleFilter.value) return false
  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase()
    const inUser   = getProfileName(e).toLowerCase().includes(q)
    const inDiff   = JSON.stringify(e.diff   ?? {}).toLowerCase().includes(q)
    const inAfter  = JSON.stringify(e.after  ?? {}).toLowerCase().includes(q)
    const inBefore = JSON.stringify(e.before ?? {}).toLowerCase().includes(q)
    if (!inUser && !inDiff && !inAfter && !inBefore) return false
  }
  return true
}))

/* ─── PAGINATION ──────────────────────────────────────── */

const totalPages     = computed(() => Math.max(1, Math.ceil(filteredLogs.value.length / pageSize.value)))
const paginationFrom = computed(() => filteredLogs.value.length === 0 ? 0 : (currentPage.value - 1) * pageSize.value + 1)
const paginationTo   = computed(() => Math.min(currentPage.value * pageSize.value, filteredLogs.value.length))

const pagedLogs = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return filteredLogs.value.slice(start, start + pageSize.value)
})

const visiblePages = computed(() => {
  const total = totalPages.value, cur = currentPage.value
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
  if (cur <= 4)          return [1, 2, 3, 4, 5, '...', total]
  if (cur >= total - 3)  return [1, '...', total-4, total-3, total-2, total-1, total]
  return [1, '...', cur-1, cur, cur+1, '...', total]
})
</script>

<style scoped>
.page { padding: 24px; background: #f6f8fb; min-height: 100vh; font-family: Inter, Arial, sans-serif; color: #111827; box-sizing: border-box; }

.toast { position: fixed; top: 20px; right: 20px; display: flex; align-items: center; gap: 8px; padding: 10px 16px; border-radius: 10px; color: white; font-size: 13px; font-weight: 500; z-index: 9999; box-shadow: 0 4px 16px rgba(0,0,0,0.15); }
.toast.success { background: #22c55e; }
.toast.error   { background: #ef4444; }
.toast-icon { font-size: 14px; }
.toast-slide-enter-active, .toast-slide-leave-active { transition: all 0.25s ease; }
.toast-slide-enter-from, .toast-slide-leave-to { opacity: 0; transform: translateY(-8px); }

.topbar { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px; flex-wrap: wrap; gap: 12px; }
.topbar h1 { font-size: 20px; font-weight: 600; margin: 0; }
.topbar p  { font-size: 13px; color: #6b7280; margin: 2px 0 0; }
.topbar-actions { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }

.filter-select { height: 36px; padding: 0 10px; border: 1px solid #e5e7eb; border-radius: 8px; font-size: 13px; color: #374151; background: white; outline: none; cursor: pointer; }
.filter-select:focus { border-color: #3b82f6; }

.search-wrap { position: relative; }
.search-icon { position: absolute; left: 9px; top: 50%; transform: translateY(-50%); color: #9ca3af; font-size: 15px; pointer-events: none; }
.search-input { height: 36px; padding: 0 10px 0 28px; border: 1px solid #e5e7eb; border-radius: 8px; font-size: 13px; color: #111827; background: white; outline: none; width: 200px; }
.search-input:focus { border-color: #3b82f6; }

.panel { background: white; border: 1px solid #eef2f7; border-radius: 14px; overflow: hidden; }
.table-wrapper { overflow-x: auto; }
.table { width: 100%; border-collapse: collapse; min-width: 700px; }
.table thead { background: #111827; }
.table th { padding: 12px 14px; text-align: left; font-size: 12px; font-weight: 600; color: white; letter-spacing: 0.04em; }
.th-wide { min-width: 320px; }
.table td { padding: 11px 14px; border-bottom: 1px solid #f1f5f9; font-size: 13px; color: #374151; vertical-align: top; }
.table tbody tr:last-child td { border-bottom: none; }
.audit-row:hover { background: #f8fafc; }

.td-when { white-space: nowrap; }
.when-date { font-size: 12px; font-weight: 500; color: #111827; }
.when-time { font-size: 11px; color: #9ca3af; margin-top: 2px; }

.action-badge { display: inline-block; padding: 3px 9px; border-radius: 99px; font-size: 11px; font-weight: 600; white-space: nowrap; }
.action-badge.create { background: #dcfce7; color: #15803d; }
.action-badge.update { background: #dbeafe; color: #1d4ed8; }
.action-badge.delete { background: #fee2e2; color: #dc2626; }

.td-module { font-size: 12px; color: #6b7280; white-space: nowrap; }
.td-user   { font-size: 12px; font-weight: 500; color: #374151; white-space: nowrap; }
.td-logid  { font-size: 12px; color: #9ca3af; white-space: nowrap; }

.td-diff { font-size: 12px; }
.diff-row { display: flex; align-items: center; gap: 5px; flex-wrap: wrap; margin-bottom: 4px; }
.diff-row:last-child { margin-bottom: 0; }
.diff-key     { font-weight: 600; color: #374151; min-width: 80px; }
.diff-old     { color: #dc2626; text-decoration: line-through; background: #fee2e2; padding: 1px 5px; border-radius: 4px; }
.diff-new     { color: #15803d; background: #dcfce7; padding: 1px 5px; border-radius: 4px; }
.diff-deleted { color: #9ca3af; font-style: italic; }
.diff-arrow   { color: #9ca3af; font-size: 11px; }
.diff-none    { color: #9ca3af; font-style: italic; }

.empty-row { text-align: center; padding: 40px 0; }
.empty-state { color: #9ca3af; }
.empty-icon { font-size: 28px; opacity: 0.3; margin-bottom: 8px; }
.empty-state p { font-size: 13px; margin: 0; }

.placeholder-panel { display: flex; align-items: center; justify-content: center; min-height: 200px; border: 1px dashed #e5e7eb !important; background: #fafafa !important; }
.placeholder-content { text-align: center; color: #9ca3af; }
.placeholder-icon { font-size: 28px; opacity: 0.3; margin-bottom: 8px; }
.placeholder-content p { font-size: 13px; margin: 0; }

.pagination-bar { display: flex; justify-content: space-between; align-items: center; padding: 12px 16px; border-top: 1px solid #f1f5f9; background: #fafafa; flex-wrap: wrap; gap: 8px; }
.pagination-info { font-size: 12px; color: #6b7280; }
.pagination-controls { display: flex; align-items: center; gap: 4px; flex-wrap: wrap; }
.page-size-select { height: 32px; padding: 0 8px; border: 1px solid #e5e7eb; border-radius: 7px; font-size: 12px; color: #374151; background: white; outline: none; cursor: pointer; margin-right: 6px; }
.page-btn { min-width: 32px; height: 32px; padding: 0 6px; border: 1px solid #e5e7eb; border-radius: 7px; background: white; color: #374151; font-size: 13px; cursor: pointer; display: inline-flex; align-items: center; justify-content: center; transition: all 0.15s; }
.page-btn:hover:not(:disabled) { background: #f3f4f6; }
.page-btn.active { background: #111827; color: white; border-color: #111827; font-weight: 600; }
.page-btn:disabled { opacity: 0.35; cursor: not-allowed; }
.page-ellipsis { font-size: 13px; color: #9ca3af; padding: 0 4px; line-height: 32px; }
</style>