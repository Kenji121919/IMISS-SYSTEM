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
      <div class="topbar-actions">
        <button class="btn-outline" @click="printLogs" title="Print logs">
          <span class="btn-icon-left">🖨</span> Print
        </button>

        <!-- FILTER TOGGLE BUTTON -->
        <button
          :class="['btn-filter', { active: showFilters || activeFilterCount > 0 }]"
          @click="showFilters = !showFilters"
          title="Toggle filters"
        >
          <span class="btn-icon-left">⚙</span>
          Filters
          <span v-if="activeFilterCount > 0" class="filter-badge">{{ activeFilterCount }}</span>
        </button>

        <button class="btn-primary" @click="openAdd">
          <span class="btn-icon-left">+</span> Add log
        </button>
      </div>
    </div>

    <!-- ================= FILTER PANEL (collapsible) ================= -->
    <transition name="filter-slide">
      <div v-if="showFilters && columns.length" class="filter-bar-panel">
        <div class="filter-bar">

          <!-- GLOBAL SEARCH -->
          <div class="fl-wrap fl-search">
            <span class="search-icon">⌕</span>
            <input
              v-model="searchQuery"
              type="text"
              placeholder=" "
              class="search-input"
              id="global-search"
            />
            <label for="global-search" class="fl-label search-label">Search logs…</label>
            <button v-if="searchQuery" class="fl-clear-btn" @click="searchQuery = ''" title="Clear" type="button">✕</button>
          </div>

          <!-- COLUMN FILTERS -->
          <template v-for="col in columns.filter(c => c.filterable)" :key="col.name">

            <!-- DATE RANGE FILTER -->
            <template v-if="col.type === 'date'">
              <div class="date-picker-wrap">
                <div class="fl-label-static"></div>
                <button
                  :class="['date-trigger', { active: dateFilters[col.name]?.from || dateFilters[col.name]?.to }]"
                  @click="toggleDatePicker(col.name)"
                  type="button"
                >
                  <span class="date-trigger-label">{{ dateRangeLabel(col.name) }}</span>
                  <span v-if="dateFilters[col.name]?.from || dateFilters[col.name]?.to" class="date-trigger-clear" @click.stop="clearDateFilter(col.name)" title="Clear">✕</span>
                  <span v-else class="date-trigger-caret">▾</span>
                </button>

                <div v-if="openDatePicker === col.name" class="date-dropdown">
                  <div class="date-dropdown-row">
                    <div class="date-dropdown-field">
                      <label class="date-dropdown-label">From</label>
                      <input
                        type="date"
                        v-model="dateFilters[col.name].from"
                        class="date-dropdown-input"
                        :max="dateFilters[col.name].to || undefined"
                      />
                    </div>
                    <div class="date-dropdown-field">
                      <label class="date-dropdown-label">To</label>
                      <input
                        type="date"
                        v-model="dateFilters[col.name].to"
                        class="date-dropdown-input"
                        :min="dateFilters[col.name].from || undefined"
                      />
                    </div>
                  </div>
                  <div class="date-dropdown-footer">
                    <button class="btn-shortcut" @click="setToday(col.name)">Today</button>
                    <button class="btn-shortcut" @click="setThisMonth(col.name)">This month</button>
                  </div>
                </div>
              </div>
            </template>

            <!-- SELECT FILTER -->
            <div v-else-if="col.type === 'select'" class="fl-wrap fl-select">
              <select
                v-model="activeFilters[col.name]"
                class="fl-input fl-input-select"
                :id="`filter-select-${col.name}`"
              >
                
                <option v-for="opt in col.options" :key="opt" :value="opt">{{ opt }}</option>
              </select>
              <label :for="`filter-select-${col.name}`" class="fl-label fl-label-select">{{ col.name }}</label>
              <button
                v-if="activeFilters[col.name] && activeFilters[col.name] !== 'all'"
                class="select-icon-btn"
                @click.stop="activeFilters[col.name] = 'all'"
                title="Clear"
                type="button"
              >✕</button>
              <span v-else class="select-caret" aria-hidden="true">▾</span>
            </div>

            <!-- TEXT FILTER -->
            <div v-else class="fl-wrap fl-text">
              <input
                v-model="activeFilters[col.name]"
                type="text"
                placeholder=" "
                class="fl-input"
                :id="`filter-text-${col.name}`"
              />
              <label :for="`filter-text-${col.name}`" class="fl-label">{{ col.name }}</label>
              <button v-if="activeFilters[col.name]" class="fl-clear-btn" @click="activeFilters[col.name] = ''" title="Clear" type="button">✕</button>
            </div>

          </template>

        </div>

        <!-- FILTER PANEL FOOTER -->
        <div class="filter-footer">
          <button v-if="hasActiveFilters" class="btn-clear" @click="clearFilters">✕ Clear filters</button>
          <button class="btn-ghost-sm" @click="showFilters = false">Close</button>
        </div>
      </div>
    </transition>

    <!-- ================= TABLE ================= -->
    <div class="panel" v-if="columns.length">
      <div class="table-wrapper">
        <table class="table" id="print-table">
          <thead>
            <tr>
              <th
                v-for="col in columns"
                :key="col.name"
                class="sortable-th"
                @click="setSort(col.name)"
                :title="`Sort by ${col.name}`"
              >
                <div class="th-inner">
                  {{ col.name }}
                  <span v-if="col.required" class="req-dot" title="Required">*</span>
                  <span class="sort-icon">
                    <span :class="['sort-arrow', 'asc', { active: sortKey === col.name && sortDir === 'asc' }]">▲</span>
                    <span :class="['sort-arrow', 'desc', { active: sortKey === col.name && sortDir === 'desc' }]">▼</span>
                  </span>
                </div>
              </th>
              <th class="th-actions no-print">Actions</th>
            </tr>
          </thead>

          <tbody>
            <tr v-if="pagedLogs.length === 0">
              <td :colspan="columns.length + 1" class="empty-row">
                <div class="empty-state">
                  <div class="empty-icon">☰</div>
                  <p>No logs found{{ hasActiveFilters || searchQuery ? ' — try adjusting your filters' : '' }}</p>
                </div>
              </td>
            </tr>

              <tr v-for="log in pagedLogs" :key="log.id">
              <td v-for="col in columns" :key="col.name">
                <template v-if="col.name === 'Ticket Number'">
                  
                    <a v-if="getValue(log, col.name) !== '-'"
                    :href="`http://172.16.1.39:5001/viewJobRequest?job_id=${getValue(log, col.name)}`"
                    target="_blank"
                    class="ticket-link"
                  >{{ getValue(log, col.name) }}</a>
                  <span v-else class="cell-empty">—</span>
                </template>
                <template v-else>
                  <span
                    v-if="getValue(log, col.name) !== '-'"
                    :class="col.name === 'Status' ? `status-badge status-${getValue(log, col.name).toLowerCase().replace(/ /g, '-')}` : 'cell-value'"
                  >{{ getValue(log, col.name) }}</span>
                  <span v-else class="cell-empty">—</span>
                </template>
              </td>
              <td class="td-actions no-print">
                <button class="btn-icon-action edit" @click="openEdit(log)" title="Edit">✏</button>
                <button class="btn-icon-action danger" @click="askDelete(log)" title="Delete">🗑</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- ================= PAGINATION ================= -->
      <div class="pagination-bar" v-if="totalPages > 1 || filteredLogs.length > 0">
        <div class="pagination-info">
          Showing {{ paginationFrom }}–{{ paginationTo }} of {{ filteredLogs.length }}
          <span v-if="sortKey" class="sort-badge">
            Sorted by <strong>{{ sortKey }}</strong> {{ sortDir === 'asc' ? '↑' : '↓' }}
            <button class="btn-clear-sort" @click="clearSort" title="Clear sort">✕</button>
          </span>
        </div>

        <div class="pagination-controls">
          <select v-model="pageSize" class="page-size-select" @change="currentPage = 1">
            <option :value="10">10 / page</option>
            <option :value="25">25 / page</option>
            <option :value="50">50 / page</option>
            <option :value="100">100 / page</option>
          </select>

          <button class="page-btn" @click="currentPage = 1" :disabled="currentPage === 1" title="First">«</button>
          <button class="page-btn" @click="currentPage--" :disabled="currentPage === 1" title="Previous">‹</button>

          <template v-for="p in visiblePages" :key="p">
            <button
              v-if="p !== '...'"
              :class="['page-btn', { active: p === currentPage }]"
              @click="currentPage = p"
            >{{ p }}</button>
            <span v-else class="page-ellipsis">…</span>
          </template>

          <button class="page-btn" @click="currentPage++" :disabled="currentPage === totalPages" title="Next">›</button>
          <button class="page-btn" @click="currentPage = totalPages" :disabled="currentPage === totalPages" title="Last">»</button>
        </div>
      </div>
    </div>

    <!-- ================= PLACEHOLDER ================= -->
    <div class="panel placeholder-panel" v-else>
      <div class="placeholder-content">
        <div class="placeholder-icon">☰</div>
        <p>{{ module?.name || 'Loading module…' }}</p>
      </div>
    </div>

    <!-- ================= ADD / EDIT MODAL ================= -->
    <div v-if="showModal" class="modal-backdrop">
      <div class="modal">
        <div class="modal-header">
          <div>
            <h3>{{ isEdit ? 'Edit log' : 'Add log' }}</h3>
            <p>{{ isEdit ? 'Update the fields below' : 'Fill in the fields to add a new log' }}</p>
          </div>
          <button class="btn-ghost-sm" @click="closeModal">✕</button>
        </div>

        <div class="modal-body">
          <div v-for="col in columns" :key="col.name" class="form-group">
            <label class="form-label">
              {{ col.name }}
              <span v-if="col.required" class="required-star">*</span>
            </label>

            <select
              v-if="col.type === 'select'"
              v-model="form[col.name]"
              :class="['form-input', { 'input-error': fieldErrors[col.name] }]"
            >
              <option value="" disabled selected>Select option</option>
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
    <div v-if="showDelete" class="modal-backdrop">
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

/* ================= CLICK OUTSIDE DIRECTIVE ================= */
const vClickOutside = {
  mounted(el, binding) {
    el._clickOutside = (e) => { if (!el.contains(e.target)) binding.value(e) }
    document.addEventListener('click', el._clickOutside)
  },
  unmounted(el) {
    document.removeEventListener('click', el._clickOutside)
  }
}


const module = ref(null)
const columns = ref([])
const logs = ref([])
const showModal = ref(false)
const showDelete = ref(false)
const showFilters = ref(false)   // ← NEW: controls filter panel visibility
const isEdit = ref(false)
const selectedId = ref(null)
const form = ref({})
const fieldErrors = ref({})
const searchQuery = ref('')
const activeFilters = ref({})
const dateFilters = ref({})
const saving = ref(false)

/* ================= SORT ================= */
const sortKey = ref('')
const sortDir = ref('asc')

const setSort = (colName) => {
  if (sortKey.value === colName) {
    sortDir.value = sortDir.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortKey.value = colName
    sortDir.value = 'asc'
  }
  currentPage.value = 1
}

const clearSort = () => {
  sortKey.value = ''
  sortDir.value = 'asc'
}

/* ================= PAGINATION ================= */
const currentPage = ref(1)
const pageSize = ref(25)

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

/* ================= DATE PICKER ================= */
const openDatePicker = ref(null)

const todayStr = () => new Date().toISOString().slice(0, 10)

const toggleDatePicker = (colName) => {
  openDatePicker.value = openDatePicker.value === colName ? null : colName
}

const closeDatePicker = (colName) => {
  if (openDatePicker.value === colName) openDatePicker.value = null
}

const clearDateFilter = (colName) => {
  dateFilters.value[colName] = { from: '', to: '' }
  openDatePicker.value = null
  currentPage.value = 1
}

const setToday = (colName) => {
  const t = todayStr()
  dateFilters.value[colName].from = t
  dateFilters.value[colName].to   = t
  currentPage.value = 1
}

const setThisMonth = (colName) => {
  const now = new Date()
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const lastDay = new Date(y, now.getMonth() + 1, 0).getDate()
  dateFilters.value[colName].from = `${y}-${m}-01`
  dateFilters.value[colName].to   = `${y}-${m}-${lastDay}`
  currentPage.value = 1
}

const dateRangeLabel = (colName) => {
  const { from, to } = dateFilters.value[colName] || {}
  if (from && to)   return `${from} → ${to}`
  if (from)         return `From ${from}`
  if (to)           return `Until ${to}`
  return colName
}

/* ================= FILTER INIT ================= */
const initFilters = () => {
  columns.value.forEach(col => {
    if (!col.filterable) return
    if (col.type === 'date') {
      dateFilters.value[col.name] = { from: '', to: '' }
    } else {
      activeFilters.value[col.name] = ''
    }
  })
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
  dateFilters.value   = {}
  initFilters()
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

// Single source of truth for filter state — used by both hasActiveFilters and the badge count
const activeFilterCount = computed(() => {
  let count = 0
  if (searchQuery.value) count++
  Object.values(activeFilters.value).forEach(v => { if (v && v !== 'all') count++ })
  Object.values(dateFilters.value).forEach(df => { if (df.from || df.to) count++ })
  return count
})

// Derived from activeFilterCount — no duplicate iteration needed
const hasActiveFilters = computed(() => activeFilterCount.value > 0)

const clearFilters = () => {
  searchQuery.value = ''
  initFilters()
  currentPage.value = 1
}

const parseDate = (val) => {
  if (!val) return null
  const d = new Date(val)
  return isNaN(d) ? null : d
}

const filteredLogs = computed(() => {
  const base = logs.value.filter(log => {
    const matchesSearch = !searchQuery.value ||
      Object.values(log.data || {})
        .join(' ').toLowerCase().includes(searchQuery.value.toLowerCase())

    const matchesFilters = Object.entries(activeFilters.value).every(([key, value]) => {
      if (!value || value === 'all') return true
      return String(getValue(log, key)).toLowerCase().includes(String(value).toLowerCase())
    })

    const matchesDates = Object.entries(dateFilters.value).every(([key, range]) => {
      const { from, to } = range
      if (!from && !to) return true
      const cellVal = getValue(log, key)
      if (cellVal === '-' || !cellVal) return false
      const cellDate = parseDate(cellVal)
      if (!cellDate) return false
      const fromDate = from ? parseDate(from) : null
      const toDate   = to   ? parseDate(to)   : null
      if (toDate) toDate.setHours(23, 59, 59, 999)
      if (fromDate && cellDate < fromDate) return false
      if (toDate   && cellDate > toDate)   return false
      return true
    })

    return matchesSearch && matchesFilters && matchesDates
  })

  if (!sortKey.value) return base

  const col = columns.value.find(c => c.name === sortKey.value)
  const dir = sortDir.value === 'asc' ? 1 : -1

  return [...base].sort((a, b) => {
    const aVal = getValue(a, sortKey.value)
    const bVal = getValue(b, sortKey.value)

    if (aVal === '-' || aVal == null) return 1
    if (bVal === '-' || bVal == null) return -1

    if (col?.type === 'int') return (Number(aVal) - Number(bVal)) * dir
    if (col?.type === 'date' || col?.type === 'time') return (new Date(aVal) - new Date(bVal)) * dir

    return String(aVal).localeCompare(String(bVal), undefined, { sensitivity: 'base' }) * dir
  })
})

/* ================= PAGINATION COMPUTED ================= */
const totalPages = computed(() => Math.max(1, Math.ceil(filteredLogs.value.length / pageSize.value)))

const pagedLogs = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return filteredLogs.value.slice(start, start + pageSize.value)
})

const paginationFrom = computed(() =>
  filteredLogs.value.length === 0 ? 0 : (currentPage.value - 1) * pageSize.value + 1
)
const paginationTo = computed(() =>
  Math.min(currentPage.value * pageSize.value, filteredLogs.value.length)
)

const visiblePages = computed(() => {
  const total = totalPages.value
  const cur   = currentPage.value
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
  const pages = []
  if (cur <= 4) {
    pages.push(1, 2, 3, 4, 5, '...', total)
  } else if (cur >= total - 3) {
    pages.push(1, '...', total - 4, total - 3, total - 2, total - 1, total)
  } else {
    pages.push(1, '...', cur - 1, cur, cur + 1, '...', total)
  }
  return pages
})

watch([searchQuery, activeFilters, dateFilters], () => { currentPage.value = 1 }, { deep: true })

/* ================= INPUT TYPE ================= */
const inputType = (type) => {
  if (type === 'date') return 'date'
  if (type === 'time') return 'time'
  if (type === 'int')  return 'number'
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
  isEdit.value     = false
  selectedId.value = null
  fieldErrors.value = {}
  form.value = {}
  columns.value.forEach(c => { form.value[c.name] = '' })
  showModal.value = true
}

/* ================= EDIT ================= */
const openEdit = (log) => {
  isEdit.value      = true
  selectedId.value  = log.id
  fieldErrors.value = {}
  form.value        = { ...log.data }
  showModal.value   = true
}

/* ================= SAVE ================= */
const saveLog = async () => {
  if (!validate()) {
    showToast('Please fill in all required fields', 'error')
    return
  }

  saving.value = true
  try {
    const activeProfile = JSON.parse(localStorage.getItem('activeProfile') || '{}')
const meta = {
  _profileName: activeProfile.name || null,
  _moduleId:    Number(route.params.id),
}

if (isEdit.value) {
  await api.put(`/logs/${selectedId.value}`, { data: form.value, ...meta })
} else {
  await api.post('/logs', { moduleId: route.params.id, data: form.value, ...meta })
}
    showModal.value = false
    await loadLogs()

    if (isEdit.value && form.value['Status'] === 'Done') {
  const ticketNo = form.value['Ticket Number']
  if (ticketNo) {
    window.open(
      `http://172.16.1.39:5001/viewJobRequest?job_id=${ticketNo}`,
      '_blank'
    )
  }
}

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
    const activeProfile = JSON.parse(localStorage.getItem('activeProfile') || '{}')
await api.delete(`/logs/${selectedId.value}`, {
  data: {
    _profileName: activeProfile.name || null,
    _moduleId:    Number(route.params.id),
  }
})
    showDelete.value = false
    await loadLogs()
    showToast('Log deleted', 'success')
  } catch (err) {
    console.error(err)
    showToast('Failed to delete log', 'error')
  }
}

const closeModal = () => {
  showModal.value   = false
  fieldErrors.value = {}
}

/* ================= PRINT ================= */
const printLogs = () => {
  const dateRangeLabels = Object.entries(dateFilters.value)
    .filter(([, df]) => df.from || df.to)
    .map(([key, df]) => {
      const from = df.from || '—'
      const to   = df.to   || '—'
      return `${key}: ${from} → ${to}`
    })
    .join('  |  ')

  const moduleName = module.value?.name || 'Module'
  const printDate  = new Date().toLocaleDateString('en-PH', {
    year: 'numeric', month: 'long', day: 'numeric'
  })

  const allFilteredData = filteredLogs.value
  const colHeaders = columns.value.map(c => `<th>${c.name}</th>`).join('')
  const rows = allFilteredData.map(log =>
    `<tr>${columns.value.map(col => {
      const val = getValue(log, col.name)
      return `<td>${val === '-' ? '—' : val}</td>`
    }).join('')}</tr>`
  ).join('')

  const sortInfo = sortKey.value
    ? `<span>⇅ Sorted by: ${sortKey.value} (${sortDir.value === 'asc' ? '↑ asc' : '↓ desc'})</span>`
    : ''

  const win = window.open('', '_blank', 'width=900,height=700')
  win.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>${moduleName} — Logs</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Segoe UI', Arial, sans-serif; color: #111; padding: 24px; }
        .print-header { margin-bottom: 18px; border-bottom: 2px solid #111827; padding-bottom: 12px; }
        .print-header h1 { font-size: 20px; font-weight: 700; }
        .print-meta { display: flex; gap: 24px; margin-top: 6px; font-size: 12px; color: #555; flex-wrap: wrap; }
        .print-meta span { display: flex; align-items: center; gap: 4px; }
        table { width: 100%; border-collapse: collapse; font-size: 12px; }
        thead { background: #111827; color: white; }
        th { padding: 9px 12px; text-align: left; font-weight: 600; letter-spacing: 0.03em; }
        td { padding: 8px 12px; border-bottom: 1px solid #e5e7eb; }
        tbody tr:nth-child(even) { background: #f9fafb; }
        .footer { margin-top: 16px; font-size: 11px; color: #9ca3af; text-align: right; }
        @media print { body { padding: 0; } @page { margin: 15mm; } }
      </style>
    </head>
    <body>
      <div class="print-header">
        <h1>${moduleName}</h1>
        <div class="print-meta">
          <span>📅 Printed: ${printDate}</span>
          <span>📋 Records: ${allFilteredData.length}</span>
          ${dateRangeLabels ? `<span>🗓 Filter: ${dateRangeLabels}</span>` : ''}
          ${searchQuery.value ? `<span>🔍 Search: "${searchQuery.value}"</span>` : ''}
          ${sortInfo}
        </div>
      </div>
      <table>
        <thead><tr>${colHeaders}</tr></thead>
        <tbody>${rows}</tbody>
      </table>
      <div class="footer">Generated from ${moduleName} Log System</div>
      <script>window.onload = () => { window.print(); }<\/script>
    </body>
    </html>
  `)
  win.document.close()
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
  margin-bottom: 12px;
}
.topbar h1 { font-size: 20px; font-weight: 600; margin: 0; }
.topbar p  { font-size: 13px; color: #6b7280; margin: 2px 0 0; }
.topbar-actions { display: flex; gap: 8px; align-items: center; }

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
  transition: background 0.15s;
}
.btn-primary:hover    { background: #1f2937; }
.btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }

.btn-outline {
  background: white;
  color: #374151;
  border: 1px solid #e5e7eb;
  padding: 9px 16px;
  border-radius: 10px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  transition: all 0.15s;
}
.btn-outline:hover { background: #f9fafb; border-color: #d1d5db; }

/* ===== FILTER TOGGLE BUTTON ===== */
.btn-filter {
  background: white;
  color: #374151;
  border: 1px solid #e5e7eb;
  padding: 9px 16px;
  border-radius: 10px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  transition: all 0.15s;
  position: relative;
}
.btn-filter:hover { background: #f9fafb; border-color: #d1d5db; }
.btn-filter.active {
  background: #eff6ff;
  border-color: #bfdbfe;
  color: #1d4ed8;
}

.filter-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 18px;
  height: 18px;
  padding: 0 4px;
  border-radius: 99px;
  background: #1d4ed8;
  color: white;
  font-size: 10px;
  font-weight: 700;
  line-height: 1;
}


/* ===== FILTER PANEL (collapsible) ===== */
.filter-bar-panel {
  background: white;
  border: 1px solid #eef2f7;
  border-radius: 14px;
  padding: 14px 16px 12px;
  margin-bottom: 16px;
}

/* slide transition */
.filter-slide-enter-active,
.filter-slide-leave-active {
  transition: all 0.2s ease;
  overflow: hidden;
}
.filter-slide-enter-from,
.filter-slide-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}

.filter-bar {
  display: flex;
  align-items: flex-end;
  gap: 8px;
  flex-wrap: wrap;
}

.filter-bar > * {
  flex: 1 1 140px;
}

.filter-footer {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 8px;
  margin-top: 12px;
  padding-top: 10px;
  border-top: 1px solid #f1f5f9;
}

/* ===== FLOATING LABEL WRAPPER ===== */
.fl-wrap {
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
}

.fl-input {
  height: 44px;
  padding: 16px 10px 4px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  font-size: 13px;
  color: #111827;
  background: white;
  outline: none;
  transition: border-color 0.15s, box-shadow 0.15s;
  width: 100%;
  box-sizing: border-box;
  appearance: auto;
}
.fl-input:focus {
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59,130,246,0.1);
}

.fl-label {
  position: absolute;
  left: 10px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 13px;
  color: #9ca3af;
  pointer-events: none;
  transition: all 0.2s ease;
  white-space: nowrap;
  background: transparent;
}

.fl-wrap .fl-input:focus ~ .fl-label {
  top: 6px;
  transform: translateY(0);
  font-size: 10px;
  font-weight: 500;
  color: #3b82f6;
  letter-spacing: 0.03em;
}

.fl-wrap .fl-input:not(:placeholder-shown) ~ .fl-label {
  top: 6px;
  transform: translateY(0);
  font-size: 10px;
  font-weight: 500;
  color: #6b7280;
  letter-spacing: 0.03em;
}

.fl-wrap input[type="date"]:valid ~ .fl-label,
.fl-wrap input[type="time"]:valid ~ .fl-label {
  top: 6px;
  transform: translateY(0);
  font-size: 10px;
  font-weight: 500;
  color: #6b7280;
  letter-spacing: 0.03em;
}

.fl-label-select {
  top: 6px;
  transform: translateY(0);
  font-size: 10px;
  font-weight: 500;
  color: #6b7280;
  letter-spacing: 0.03em;
}

.fl-search { min-width: 0; flex: 2 1 200px; }
.search-icon {
  position: absolute;
  left: 10px;
  bottom: 11px;
  color: #9ca3af;
  font-size: 16px;
  pointer-events: none;
  transition: color 0.15s;
  z-index: 1;
}
.fl-search:focus-within .search-icon { color: #3b82f6; }
.search-input {
  height: 44px;
  padding: 16px 10px 4px 30px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  font-size: 13px;
  color: #111827;
  background: white;
  outline: none;
  transition: border-color 0.15s, box-shadow 0.15s;
  width: 100%;
  box-sizing: border-box;
}
.search-input:focus {
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59,130,246,0.1);
}
.search-label { left: 30px; }
.fl-search .search-input:focus ~ .search-label,
.fl-search .search-input:not(:placeholder-shown) ~ .search-label {
  top: 6px;
  transform: translateY(0);
  font-size: 10px;
  font-weight: 500;
  color: #3b82f6;
  letter-spacing: 0.03em;
}

.fl-select { min-width: 0; }
.fl-text   { min-width: 0; }

/* ===== DATE PICKER DROPDOWN ===== */
.date-picker-wrap {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.fl-label-static {
  font-size: 10px;
  font-weight: 500;
  color: #6b7280;
  letter-spacing: 0.03em;
  padding-left: 2px;
}

.date-trigger {
  height: 44px;
  padding: 0 10px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: white;
  color: #111827;
  font-size: 13px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  width: 100%;
  text-align: left;
  transition: border-color 0.15s, box-shadow 0.15s;
}
.date-trigger:hover { border-color: #d1d5db; background: #f9fafb; }
.date-trigger.active { border-color: #3b82f6; box-shadow: 0 0 0 3px rgba(59,130,246,0.1); color: #1d4ed8; }

.date-trigger-icon { font-size: 14px; flex-shrink: 0; }
.date-trigger-label { flex: 1; font-size: 12px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.date-trigger-caret { font-size: 11px; color: #9ca3af; flex-shrink: 0; }
.date-trigger-clear {
  font-size: 11px;
  color: #9ca3af;
  flex-shrink: 0;
  line-height: 1;
  transition: color 0.15s;
}
.date-trigger-clear:hover { color: #ef4444; }

/* clear button inside text/search/select filters */
.fl-clear-btn {
  position: absolute;
  right: 8px;
  bottom: 10px;
  background: none;
  border: none;
  cursor: pointer;
  font-size: 11px;
  color: #9ca3af;
  line-height: 1;
  padding: 2px;
  display: flex;
  align-items: center;
  transition: color 0.15s;
  z-index: 2;
}
.fl-clear-btn:hover { color: #ef4444; }

/* nudge inputs left so text doesn't hide under the ✕ */
.fl-wrap:has(.fl-clear-btn) .fl-input,
.fl-wrap:has(.fl-clear-btn) .search-input {
  padding-right: 26px;
}

/* hide native select arrow; our custom icon replaces it */
.fl-input-select {
  appearance: none;
  padding-right: 28px;
}

.select-icon-btn,
.select-caret {
  position: absolute;
  right: 8px;
  bottom: 10px;
  pointer-events: none;
  font-size: 11px;
  color: #9ca3af;
  line-height: 1;
}

.select-icon-btn {
  pointer-events: all;
  background: none;
  border: none;
  cursor: pointer;
  padding: 2px;
  display: flex;
  align-items: center;
  transition: color 0.15s;
  z-index: 2;
}
.select-icon-btn:hover { color: #ef4444; }

.date-dropdown {
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  z-index: 100;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  padding: 12px;
  box-shadow: 0 8px 24px rgba(0,0,0,0.1);
  min-width: 260px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.date-dropdown-row {
  display: flex;
  gap: 8px;
}

.date-dropdown-field {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.date-dropdown-label {
  font-size: 10px;
  font-weight: 500;
  color: #6b7280;
  letter-spacing: 0.03em;
}

.date-dropdown-input {
  height: 36px;
  padding: 0 8px;
  border: 1px solid #e5e7eb;
  border-radius: 7px;
  font-size: 12px;
  color: #111827;
  background: white;
  outline: none;
  width: 100%;
  box-sizing: border-box;
  transition: border-color 0.15s;
}
.date-dropdown-input:focus { border-color: #3b82f6; box-shadow: 0 0 0 3px rgba(59,130,246,0.1); }

.date-dropdown-footer {
  display: flex;
  gap: 6px;
  padding-top: 8px;
  border-top: 1px solid #f1f5f9;
}

.btn-shortcut {
  flex: 1;
  background: #f3f4f6;
  border: 1px solid #e5e7eb;
  color: #374151;
  padding: 5px 0;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s;
}
.btn-shortcut:hover { background: #e5e7eb; }

/* ===== BUTTONS (shared) ===== */
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
  border: 1px solid #e5e7eb;
  color: #6b7280;
  font-size: 12px;
  cursor: pointer;
  padding: 6px 12px;
  border-radius: 8px;
  transition: all 0.15s;
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

.sortable-th {
  cursor: pointer;
  user-select: none;
  transition: background 0.15s;
}
.sortable-th:hover { background: #1f2937; }

.th-inner {
  display: flex;
  align-items: center;
  gap: 6px;
}

.sort-icon {
  display: inline-flex;
  flex-direction: column;
  gap: 1px;
  margin-left: 2px;
  line-height: 1;
}

.sort-arrow {
  font-size: 8px;
  opacity: 0.25;
  transition: opacity 0.15s;
  line-height: 1;
}
.sort-arrow.active {
  opacity: 1;
  color: #60a5fa;
}

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
.btn-icon-action.edit         { color: #0284c7; }
.btn-icon-action.edit:hover   { background: #e0f2fe; }
.btn-icon-action.danger       { color: #dc2626; }
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

/* ===== PAGINATION ===== */
.pagination-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-top: 1px solid #f1f5f9;
  background: #fafafa;
  flex-wrap: wrap;
  gap: 8px;
}

.pagination-info {
  font-size: 12px;
  color: #6b7280;
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.sort-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  background: #eff6ff;
  border: 1px solid #bfdbfe;
  color: #1d4ed8;
  border-radius: 99px;
  padding: 2px 8px;
  font-size: 11px;
  font-weight: 500;
}

.btn-clear-sort {
  background: none;
  border: none;
  color: #93c5fd;
  cursor: pointer;
  font-size: 10px;
  padding: 0 2px;
  line-height: 1;
  display: inline-flex;
  align-items: center;
  transition: color 0.15s;
}
.btn-clear-sort:hover { color: #1d4ed8; }

.pagination-controls {
  display: flex;
  align-items: center;
  gap: 4px;
  flex-wrap: wrap;
}

.page-size-select {
  height: 32px;
  padding: 0 8px;
  border: 1px solid #e5e7eb;
  border-radius: 7px;
  font-size: 12px;
  color: #374151;
  background: white;
  outline: none;
  cursor: pointer;
  margin-right: 6px;
}

.page-btn {
  min-width: 32px;
  height: 32px;
  padding: 0 6px;
  border: 1px solid #e5e7eb;
  border-radius: 7px;
  background: white;
  color: #374151;
  font-size: 13px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s;
}
.page-btn:hover:not(:disabled) { background: #f3f4f6; border-color: #d1d5db; }
.page-btn.active { background: #111827; color: white; border-color: #111827; font-weight: 600; }
.page-btn:disabled { opacity: 0.35; cursor: not-allowed; }

.page-ellipsis {
  font-size: 13px;
  color: #9ca3af;
  padding: 0 4px;
  line-height: 32px;
}

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

.ticket-link {
  color: #2563eb;
  font-weight: 500;
  text-decoration: none;
  border-bottom: 1px dashed #93c5fd;
  transition: color 0.15s, border-color 0.15s;
}
.ticket-link:hover {
  color: #1d4ed8;
  border-bottom-color: #1d4ed8;
}

/* ===== STATUS BADGES ===== */
.status-badge {
  display: inline-block;
  padding: 3px 10px;
  border-radius: 99px;
  font-size: 11px;
  font-weight: 600;
  white-space: nowrap;
}
.status-ongoing      { background: #dbeafe; color: #1d4ed8; }
.status-pending      { background: #fef9c3; color: #a16207; }
.status-done         { background: #dcfce7; color: #15803d; }
.status-for-tommorow { background: #f3e8ff; color: #7e22ce; }
/* ===== PRINT ===== */
@media print {
  .no-print { display: none !important; }
}

/* ===== RESPONSIVE ===== */
@media (max-width: 768px) {
  .page { padding: 16px; }
  .topbar { flex-direction: column; align-items: flex-start; gap: 10px; }
  .topbar-actions { width: 100%; justify-content: flex-end; }
  .filter-bar { flex-direction: column; align-items: stretch; }
  .fl-wrap, .fl-search, .fl-date, .fl-select, .fl-text { width: 100%; min-width: unset; }
  .search-input { min-width: unset; }
  .date-range-inputs { flex-wrap: wrap; }
  .fl-date { flex: 1; min-width: unset !important; }
  .pagination-bar { flex-direction: column; align-items: flex-start; }
  .pagination-controls { flex-wrap: wrap; }
}
</style>