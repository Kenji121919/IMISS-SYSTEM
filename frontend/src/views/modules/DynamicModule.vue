<template>
  <div class="page">

    <!-- ================= TOAST ================= -->
    <transition name="toast-slide">
      <div v-if="toast.show" :class="['toast', toast.type]">
        <span class="toast-icon">{{ toast.type === 'success' ? '✓' : '✕' }}</span>
        {{ toast.message }}
      </div>
    </transition>

    <!-- ================= TOPBAR ================= -->
    <div class="topbar">
      <div>
        <h1>{{ module?.name || 'Module' }}</h1>
        <p>{{ filteredLogs.length }} of {{ logs.length }} records</p>
      </div>
      <button class="btn-primary" @click="openAdd">
        <span class="btn-icon-left">+</span> Add log
      </button>
    </div>

    <!-- ================= FILTER BAR ================= -->
    <div class="filter-bar-panel" v-if="columns.length">
      <div class="filter-bar">

        <!-- GLOBAL SEARCH -->
        <div class="search-wrap">
          <span class="search-icon">⌕</span>
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Search logs…"
            class="search-input"
          />
        </div>

        <!-- COLUMN FILTERS -->
        <template v-for="col in columns.filter(c => c.filterable)" :key="col.name">
          <select
            v-if="col.type === 'select'"
            v-model="activeFilters[col.name]"
            class="filter-select"
          >
            <option value="" disabled selected>{{ col.name }}</option>
            <option value="all">All</option>
            <option v-for="opt in col.options" :key="opt" :value="opt">{{ opt }}</option>
          </select>

          <input
            v-else
            v-model="activeFilters[col.name]"
            :placeholder="`Filter ${col.name}`"
            class="filter-input"
          />
        </template>

        <!-- CLEAR FILTERS -->
        <button
          v-if="hasActiveFilters"
          class="btn-clear"
          @click="clearFilters"
        >✕ Clear</button>

      </div>
    </div>

    <!-- ================= TABLE ================= -->
    <div class="panel" v-if="columns.length">
      <div class="table-wrapper">

        <table class="table">
          <thead>
            <tr>
              <th v-for="col in columns" :key="col.name">
                <div class="th-inner">
                  {{ col.name }}
                  <span v-if="col.required" class="req-dot" title="Required">*</span>
                </div>
              </th>
              <th class="th-actions">Actions</th>
            </tr>
          </thead>

          <tbody>
            <tr v-if="filteredLogs.length === 0">
              <td :colspan="columns.length + 1" class="empty-row">
                <div class="empty-state">
                  <div class="empty-icon">☰</div>
                  <p>No logs found{{ hasActiveFilters || searchQuery ? ' — try adjusting your filters' : '' }}</p>
                </div>
              </td>
            </tr>

            <tr v-for="log in filteredLogs" :key="log.id">
              <td v-for="col in columns" :key="col.name">
                <span v-if="getValue(log, col.name) !== '-'" class="cell-value">
                  {{ getValue(log, col.name) }}
                </span>
                <span v-else class="cell-empty">—</span>
              </td>

              <td class="td-actions">
                <button class="btn-icon-action edit" @click="openEdit(log)" title="Edit">✏</button>
                <button class="btn-icon-action danger" @click="askDelete(log)" title="Delete">🗑</button>
              </td>
            </tr>
          </tbody>
        </table>

      </div>
    </div>

    <div class="panel placeholder-panel" v-else>
      <div class="placeholder-content">
        <div class="placeholder-icon">☰</div>
        <p>Loading module…</p>
      </div>
    </div>

    <!-- ================= ADD / EDIT MODAL ================= -->
    <div v-if="showModal" class="modal-backdrop" @click.self="closeModal">
      <div class="modal">

        <div class="modal-header">
          <div>
            <h3>{{ isEdit ? 'Edit log' : 'Add log' }}</h3>
            <p>{{ isEdit ? 'Update the fields below' : 'Fill in the fields to add a new log' }}</p>
          </div>
          <button class="btn-ghost-sm" @click="closeModal">✕</button>
        </div>

        <div class="modal-body">
          <div
            v-for="col in columns"
            :key="col.name"
            class="form-group"
          >
            <label class="form-label">
              {{ col.name }}
              <span v-if="col.required" class="required-star">*</span>
            </label>

            <select
              v-if="col.type === 'select'"
              v-model="form[col.name]"
              :class="['form-input', { 'input-error': fieldErrors[col.name] }]"
            >
              <option value="">Select option</option>
              <option v-for="opt in col.options" :key="opt" :value="opt">{{ opt }}</option>
            </select>

            <input
              v-else
              v-model="form[col.name]"
              :type="inputType(col.type)"
              :class="['form-input', { 'input-error': fieldErrors[col.name] }]"
              :placeholder="col.type === 'date' ? '' : `Enter ${col.name.toLowerCase()}`"
            />

            <span v-if="fieldErrors[col.name]" class="error-msg">
              {{ col.name }} is required
            </span>
          </div>
        </div>

        <div class="modal-footer">
          <button class="btn-ghost" @click="closeModal">Cancel</button>
          <button class="btn-primary" @click="saveLog" :disabled="saving">
            <span v-if="saving">Saving…</span>
            <span v-else>{{ isEdit ? 'Save changes' : 'Add log' }}</span>
          </button>
        </div>

      </div>
    </div>

    <!-- ================= DELETE MODAL ================= -->
    <div v-if="showDelete" class="modal-backdrop" @click.self="showDelete = false">
      <div class="modal">

        <div class="modal-header danger-header">
          <h3>Delete log</h3>
          <p>This action cannot be undone</p>
        </div>

        <div class="modal-body">
          <p class="delete-msg">Are you sure you want to delete this log entry?</p>
        </div>

        <div class="modal-footer">
          <button class="btn-ghost" @click="showDelete = false">Cancel</button>
          <button class="btn-danger" @click="deleteLog">Delete</button>
        </div>

      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, onMounted, watch, computed } from 'vue'
import { useRoute } from 'vue-router'
import api from '@/api/axios'

const route = useRoute()

const module = ref(null)
const columns = ref([])
const logs = ref([])
const showModal = ref(false)
const showDelete = ref(false)
const isEdit = ref(false)
const selectedId = ref(null)
const form = ref({})
const fieldErrors = ref({})
const searchQuery = ref('')
const activeFilters = ref({})
const saving = ref(false)

/* ================= TOAST ================= */
const toast = ref({ show: false, message: '', type: 'success' })
const showToast = (message, type = 'success') => {
  toast.value = { show: true, message, type }
  setTimeout(() => { toast.value.show = false }, 2500)
}

/* ================= SAFE PARSE ================= */
const safeParse = (val) => {
  if (!val) return []
  if (typeof val === 'object') return val
  try { return JSON.parse(val) } catch { return [] }
}

/* ================= LOAD MODULE ================= */
const loadModule = async () => {
  const res = await api.get(`/modules/single/${route.params.id}`)
  module.value = res.data

  const parsedColumns = safeParse(res.data.columns)
  columns.value = parsedColumns.map(col => ({
    ...col,
    options: typeof col.options === 'string' ? safeParse(col.options) : col.options || []
  }))

  activeFilters.value = {}
  columns.value.forEach(col => {
    if (col.filterable) activeFilters.value[col.name] = ''
  })
}

/* ================= NORMALIZE LOG VALUES ================= */
const normalizeLog = (log) => {
  const data = {}
  if (log.values && Array.isArray(log.values)) {
    log.values.forEach(v => {
      const colName = v.column?.name || v.column
      data[colName] = v.value
    })
  }
  if (log.data && typeof log.data === 'object') Object.assign(data, log.data)
  return { ...log, data }
}

/* ================= LOAD LOGS ================= */
const loadLogs = async () => {
  const res = await api.get(`/logs/module/${route.params.id}`)
  logs.value = res.data.map(normalizeLog)
}

const loadAll = async () => {
  await loadModule()
  await loadLogs()
}

/* ================= GET VALUE ================= */
const getValue = (log, columnName) => log.data?.[columnName] ?? '-'

/* ================= FILTERS ================= */
const hasActiveFilters = computed(() =>
  searchQuery.value || Object.values(activeFilters.value).some(v => v && v !== 'all')
)

const clearFilters = () => {
  searchQuery.value = ''
  columns.value.forEach(col => {
    if (col.filterable) activeFilters.value[col.name] = ''
  })
}

const filteredLogs = computed(() => {
  return logs.value.filter(log => {
    const matchesSearch = !searchQuery.value || Object.values(log.data || {})
      .join(' ').toLowerCase().includes(searchQuery.value.toLowerCase())

    const matchesFilters = Object.entries(activeFilters.value).every(([key, value]) => {
      if (!value || value === 'all') return true
      return String(getValue(log, key)).toLowerCase().includes(String(value).toLowerCase())
    })

    return matchesSearch && matchesFilters
  })
})

/* ================= INPUT TYPE ================= */
const inputType = (type) => {
  if (type === 'date') return 'date'
  if (type === 'time') return 'time'
  if (type === 'int') return 'number'
  return 'text'
}

/* ================= VALIDATION ================= */
const validate = () => {
  fieldErrors.value = {}
  let valid = true
  columns.value.forEach(col => {
    if (col.required && !form.value[col.name]) {
      fieldErrors.value[col.name] = true
      valid = false
    }
  })
  return valid
}

/* ================= ADD ================= */
const openAdd = () => {
  isEdit.value = false
  selectedId.value = null
  fieldErrors.value = {}
  form.value = {}
  columns.value.forEach(c => { form.value[c.name] = '' })
  showModal.value = true
}

/* ================= EDIT ================= */
const openEdit = (log) => {
  isEdit.value = true
  selectedId.value = log.id
  fieldErrors.value = {}
  form.value = { ...log.data }
  showModal.value = true
}

/* ================= SAVE ================= */
const saveLog = async () => {
  if (!validate()) {
    showToast('Please fill in all required fields', 'error')
    return
  }

  saving.value = true
  try {
    if (isEdit.value) {
      await api.put(`/logs/${selectedId.value}`, { data: form.value })
      showToast('Log updated', 'success')
    } else {
      await api.post('/logs', { moduleId: route.params.id, data: form.value })
      showToast('Log added', 'success')
    }
    showModal.value = false
    await loadLogs()
  } catch (err) {
    console.error(err)
    showToast('Failed to save log', 'error')
  } finally {
    saving.value = false
  }
}

/* ================= DELETE ================= */
const askDelete = (log) => {
  selectedId.value = log.id
  showDelete.value = true
}

const deleteLog = async () => {
  try {
    await api.delete(`/logs/${selectedId.value}`)
    showDelete.value = false
    await loadLogs()
    showToast('Log deleted', 'success')
  } catch (err) {
    console.error(err)
    showToast('Failed to delete log', 'error')
  }
}

const closeModal = () => {
  showModal.value = false
  fieldErrors.value = {}
}

/* ================= INIT ================= */
onMounted(loadAll)

watch(() => route.params.id, async (newId, oldId) => {
  if (newId && newId !== oldId) await loadAll()
})
</script>

<style scoped>
/* ===== PAGE ===== */
.page {
  padding: 24px;
  background: #f6f8fb;
  min-height: 100vh;
  font-family: Inter, Arial, sans-serif;
  color: #111827;
  box-sizing: border-box;
}

/* ===== TOAST ===== */
.toast {
  position: fixed;
  top: 20px;
  right: 20px;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  border-radius: 10px;
  color: white;
  font-size: 13px;
  font-weight: 500;
  z-index: 9999;
  box-shadow: 0 4px 16px rgba(0,0,0,0.15);
}
.toast.success { background: #22c55e; }
.toast.error   { background: #ef4444; }
.toast-icon { font-size: 14px; }
.toast-slide-enter-active, .toast-slide-leave-active { transition: all 0.25s ease; }
.toast-slide-enter-from, .toast-slide-leave-to { opacity: 0; transform: translateY(-8px); }

/* ===== TOPBAR ===== */
.topbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}
.topbar h1 { font-size: 20px; font-weight: 600; margin: 0; }
.topbar p  { font-size: 13px; color: #6b7280; margin: 2px 0 0; }

/* ===== BUTTONS ===== */
.btn-primary {
  background: #111827;
  color: white;
  border: none;
  padding: 9px 16px;
  border-radius: 10px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  width: fit-content;
  max-width: fit-content !important;
  transition: background 0.15s;
}
.btn-primary:hover    { background: #1f2937; }
.btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }

.btn-ghost {
  background: transparent;
  border: 1px solid #e5e7eb;
  color: #6b7280;
  padding: 8px 14px;
  border-radius: 10px;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.15s;
}
.btn-ghost:hover { background: #f3f4f6; }

.btn-ghost-sm {
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

.btn-danger {
  background: #ef4444;
  color: white;
  border: none;
  padding: 9px 16px;
  border-radius: 10px;
  font-size: 13px;
  cursor: pointer;
  transition: background 0.15s;
}
.btn-danger:hover { background: #dc2626; }

.btn-clear {
  background: transparent;
  border: 1px solid #fca5a5;
  color: #ef4444;
  padding: 6px 12px;
  border-radius: 8px;
  font-size: 12px;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.15s;
}
.btn-clear:hover { background: #fee2e2; }

.btn-icon-left { font-size: 16px; line-height: 1; }

/* ===== FILTER BAR PANEL ===== */
.filter-bar-panel {
  background: white;
  border: 1px solid #eef2f7;
  border-radius: 14px;
  padding: 12px 16px;
  margin-bottom: 16px;
}

.filter-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

/* Search */
.search-wrap {
  position: relative;
  display: flex;
  align-items: center;
}
.search-icon {
  position: absolute;
  left: 10px;
  color: #9ca3af;
  font-size: 16px;
  pointer-events: none;
}
.search-input {
  height: 36px;
  padding: 0 12px 0 30px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  font-size: 13px;
  color: #111827;
  background: white;
  outline: none;
  min-width: 180px;
  transition: border-color 0.15s;
}
.search-input:focus { border-color: #3b82f6; }

/* Filter controls */
.filter-select,
.filter-input {
  height: 36px;
  padding: 0 10px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  font-size: 13px;
  color: #111827;
  background: white;
  outline: none;
  min-width: 130px;
  transition: border-color 0.15s;
}
.filter-select:focus,
.filter-input:focus { border-color: #3b82f6; }

/* ===== PANEL ===== */
.panel {
  background: white;
  border: 1px solid #eef2f7;
  border-radius: 14px;
  overflow: hidden;
}

/* ===== TABLE ===== */
.table-wrapper { overflow-x: auto; }

.table {
  width: 100%;
  border-collapse: collapse;
  min-width: 500px;
}

.table thead { background: #111827; }

.table th {
  padding: 13px 16px;
  text-align: left;
  font-size: 12px;
  font-weight: 600;
  color: white;
  letter-spacing: 0.04em;
}
.th-inner { display: flex; align-items: center; gap: 4px; }
.th-actions { text-align: right; }

.req-dot {
  color: #f87171;
  font-size: 14px;
  line-height: 1;
}

.table td {
  padding: 12px 16px;
  border-bottom: 1px solid #f1f5f9;
  font-size: 13px;
  color: #374151;
}
.table tbody tr:last-child td { border-bottom: none; }
.table tbody tr:hover { background: #f8fafc; }

.td-actions {
  display: flex;
  justify-content: flex-end;
  gap: 4px;
  padding-right: 12px;
}

.cell-value { color: #111827; }
.cell-empty { color: #d1d5db; }

/* ===== ICON ACTION BUTTONS ===== */
.btn-icon-action {
  width: 30px;
  height: 30px;
  border-radius: 7px;
  border: none;
  cursor: pointer;
  font-size: 13px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s;
  background: transparent;
}
.btn-icon-action.edit   { color: #0284c7; }
.btn-icon-action.edit:hover   { background: #e0f2fe; }
.btn-icon-action.danger { color: #dc2626; }
.btn-icon-action.danger:hover { background: #fee2e2; }

/* ===== EMPTY STATE ===== */
.empty-row td { text-align: center; padding: 40px 0; }
.empty-state { color: #9ca3af; }
.empty-icon { font-size: 28px; opacity: 0.3; margin-bottom: 8px; }
.empty-state p { font-size: 13px; margin: 0; }

/* ===== PLACEHOLDER ===== */
.placeholder-panel {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 200px;
  border: 1px dashed #e5e7eb !important;
  background: #fafafa !important;
}
.placeholder-content { text-align: center; color: #9ca3af; }
.placeholder-icon { font-size: 28px; opacity: 0.3; margin-bottom: 8px; }
.placeholder-content p { font-size: 13px; margin: 0; }

/* ===== MODAL ===== */
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.4);
  display: flex;
  justify-content: center;
  align-items: flex-start;
  overflow-y: auto;
  padding: 40px 16px;
  z-index: 9999;
}

.modal {
  background: white;
  border-radius: 16px;
  width: 480px;
  max-width: 100%;
  overflow: hidden;
  box-shadow: 0 20px 60px rgba(0,0,0,0.2);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 18px 20px;
  border-bottom: 1px solid #eef2f7;
}
.modal-header h3 { margin: 0; font-size: 15px; font-weight: 600; color: #111827; }
.modal-header p  { margin: 4px 0 0; font-size: 12px; color: #9ca3af; }

.danger-header h3 { color: #dc2626; }

.modal-body {
  padding: 18px 20px;
  display: flex;
  flex-direction: column;
  gap: 14px;
  max-height: 55vh;
  overflow-y: auto;
}

.delete-msg { font-size: 13px; color: #374151; margin: 0; }

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding: 14px 20px;
  border-top: 1px solid #eef2f7;
  background: #fafafa;
}

/* ===== FORM ===== */
.form-group { display: flex; flex-direction: column; gap: 5px; }
.form-label {
  font-size: 12px;
  color: #6b7280;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 2px;
}
.required-star { color: #ef4444; font-size: 13px; }

.form-input {
  width: 100%;
  padding: 9px 12px;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  font-size: 13px;
  color: #111827;
  background: white;
  outline: none;
  box-sizing: border-box;
  transition: border-color 0.15s;
}
.form-input:focus { border-color: #3b82f6; box-shadow: 0 0 0 3px rgba(59,130,246,0.1); }
.form-input.input-error { border-color: #ef4444; background: #fff5f5; }
.form-input.input-error:focus { box-shadow: 0 0 0 3px rgba(239,68,68,0.1); }

.error-msg {
  font-size: 11px;
  color: #ef4444;
  font-weight: 500;
}

/* ===== RESPONSIVE ===== */
@media (max-width: 768px) {
  .page { padding: 16px; }
  .topbar { flex-direction: column; align-items: flex-start; gap: 10px; }
  .filter-bar { flex-direction: column; align-items: stretch; }
  .search-input, .filter-select, .filter-input { width: 100%; min-width: unset; }
}
</style>