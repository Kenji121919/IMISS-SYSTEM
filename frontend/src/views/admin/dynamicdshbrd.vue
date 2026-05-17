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
      <div class="topbar-left">
        <h1>Dashboard</h1>
        <p>Auto-generated insights from your module data</p>
      </div>
      <div class="filter-row">
        <!-- MODULE SELECTOR -->
        <div class="select-wrap">
          <svg class="select-icon" viewBox="0 0 16 16" fill="none">
            <path d="M2 5h12M4 8h8M6 11h4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
          </svg>
          <select v-model="selectedModuleId" @change="onModuleChange">
            <option value="all">All modules</option>
            <option v-for="m in moduleList" :key="m.id" :value="m.id">{{ m.name }}</option>
          </select>
        </div>

        <!-- DATE RANGE -->
        <div class="date-range-row">
          <div class="date-input-wrap">
            <input type="date" v-model="dateFrom" @change="onDateChange" class="date-input" />
            <label class="date-label">From</label>
          </div>
          <span class="date-sep">→</span>
          <div class="date-input-wrap">
            <input type="date" v-model="dateTo" @change="onDateChange" class="date-input" />
            <label class="date-label">To</label>
          </div>
          <button class="btn-today" @click="setLast30">Last 30d</button>
        </div>

        <!-- CUSTOMIZE TOGGLE -->
        <button
          class="btn-customize"
          :class="{ active: showCustomize }"
          @click="showCustomize = !showCustomize"
          title="Customize chart types"
        >
          <svg viewBox="0 0 16 16" fill="none" width="13" height="13">
            <circle cx="8" cy="8" r="2" stroke="currentColor" stroke-width="1.4"/>
            <path d="M8 2v1.5M8 12.5V14M2 8h1.5M12.5 8H14M3.93 3.93l1.06 1.06M11 11l1.06 1.06M3.93 12.07l1.06-1.06M11 5l1.06-1.06"
              stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>
          </svg>
          Customize
        </button>

        <button v-if="hasFilters" class="clear-btn" @click="clearFilters">
          <svg viewBox="0 0 16 16" fill="none" width="12" height="12">
            <path d="M3 3l10 10M13 3L3 13" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
          </svg>
          Clear
        </button>
      </div>
    </div>

    <!-- ================= CUSTOMIZE PANEL ================= -->
    <transition name="slide-down">
      <div v-if="showCustomize && currentColumns.length" class="customize-panel">
        <div class="customize-header">
          <div class="customize-title">
            <svg viewBox="0 0 16 16" fill="none" width="14" height="14">
              <circle cx="8" cy="8" r="2" stroke="currentColor" stroke-width="1.4"/>
              <path d="M8 2v1.5M8 12.5V14M2 8h1.5M12.5 8H14M3.93 3.93l1.06 1.06M11 11l1.06 1.06M3.93 12.07l1.06-1.06M11 5l1.06-1.06"
                stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>
            </svg>
            Chart type overrides
          </div>
          <button class="btn-reset-overrides" @click="resetOverrides" title="Reset all to auto">
            Reset to auto
          </button>
        </div>
        <div class="customize-grid">
          <div v-for="col in currentColumns" :key="col.name" class="customize-row">
            <div class="customize-col-name">
              <span class="col-type-badge" :class="'type-' + col.type">{{ col.type }}</span>
              {{ col.name }}
            </div>
            <select
              class="customize-select"
              :value="chartOverrides[col.name] ?? 'auto'"
              @change="setOverride(col.name, $event.target.value)"
            >
              <option value="auto">Auto ({{ autoLabel(col) }})</option>
              <option value="doughnut">Doughnut / Pie</option>
              <option value="bar-breakdown">Bar (horizontal)</option>
              <option value="top-bar">Bar (vertical top-N)</option>
              <option value="timeline">Timeline</option>
              <option value="numeric-stat">Stat card only</option>
              <option value="skip">Hidden</option>
            </select>
          </div>
        </div>
      </div>
    </transition>

    <!-- ================= LOADING ================= -->
    <div v-if="loading" class="loading-overlay">
      <div class="spinner"></div>
      <span>Building dashboard…</span>
    </div>

    <template v-else>

      <!-- ================= SUMMARY STAT CARDS ================= -->
      <div class="stat-grid">
        <!-- Always-on: total logs -->
        <div class="stat-card">
          <div class="stat-label">Total logs</div>
          <div class="stat-value">{{ filteredLogs.length.toLocaleString() }}</div>
          <div class="stat-sub">{{ currentModuleName }}</div>
        </div>

        <!-- Numeric column stats -->
        <div
          v-for="ns in numericStats"
          :key="ns.colName"
          class="stat-card numeric"
        >
          <div class="stat-label">{{ ns.colName }}</div>
          <div class="stat-value">{{ ns.sum.toLocaleString() }}</div>
          <div class="stat-sub">Avg {{ ns.avg }} · Min {{ ns.min }} · Max {{ ns.max }}</div>
        </div>

        <!-- Module count (when showing all) -->
        <div v-if="selectedModuleId === 'all'" class="stat-card modules">
          <div class="stat-label">Modules</div>
          <div class="stat-value">{{ moduleList.length }}</div>
          <div class="stat-sub">Active modules</div>
        </div>
      </div>

      <!-- ================= NO DATA STATE ================= -->
      <div v-if="!filteredLogs.length" class="empty-board">
        <div class="empty-icon">📊</div>
        <p>No logs found for the selected filter.</p>
        <span>Try changing the module or date range.</span>
      </div>

      <!-- ================= CHARTS ================= -->
      <template v-else>

        <!-- Cross-module breakdown (all-modules view only) -->
        <div v-if="selectedModuleId === 'all'" class="chart-card full" style="margin-bottom:16px;">
          <div class="chart-header">
            <div>
              <div class="chart-title">Logs per module</div>
              <div class="chart-sub">Total log count across all modules</div>
            </div>
          </div>
          <div style="position:relative;height:200px;">
            <canvas ref="moduleBreakdownRef"></canvas>
          </div>
        </div>

        <!-- Dynamic charts per column -->
        <div class="charts-grid" :class="{ 'single-col': chartMeta.length === 1 }">
          <div
            v-for="item in chartMeta"
            :key="item.col.name"
            class="chart-card"
            :class="{
              'span-2': item.chartType === 'timeline' || item.chartType === 'top-bar',
            }"
          >
            <div class="chart-header">
              <div>
                <div class="chart-title">{{ item.col.name }}</div>
                <div class="chart-sub">{{ chartSubLabel(item) }}</div>
              </div>
              <div class="chart-type-badge" :class="chartOverrides[item.col.name] ? 'badge-custom' : ''">
                {{ chartTypeName(item.chartType) }}
                <span v-if="chartOverrides[item.col.name]" class="badge-custom-dot" title="Customized">✦</span>
              </div>
            </div>
            <div :style="{ position: 'relative', height: item.chartType === 'timeline' ? '200px' : '210px' }">
              <canvas :ref="el => { if (el) canvasMap[item.col.name] = el }"></canvas>
            </div>
          </div>
        </div>

      </template>
    </template>

  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { Chart, registerables } from 'chart.js'
import { useDynamicDashboard, getVal, classifyColumn, clearCanvasMap } from '@/composables/dynamicdashboard.js'
import api from '@/api/axios'

// NOTE: Chart.register is already called inside useDynamicDashboard.js — don't call it again here.

/* ─── ADMIN GUARD ───────────────────────────────────── */
const router = useRouter()
const activeProfile = JSON.parse(localStorage.getItem('activeProfile') || '{}')
const isAdmin = activeProfile?.team?.toLowerCase() === 'admin' || activeProfile?.name?.toLowerCase() === 'admin'
if (!isAdmin) router.replace('/dashboard/module/')

/* ─── REFS ──────────────────────────────────────────── */
const loading          = ref(true)
const moduleList       = ref([])
const allLogs          = ref([])
const selectedModuleId = ref('all')
const dateFrom         = ref('')
const dateTo           = ref('')

const chartMeta    = ref([])
const numericStats = ref([])
const canvasMap    = {}   // col.name → canvas element; MUST be cleared before every rebuild

const moduleBreakdownRef = ref(null)

const toast          = ref({ show: false, message: '', type: 'success' })
const showCustomize  = ref(false)
const chartOverrides = ref({})   // { [colName]: chart-type string | 'auto' }

/* ─── COMPOSABLE ────────────────────────────────────── */
const { analyse, buildCharts, destroyAll } = useDynamicDashboard()

/* ─── MODULE BREAKDOWN CHART ────────────────────────── */
const isDark  = window.matchMedia('(prefers-color-scheme: dark)').matches
const GRID    = isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)'
const TICK    = isDark ? '#888' : '#9ca3af'
let   moduleBreakdownChart = null

const buildModuleBreakdown = (logs) => {
  try {
    if (moduleBreakdownChart) { moduleBreakdownChart.destroy(); moduleBreakdownChart = null }
    if (!moduleBreakdownRef.value) return

    const modMap = {}
    logs.forEach(l => { modMap[l.moduleName] = (modMap[l.moduleName] || 0) + 1 })
    const entries = Object.entries(modMap).sort((a, b) => b[1] - a[1])

    const PALETTE = ['#378ADD','#639922','#BA7517','#7C3AED','#0891B2','#DB2777','#D97706','#059669','#DC2626','#4F46E5']

    moduleBreakdownChart = new Chart(moduleBreakdownRef.value, {
      type: 'bar',
      data: {
        labels:   entries.map(e => e[0]),
        datasets: [{
          data:            entries.map(e => e[1]),
          backgroundColor: PALETTE.slice(0, entries.length),
          borderWidth:     0,
          borderRadius:    4,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: { duration: 400 },
        plugins: { legend: { display: false } },
        scales: {
          x: { ticks: { color: TICK, font: { size: 11 }, maxRotation: 30 }, grid: { display: false } },
          y: { ticks: { color: TICK, font: { size: 11 } }, grid: { color: GRID }, beginAtZero: true },
        },
      },
    })
  } catch (err) {
    console.error('[DynamicDashboard] buildModuleBreakdown failed:', err)
  }
}

/* ─── COMPUTED ──────────────────────────────────────── */

/** Columns of the currently selected module (or merged when 'all') */
const currentColumns = computed(() => {
  if (selectedModuleId.value === 'all') {
    const seen = new Set()
    const cols = []
    moduleList.value.forEach(m => {
      ;(m.columns || []).forEach(col => {
        const key = `${col.name}::${col.type}`
        if (!seen.has(key)) { seen.add(key); cols.push(col) }
      })
    })
    return cols
  }
  const mod = moduleList.value.find(m => String(m.id) === String(selectedModuleId.value))
  return mod?.columns || []
})

/** Logs for the selected module, optionally filtered by date */
const filteredLogs = computed(() => {
  // FIX: bucket by module first, then date-filter only the relevant slice
  let logs = selectedModuleId.value === 'all'
    ? allLogs.value
    : allLogs.value.filter(l => String(l.moduleId) === String(selectedModuleId.value))

  const dateCol = currentColumns.value.find(c => c.type === 'date')
  if (dateCol && (dateFrom.value || dateTo.value)) {
    logs = logs.filter(l => {
      const raw = getVal(l, dateCol.name)
      if (!raw) return false
      const d = new Date(raw)
      if (isNaN(d)) return false
      if (dateFrom.value && d < new Date(dateFrom.value)) return false
      if (dateTo.value) {
        const end = new Date(dateTo.value)
        end.setHours(23, 59, 59, 999)
        if (d > end) return false
      }
      return true
    })
  }

  return logs
})

const currentModuleName = computed(() => {
  if (selectedModuleId.value === 'all') return 'All modules'
  return moduleList.value.find(m => String(m.id) === String(selectedModuleId.value))?.name || 'Module'
})

const hasFilters = computed(() =>
  selectedModuleId.value !== 'all' || dateFrom.value || dateTo.value
)

/* ─── OVERRIDE HELPERS ──────────────────────────────── */

const autoLabel = (col) => {
  const t = classifyColumn(col, filteredLogs.value)
  return chartTypeName(t)
}

const setOverride = (colName, value) => {
  if (value === 'auto') {
    const copy = { ...chartOverrides.value }
    delete copy[colName]
    chartOverrides.value = copy
  } else {
    chartOverrides.value = { ...chartOverrides.value, [colName]: value }
  }
  rebuild()
}

const resetOverrides = () => {
  chartOverrides.value = {}
  rebuild()
}

/* ─── HELPERS ───────────────────────────────────────── */

const chartSubLabel = ({ col, chartType }) => {
  if (chartType === 'timeline')      return `Daily count by ${col.name} (last 30 days)`
  if (chartType === 'doughnut')      return `${col.name} distribution`
  if (chartType === 'bar-breakdown') return `Count by ${col.name}`
  if (chartType === 'top-bar')       return `Top entries for ${col.name}`
  return ''
}

const chartTypeName = (type) => {
  const map = {
    doughnut:       'Pie',
    'bar-breakdown':'Bar',
    timeline:       'Timeline',
    'top-bar':      'Top-N bar',
    'numeric-stat': 'Stat',
    skip:           'Hidden',
  }
  return map[type] ?? type.replace(/-/g, ' ')
}

/* ─── REBUILD ───────────────────────────────────────── */

const rebuild = async () => {
  // Step 1: tear down existing charts and wipe stale canvas refs
  destroyAll()
  if (moduleBreakdownChart) { moduleBreakdownChart.destroy(); moduleBreakdownChart = null }
  clearCanvasMap(canvasMap)   // FIX: prevents stale refs from previous module leaking through
  chartMeta.value    = []
  numericStats.value = []

  const logs = filteredLogs.value
  if (!logs.length) return

  // Build overrides map (strip 'auto' entries — composable treats missing key as auto)
  const overrides = {}
  for (const [col, val] of Object.entries(chartOverrides.value)) {
    if (val && val !== 'auto') overrides[col] = val
  }

  const result = analyse(currentColumns.value, logs, overrides)
  chartMeta.value    = result.chartMeta
  numericStats.value = result.numericStats

  // FIX: double nextTick — first tick renders the chart-card divs,
  // second tick fires the :ref callbacks that populate canvasMap.
  await nextTick()
  await nextTick()

  buildCharts(chartMeta.value, logs, canvasMap)

  if (selectedModuleId.value === 'all') {
    buildModuleBreakdown(logs)
  }
}

/* ─── EVENT HANDLERS ────────────────────────────────── */

const onModuleChange = () => {
  // Reset overrides that don't apply to the new module's columns
  const validCols = new Set(currentColumns.value.map(c => c.name))
  const cleaned   = {}
  for (const [k, v] of Object.entries(chartOverrides.value)) {
    if (validCols.has(k)) cleaned[k] = v
  }
  chartOverrides.value = cleaned
  rebuild()
}

const onDateChange = () => rebuild()

const clearFilters = () => {
  selectedModuleId.value = 'all'
  dateFrom.value = ''
  dateTo.value   = ''
  rebuild()
}

const setLast30 = () => {
  const to   = new Date()
  const from = new Date()
  from.setDate(from.getDate() - 29)
  dateFrom.value = from.toISOString().slice(0, 10)
  dateTo.value   = to.toISOString().slice(0, 10)
  rebuild()
}

const showToast = (message, type = 'success') => {
  toast.value = { show: true, message, type }
  setTimeout(() => { toast.value.show = false }, 2500)
}

/* ─── MOUNT ─────────────────────────────────────────── */

onMounted(async () => {
  if (!isAdmin) return

  try {
    const user = JSON.parse(localStorage.getItem('user') || '{}')

    const modRes = await api.get(`/modules/${user.id}`)
    const modules = modRes.data || []

    moduleList.value = modules.map(m => ({
      ...m,
      columns: typeof m.columns === 'string' ? JSON.parse(m.columns) : (m.columns || []),
    }))

    // Fetch all logs in parallel
    const rawLogs = (await Promise.all(
      modules.map(m =>
        api.get(`/logs/module/${m.id}`).then(r =>
          r.data.map(log => {
            const data = {}
            if (Array.isArray(log.values)) {
              log.values.forEach(v => { data[v.column?.name || v.column] = v.value })
            }
            if (log.data && typeof log.data === 'object') Object.assign(data, log.data)
            return { ...log, data, moduleId: m.id, moduleName: m.name }
          })
        )
      )
    )).flat()

    allLogs.value = rawLogs
  } catch (err) {
    console.error(err)
    showToast('Failed to load data', 'error')
  } finally {
    loading.value = false
    await nextTick()
    await rebuild()
  }
})

onBeforeUnmount(() => {
  destroyAll()
  if (moduleBreakdownChart) moduleBreakdownChart.destroy()
})
</script>

<style scoped>
/* ─── PAGE ───────────────────────────────────────────── */
.page {
  padding: 24px;
  background: #f6f8fb;
  min-height: 100vh;
  font-family: Inter, Arial, sans-serif;
  color: #111827;
  box-sizing: border-box;
}

/* ─── TOAST ──────────────────────────────────────────── */
.toast {
  position: fixed; top: 20px; right: 20px;
  display: flex; align-items: center; gap: 8px;
  padding: 10px 16px; border-radius: 10px;
  color: white; font-size: 13px; font-weight: 500;
  z-index: 9999; box-shadow: 0 4px 16px rgba(0,0,0,0.15);
}
.toast.success { background: #22c55e; }
.toast.error   { background: #ef4444; }
.toast-icon { font-size: 14px; }
.toast-slide-enter-active, .toast-slide-leave-active { transition: all 0.25s ease; }
.toast-slide-enter-from, .toast-slide-leave-to { opacity: 0; transform: translateY(-8px); }

/* ─── TOPBAR ─────────────────────────────────────────── */
.topbar {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 20px;
}
.topbar-left h1 { font-size: 20px; font-weight: 600; color: #111827; margin: 0; }
.topbar-left p  { font-size: 13px; color: #6b7280; margin-top: 2px; }

.filter-row {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

/* ─── SELECT WRAP ────────────────────────────────────── */
.select-wrap {
  position: relative;
  display: flex;
  align-items: center;
}
.select-wrap select {
  appearance: none;
  padding: 7px 12px 7px 30px;
  font-size: 13px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: white;
  color: #374151;
  cursor: pointer;
  outline: none;
  transition: border-color 0.15s;
}
.select-wrap select:hover { border-color: #d1d5db; }
.select-wrap select:focus { border-color: #378ADD; box-shadow: 0 0 0 3px rgba(55,138,221,0.12); }
.select-icon {
  position: absolute; left: 8px;
  width: 15px; height: 15px;
  color: #9ca3af; pointer-events: none;
}

/* ─── DATE RANGE ─────────────────────────────────────── */
.date-range-row { display: flex; align-items: center; gap: 6px; }
.date-input-wrap { position: relative; }
.date-input {
  height: 34px;
  padding: 14px 8px 4px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  font-size: 12px;
  color: #111827;
  background: white;
  outline: none;
  transition: border-color 0.15s;
  min-width: 130px;
  box-sizing: border-box;
}
.date-input:focus { border-color: #378ADD; box-shadow: 0 0 0 3px rgba(55,138,221,0.12); }
.date-label {
  position: absolute;
  left: 8px; top: 4px;
  font-size: 9px; font-weight: 600;
  color: #9ca3af; letter-spacing: 0.04em;
  text-transform: uppercase;
  pointer-events: none;
}
.date-input:focus ~ .date-label,
.date-input:valid ~ .date-label { color: #378ADD; }
.date-sep { font-size: 12px; color: #9ca3af; }

.btn-today {
  height: 34px;
  padding: 0 10px;
  background: #eff6ff;
  border: 1px solid #bfdbfe;
  color: #1d4ed8;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.15s;
}
.btn-today:hover { background: #dbeafe; }

.btn-customize {
  height: 34px;
  padding: 0 12px;
  background: white;
  border: 1px solid #e5e7eb;
  color: #6b7280;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  transition: all 0.15s;
}
.btn-customize:hover { background: #f9fafb; border-color: #d1d5db; color: #374151; }
.btn-customize.active {
  background: #eff6ff;
  border-color: #bfdbfe;
  color: #1d4ed8;
}

.clear-btn {
  display: flex; align-items: center; gap: 5px;
  padding: 7px 12px;
  font-size: 12px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: white; color: #6b7280;
  cursor: pointer;
  transition: background 0.15s, color 0.15s;
}
.clear-btn:hover { background: #fef2f2; color: #ef4444; border-color: #fca5a5; }

/* ─── CUSTOMIZE PANEL ────────────────────────────────── */
.customize-panel {
  background: white;
  border: 1px solid #e0eaf8;
  border-radius: 14px;
  padding: 16px;
  margin-bottom: 20px;
  box-shadow: 0 2px 12px rgba(55,138,221,0.06);
}

.customize-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 14px;
}

.customize-title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  font-weight: 600;
  color: #1d4ed8;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.btn-reset-overrides {
  font-size: 11px;
  padding: 4px 10px;
  border: 1px solid #e5e7eb;
  border-radius: 99px;
  background: white;
  color: #9ca3af;
  cursor: pointer;
  transition: all 0.15s;
}
.btn-reset-overrides:hover { background: #f9fafb; color: #6b7280; border-color: #d1d5db; }

.customize-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 8px;
}

.customize-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 8px 10px;
  background: #f8fafc;
  border: 1px solid #eef2f7;
  border-radius: 8px;
}

.customize-col-name {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  font-weight: 500;
  color: #374151;
  flex: 1;
  min-width: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.col-type-badge {
  font-size: 9px;
  font-weight: 700;
  padding: 2px 6px;
  border-radius: 4px;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  flex-shrink: 0;
}
.type-select  { background: #dbeafe; color: #1d4ed8; }
.type-varchar, .type-text { background: #dcfce7; color: #15803d; }
.type-int     { background: #fef9c3; color: #92400e; }
.type-date    { background: #ede9fe; color: #6d28d9; }
.type-time    { background: #f1f5f9; color: #475569; }

.customize-select {
  padding: 5px 8px;
  font-size: 11px;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  background: white;
  color: #374151;
  outline: none;
  cursor: pointer;
  flex-shrink: 0;
}
.customize-select:focus { border-color: #378ADD; }

.slide-down-enter-active, .slide-down-leave-active {
  transition: all 0.2s ease;
  overflow: hidden;
}
.slide-down-enter-from, .slide-down-leave-to {
  opacity: 0;
  max-height: 0;
  transform: translateY(-6px);
}
.slide-down-enter-to, .slide-down-leave-from {
  opacity: 1;
  max-height: 600px;
}

/* ─── STAT CARDS ─────────────────────────────────────── */
.stat-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(170px, 1fr));
  gap: 12px;
  margin-bottom: 20px;
}
.stat-card {
  background: white;
  border: 1px solid #eef2f7;
  border-radius: 12px;
  padding: 16px;
  border-left: 3px solid #e5e7eb;
  transition: box-shadow 0.15s;
}
.stat-card:hover   { box-shadow: 0 2px 8px rgba(0,0,0,0.06); }
.stat-card.numeric { border-left-color: #378ADD; }
.stat-card.modules { border-left-color: #7C3AED; }

.stat-label { font-size: 12px; color: #6b7280; margin-bottom: 6px; }
.stat-value { font-size: 26px; font-weight: 600; color: #111827; letter-spacing: -0.5px; }
.stat-sub   { font-size: 11px; color: #9ca3af; margin-top: 4px; }

/* ─── EMPTY STATE ────────────────────────────────────── */
.empty-board {
  display: flex; flex-direction: column;
  align-items: center; justify-content: center;
  gap: 8px; padding: 60px 0;
  color: #9ca3af; text-align: center;
}
.empty-icon { font-size: 36px; opacity: 0.5; }
.empty-board p    { font-size: 14px; font-weight: 500; color: #6b7280; margin: 0; }
.empty-board span { font-size: 12px; }

/* ─── CHARTS GRID ────────────────────────────────────── */
.chart-card {
  background: white;
  border: 1px solid #eef2f7;
  border-radius: 14px;
  padding: 16px;
}
.chart-card.full { margin-bottom: 0; }

.charts-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}
.charts-grid.single-col { grid-template-columns: 1fr; }
.charts-grid .span-2    { grid-column: span 2; }

.chart-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 12px;
}
.chart-title { font-size: 13px; font-weight: 600; color: #111827; margin-bottom: 2px; }
.chart-sub   { font-size: 11px; color: #9ca3af; }

.chart-type-badge {
  font-size: 10px;
  font-weight: 600;
  padding: 3px 8px;
  border-radius: 99px;
  background: #f1f5f9;
  color: #64748b;
  white-space: nowrap;
  flex-shrink: 0;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  display: flex;
  align-items: center;
  gap: 4px;
}
.chart-type-badge.badge-custom {
  background: #eff6ff;
  color: #1d4ed8;
  border: 1px solid #bfdbfe;
}
.badge-custom-dot { font-size: 8px; }

/* ─── LOADING ────────────────────────────────────────── */
.loading-overlay {
  display: flex; flex-direction: column;
  align-items: center; justify-content: center;
  gap: 12px; padding: 80px 0;
  color: #9ca3af; font-size: 13px;
}
.spinner {
  width: 28px; height: 28px;
  border: 3px solid #e5e7eb;
  border-top-color: #378ADD;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

/* ─── RESPONSIVE ─────────────────────────────────────── */
@media (max-width: 900px) {
  .charts-grid { grid-template-columns: 1fr; }
  .charts-grid .span-2 { grid-column: span 1; }
  .customize-grid { grid-template-columns: 1fr; }
}
@media (max-width: 768px) {
  .page { padding: 16px; }
  .topbar { flex-direction: column; }
  .filter-row { width: 100%; }
  .date-range-row { flex-wrap: wrap; }
}
</style>