<template>
  <div class="page">

    <transition name="toast-slide">
      <div v-if="toast.show" :class="['toast', toast.type]">
        <span class="toast-icon">{{ toast.type === 'success' ? '✓' : '✕' }}</span>
        {{ toast.message }}
      </div>
    </transition>

    <!-- ================= TOPBAR ================= -->
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
        <button
          :class="['btn-filter', { active: showFilters || hasDateFilter }]"
          @click="showFilters = !showFilters"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
          Date
          <span v-if="hasDateFilter" class="filter-badge">1</span>
        </button>
        <div class="search-wrap">
          <span class="search-icon">⌕</span>
          <input v-model="searchQuery" type="text" placeholder="Search…" class="search-input" />
          <button v-if="searchQuery" class="search-clear" @click="searchQuery = ''" type="button">✕</button>
        </div>
      </div>
    </div>

    <!-- ================= DATE FILTER PANEL ================= -->
    <transition name="filter-slide">
      <div v-if="showFilters" class="filter-panel">
        <div class="filter-panel-inner">
          <div class="date-group">
            <label class="date-label">From</label>
            <input type="date" v-model="dateFrom" class="date-input" :max="dateTo || undefined" />
          </div>
          <div class="date-group">
            <label class="date-label">To</label>
            <input type="date" v-model="dateTo" class="date-input" :min="dateFrom || undefined" />
          </div>
          <div class="date-shortcuts">
            <button class="btn-shortcut" @click="setToday">Today</button>
            <button class="btn-shortcut" @click="setThisWeek">This week</button>
            <button class="btn-shortcut" @click="setThisMonth">This month</button>
          </div>
          <button v-if="hasDateFilter" class="btn-clear-date" @click="clearDate">✕ Clear</button>
        </div>
      </div>
    </transition>

    <!-- ================= TABLE ================= -->
    <div class="panel" v-if="!loading">
      <div class="table-wrapper">
        <table class="table">
          <thead>
            <tr>
              <th>When</th>
              <th>Action</th>
              <th class="hide-sm">Module</th>
              <th>Done by</th>
              <th class="hide-sm">Log #</th>
              <th>Changes</th>
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
                <!-- Show module + log# inline on mobile -->
                <div class="mobile-meta">
                  {{ moduleName(entry.moduleId) }} · #{{ entry.logId }}
                </div>
              </td>
              <td class="td-module hide-sm">{{ moduleName(entry.moduleId) }}</td>
              <td class="td-user">{{ getProfileName(entry) }}</td>
              <td class="td-logid hide-sm">#{{ entry.logId }}</td>
              <td class="td-diff">
                <template v-if="entry.action === 'CREATE' && entry.after">
                  <div v-for="(val, key) in entry.after" :key="key" class="diff-row">
                    <span class="diff-key">{{ key }}</span>
                    <span class="diff-arrow">→</span>
                    <span class="diff-new">{{ val }}</span>
                  </div>
                </template>
                <template v-else-if="entry.action === 'UPDATE' && entry.diff">
                  <div v-for="(change, key) in entry.diff" :key="key" class="diff-row">
                    <span class="diff-key">{{ key }}</span>
                    <span class="diff-old">{{ change.from ?? '—' }}</span>
                    <span class="diff-arrow">→</span>
                    <span class="diff-new">{{ change.to ?? '—' }}</span>
                  </div>
                  <div v-if="!Object.keys(entry.diff).length" class="diff-none">No changes</div>
                </template>
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

      <!-- ================= PAGINATION ================= -->
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

const auditLogs   = ref([])
const modules     = ref([])
const profiles    = ref([])
const loading     = ref(true)
const searchQuery = ref('')
const actionFilter = ref('all')
const moduleFilter = ref('all')
const currentPage  = ref(1)
const pageSize     = ref(25)
const showFilters  = ref(false)
const dateFrom     = ref('')
const dateTo       = ref('')
const toast = ref({ show: false, message: '', type: 'success' })

const showToast = (message, type = 'success') => {
  toast.value = { show: true, message, type }
  setTimeout(() => { toast.value.show = false }, 2500)
}

const user = JSON.parse(localStorage.getItem('user') || '{}')

onMounted(async () => {
  try {
    const [modulesRes, profilesRes] = await Promise.all([
      api.get(`/modules/${user.id}`),
      api.get(`/profiles/${user.id}`),
    ])
    modules.value  = modulesRes.data
    profiles.value = profilesRes.data

    const moduleIds = modulesRes.data.map(m => m.id).join(',')
    const auditRes  = await api.get(`/audit?moduleIds=${moduleIds}`)
    auditLogs.value = auditRes.data
  } catch (err) {
    console.error(err)
    showToast('Failed to load audit trail', 'error')
  } finally {
    loading.value = false
  }
})

/* ─── HELPERS ─── */
const moduleName    = (id) => modules.value.find(m => m.id === id)?.name ?? `Module ${id}`
const actionLabel   = (a) => ({ CREATE: 'Created', UPDATE: 'Updated', DELETE: 'Deleted' })[a] ?? a
const formatDate    = (dt) => new Date(dt).toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' })
const formatTime    = (dt) => new Date(dt).toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' })

const getProfileName = (entry) => {
  if (entry.profileName) return entry.profileName
  if (entry.profileId) {
    const found = profiles.value.find(p => p.id === entry.profileId)
    if (found) return found.name
  }
  return '—'
}

/* ─── DATE SHORTCUTS ─── */
const todayStr = () => new Date().toISOString().slice(0, 10)

const setToday = () => {
  const t = todayStr()
  dateFrom.value = t
  dateTo.value   = t
}

const setThisWeek = () => {
  const now  = new Date()
  const day  = now.getDay()
  const mon  = new Date(now); mon.setDate(now.getDate() - ((day + 6) % 7))
  const sun  = new Date(mon); sun.setDate(mon.getDate() + 6)
  dateFrom.value = mon.toISOString().slice(0, 10)
  dateTo.value   = sun.toISOString().slice(0, 10)
}

const setThisMonth = () => {
  const now = new Date()
  const y   = now.getFullYear()
  const m   = String(now.getMonth() + 1).padStart(2, '0')
  const last = new Date(y, now.getMonth() + 1, 0).getDate()
  dateFrom.value = `${y}-${m}-01`
  dateTo.value   = `${y}-${m}-${last}`
}

const clearDate = () => {
  dateFrom.value = ''
  dateTo.value   = ''
}

const hasDateFilter = computed(() => !!(dateFrom.value || dateTo.value))

/* ─── FILTERING ─── */
const filteredLogs = computed(() => auditLogs.value.filter(e => {
  if (actionFilter.value !== 'all' && e.action !== actionFilter.value) return false
  if (moduleFilter.value !== 'all' && e.moduleId !== moduleFilter.value) return false

  if (hasDateFilter.value) {
    const entryDate = new Date(e.createdAt)
    if (dateFrom.value) {
      const from = new Date(dateFrom.value)
      if (entryDate < from) return false
    }
    if (dateTo.value) {
      const to = new Date(dateTo.value)
      to.setHours(23, 59, 59, 999)
      if (entryDate > to) return false
    }
  }

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

/* ─── PAGINATION ─── */
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
  if (cur <= 4)         return [1, 2, 3, 4, 5, '...', total]
  if (cur >= total - 3) return [1, '...', total-4, total-3, total-2, total-1, total]
  return [1, '...', cur-1, cur, cur+1, '...', total]
})
</script>

<style scoped>
.page { padding: 24px; background: #f6f8fb; min-height: 100vh; font-family: Inter, Arial, sans-serif; color: #111827; box-sizing: border-box; }

/* ===== TOAST ===== */
.toast { position: fixed; top: 20px; right: 20px; display: flex; align-items: center; gap: 8px; padding: 10px 16px; border-radius: 10px; color: white; font-size: 13px; font-weight: 500; z-index: 9999; box-shadow: 0 4px 16px rgba(0,0,0,0.15); }
.toast.success { background: #22c55e; }
.toast.error   { background: #ef4444; }
.toast-icon { font-size: 14px; }
.toast-slide-enter-active, .toast-slide-leave-active { transition: all 0.25s ease; }
.toast-slide-enter-from, .toast-slide-leave-to { opacity: 0; transform: translateY(-8px); }

/* ===== TOPBAR ===== */
.topbar { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px; flex-wrap: wrap; gap: 12px; }
.topbar h1 { font-size: 20px; font-weight: 600; margin: 0; }
.topbar p  { font-size: 13px; color: #6b7280; margin: 2px 0 0; }
.topbar-actions { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }

.filter-select { height: 36px; padding: 0 10px; border: 1px solid #e5e7eb; border-radius: 8px; font-size: 13px; color: #374151; background: white; outline: none; cursor: pointer; }
.filter-select:focus { border-color: #3b82f6; }

.btn-filter { height: 36px; padding: 0 12px; border: 1px solid #e5e7eb; border-radius: 8px; background: white; color: #374151; font-size: 13px; cursor: pointer; display: inline-flex; align-items: center; gap: 6px; transition: all 0.15s; font-family: Inter, Arial, sans-serif; }
.btn-filter:hover { background: #f9fafb; border-color: #d1d5db; }
.btn-filter.active { background: #eff6ff; border-color: #bfdbfe; color: #1d4ed8; }
.filter-badge { display: inline-flex; align-items: center; justify-content: center; min-width: 16px; height: 16px; padding: 0 4px; border-radius: 99px; background: #1d4ed8; color: white; font-size: 10px; font-weight: 700; }

.search-wrap { position: relative; display: flex; align-items: center; }
.search-icon { position: absolute; left: 9px; color: #9ca3af; font-size: 15px; pointer-events: none; }
.search-input { height: 36px; padding: 0 28px 0 28px; border: 1px solid #e5e7eb; border-radius: 8px; font-size: 13px; color: #111827; background: white; outline: none; width: 180px; }
.search-input:focus { border-color: #3b82f6; }
.search-clear { position: absolute; right: 8px; background: none; border: none; cursor: pointer; font-size: 11px; color: #9ca3af; padding: 2px; display: flex; align-items: center; transition: color 0.15s; }
.search-clear:hover { color: #ef4444; }

/* ===== DATE FILTER PANEL ===== */
.filter-panel { background: white; border: 1px solid #eef2f7; border-radius: 12px; padding: 14px 16px; margin-bottom: 14px; }
.filter-panel-inner { display: flex; align-items: flex-end; gap: 12px; flex-wrap: wrap; }
.filter-slide-enter-active, .filter-slide-leave-active { transition: all 0.2s ease; overflow: hidden; }
.filter-slide-enter-from, .filter-slide-leave-to { opacity: 0; transform: translateY(-6px); }

.date-group { display: flex; flex-direction: column; gap: 4px; }
.date-label { font-size: 11px; font-weight: 500; color: #6b7280; text-transform: uppercase; letter-spacing: 0.04em; }
.date-input { height: 36px; padding: 0 10px; border: 1px solid #e5e7eb; border-radius: 8px; font-size: 13px; color: #111827; background: white; outline: none; transition: border-color 0.15s; }
.date-input:focus { border-color: #3b82f6; box-shadow: 0 0 0 3px rgba(59,130,246,0.1); }

.date-shortcuts { display: flex; gap: 6px; align-items: flex-end; flex-wrap: wrap; }
.btn-shortcut { height: 36px; padding: 0 12px; background: #f3f4f6; border: 1px solid #e5e7eb; color: #374151; border-radius: 8px; font-size: 12px; font-weight: 500; cursor: pointer; transition: all 0.15s; font-family: Inter, Arial, sans-serif; }
.btn-shortcut:hover { background: #e5e7eb; }

.btn-clear-date { height: 36px; padding: 0 12px; background: transparent; border: 1px solid #fca5a5; color: #ef4444; border-radius: 8px; font-size: 12px; cursor: pointer; transition: all 0.15s; font-family: Inter, Arial, sans-serif; align-self: flex-end; }
.btn-clear-date:hover { background: #fee2e2; }

/* ===== PANEL / TABLE ===== */
.panel { background: white; border: 1px solid #eef2f7; border-radius: 14px; overflow: hidden; }
.table-wrapper { overflow-x: auto; -webkit-overflow-scrolling: touch; }
.table { width: 100%; border-collapse: collapse; min-width: 600px; }
.table thead { background: #111827; }
.table th { padding: 12px 14px; text-align: left; font-size: 12px; font-weight: 600; color: white; letter-spacing: 0.04em; white-space: nowrap; }
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

/* Mobile meta — shown only on small screens */
.mobile-meta { display: none; font-size: 11px; color: #9ca3af; margin-top: 4px; }

.td-module { font-size: 12px; color: #6b7280; white-space: nowrap; }
.td-user   { font-size: 12px; font-weight: 500; color: #374151; white-space: nowrap; }
.td-logid  { font-size: 12px; color: #9ca3af; white-space: nowrap; }

.td-diff { font-size: 12px; max-width: 320px; }
.diff-row { display: flex; align-items: center; gap: 5px; flex-wrap: wrap; margin-bottom: 4px; }
.diff-row:last-child { margin-bottom: 0; }
.diff-key     { font-weight: 600; color: #374151; min-width: 70px; }
.diff-old     { color: #dc2626; text-decoration: line-through; background: #fee2e2; padding: 1px 5px; border-radius: 4px; max-width: 120px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.diff-new     { color: #15803d; background: #dcfce7; padding: 1px 5px; border-radius: 4px; max-width: 120px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.diff-deleted { color: #9ca3af; font-style: italic; }
.diff-arrow   { color: #9ca3af; font-size: 11px; flex-shrink: 0; }
.diff-none    { color: #9ca3af; font-style: italic; }

.empty-row { text-align: center; padding: 40px 0; }
.empty-state { color: #9ca3af; }
.empty-icon { font-size: 28px; opacity: 0.3; margin-bottom: 8px; }
.empty-state p { font-size: 13px; margin: 0; }

.placeholder-panel { display: flex; align-items: center; justify-content: center; min-height: 200px; border: 1px dashed #e5e7eb !important; background: #fafafa !important; }
.placeholder-content { text-align: center; color: #9ca3af; }
.placeholder-icon { font-size: 28px; opacity: 0.3; margin-bottom: 8px; }
.placeholder-content p { font-size: 13px; margin: 0; }

/* ===== PAGINATION ===== */
.pagination-bar { display: flex; justify-content: space-between; align-items: center; padding: 12px 16px; border-top: 1px solid #f1f5f9; background: #fafafa; flex-wrap: wrap; gap: 8px; }
.pagination-info { font-size: 12px; color: #6b7280; }
.pagination-controls { display: flex; align-items: center; gap: 4px; flex-wrap: wrap; }
.page-size-select { height: 32px; padding: 0 8px; border: 1px solid #e5e7eb; border-radius: 7px; font-size: 12px; color: #374151; background: white; outline: none; cursor: pointer; margin-right: 6px; }
.page-btn { min-width: 32px; height: 32px; padding: 0 6px; border: 1px solid #e5e7eb; border-radius: 7px; background: white; color: #374151; font-size: 13px; cursor: pointer; display: inline-flex; align-items: center; justify-content: center; transition: all 0.15s; }
.page-btn:hover:not(:disabled) { background: #f3f4f6; }
.page-btn.active { background: #111827; color: white; border-color: #111827; font-weight: 600; }
.page-btn:disabled { opacity: 0.35; cursor: not-allowed; }
.page-ellipsis { font-size: 13px; color: #9ca3af; padding: 0 4px; line-height: 32px; }

/* ===== RESPONSIVE ===== */
@media (max-width: 768px) {
  .page { padding: 56px 12px 12px; }

  .topbar { flex-direction: column; align-items: flex-start; gap: 8px; }
  .topbar h1 { font-size: 17px; }
  .topbar-actions { width: 100%; gap: 6px; }

  .filter-select,
  .btn-filter { flex: 1 1 auto; height: 38px; font-size: 12px; }

  .search-wrap { width: 100%; }
  .search-input { width: 100%; }

  .filter-panel-inner { flex-direction: column; align-items: stretch; }
  .date-group { flex-direction: row; align-items: center; gap: 8px; }
  .date-label { min-width: 30px; }
  .date-input { flex: 1; }
  .date-shortcuts { width: 100%; }
  .btn-shortcut { flex: 1; }
  .btn-clear-date { width: 100%; justify-content: center; }

  /* Hide less-important columns on mobile */
  .hide-sm { display: none; }

  /* Show inline mobile meta */
  .mobile-meta { display: block; }

  .td-diff { max-width: 160px; }
  .diff-old, .diff-new { max-width: 80px; }

  .pagination-bar { flex-direction: column; align-items: flex-start; gap: 10px; padding: 10px 12px; }
  .pagination-controls { width: 100%; flex-wrap: wrap; }
  .page-size-select { width: 100%; margin-right: 0; margin-bottom: 4px; }
  .page-btn { min-width: 30px; height: 30px; font-size: 12px; }
}

@media (max-width: 480px) {
  .table { min-width: 360px; }
  .table th, .table td { padding: 9px 10px; font-size: 12px; }
}
</style>