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
        <h1>My Dashboard</h1>
        <p v-if="activeModule">
          Viewing <strong>{{ activeModule.name }}</strong> —
          {{ filteredLogs.length }} log{{ filteredLogs.length !== 1 ? 's' : '' }}
        </p>
        <p v-else>Select a module below</p>
      </div>

      <div v-if="activeModule" class="filter-row">
        <div class="date-range-row">
          <div class="date-input-wrap">
            <input type="date" v-model="dateFrom" @change="rebuild" class="date-input" />
            <label class="date-label">From</label>
          </div>
          <span class="date-sep">→</span>
          <div class="date-input-wrap">
            <input type="date" v-model="dateTo" @change="rebuild" class="date-input" />
            <label class="date-label">To</label>
          </div>
          <button class="btn-today" @click="setLast30">Last 30d</button>
        </div>
        <button v-if="dateFrom || dateTo" class="clear-btn" @click="clearDates">
          <svg viewBox="0 0 16 16" fill="none" width="11" height="11">
            <path d="M3 3l10 10M13 3L3 13" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
          </svg>
          Clear
        </button>
      </div>
    </div>

    <!-- ================= MODULE TABS ================= -->
    <div class="module-tabs" v-if="allowedModules.length">
      <button
        v-for="m in allowedModules"
        :key="m.id"
        :class="['tab-btn', { active: activeModule?.id === m.id }]"
        @click="selectModule(m)"
      >
        {{ m.name }}
        <span class="tab-count">
          {{ logsByModule[m.id] !== undefined ? logsByModule[m.id].length : '–' }}
        </span>
      </button>
    </div>

    <!-- ================= NO MODULES ================= -->
    <div v-if="!allowedModules.length && !loading" class="empty-board">
      <div class="empty-icon">🔒</div>
      <p>No modules assigned to your profile.</p>
      <span>Ask your admin to assign modules to your profile.</span>
    </div>

    <!-- ================= LOADING ================= -->
    <div v-else-if="loading" class="loading-overlay">
      <div class="spinner"></div>
      <span>Loading your data…</span>
    </div>

    <!-- ================= NO MODULE SELECTED ================= -->
    <div v-else-if="!activeModule" class="empty-board">
      <div class="empty-icon">👆</div>
      <p>Select a module above to view its dashboard.</p>
    </div>

    <template v-else-if="!rebuilding">

      <!-- ================= STAT ROW ================= -->
      <div class="stat-grid">
        <div class="stat-card">
          <div class="stat-label">Total logs</div>
          <div class="stat-value">{{ filteredLogs.length.toLocaleString() }}</div>
          <div class="stat-sub">{{ activeModule.name }}</div>
        </div>
        <div
          v-for="ns in numericStats"
          :key="ns.colName"
          class="stat-card numeric"
        >
          <div class="stat-label">{{ ns.colName }}</div>
          <div class="stat-value">{{ ns.sum.toLocaleString() }}</div>
          <div class="stat-sub">Avg {{ ns.avg }} · Min {{ ns.min }} · Max {{ ns.max }}</div>
        </div>
      </div>

      <!-- ================= NO LOGS ================= -->
      <div v-if="!filteredLogs.length" class="empty-board" style="margin-top:24px;">
        <div class="empty-icon">📋</div>
        <p>No logs found for this period.</p>
        <span>Try a different date range or add some logs.</span>
      </div>

      <template v-else>

        <!-- ========== OPTION BREAKDOWN ========== -->
        <div v-if="optionStats.length" class="section-block">
          <div class="section-header">
            <span class="section-title">Option Breakdown</span>
            <span class="section-sub">Distribution of categorical fields</span>
          </div>

          <div class="option-grid">
            <div
              v-for="os in optionStats"
              :key="os.colName"
              class="option-card"
            >
              <!-- Header -->
              <div class="option-card-head">
                <span class="option-card-name">{{ os.colName }}</span>
                <span class="option-card-total">{{ os.total.toLocaleString() }} entries</span>
              </div>

              <!-- Stacked progress bar (full-width visual summary) -->
              <div class="option-stack-bar">
                <div
                  v-for="item in os.items"
                  :key="item.value"
                  class="option-stack-seg"
                  :style="{ width: item.pct + '%', background: item.color }"
                  :title="`${item.value}: ${item.count} (${item.pct}%)`"
                ></div>
              </div>

              <!-- Per-value breakdown rows -->
              <div class="option-rows">
                <div
                  v-for="item in os.items"
                  :key="item.value"
                  class="option-row"
                >
                  <div class="option-row-left">
                    <span class="option-dot" :style="{ background: item.color }"></span>
                    <span class="option-label">{{ item.value }}</span>
                  </div>
                  <div class="option-bar-track">
                    <div
                      class="option-bar-fill"
                      :style="{ width: item.pct + '%', background: item.color }"
                    ></div>
                  </div>
                  <div class="option-row-right">
                    <span class="option-count">{{ item.count.toLocaleString() }}</span>
                    <span class="option-pct" :style="{ color: item.color }">{{ item.pct }}%</span>
                  </div>
                </div>
              </div>

              <!-- Pill legend -->
              <div class="option-pills">
                <span
                  v-for="item in os.items"
                  :key="item.value"
                  class="option-pill"
                  :style="{
                    background: item.color + '15',
                    color: item.color,
                    borderColor: item.color + '35',
                  }"
                >
                  {{ item.value }}
                  <strong>{{ item.count }}</strong>
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- ========== CHARTS ========== -->
        <div v-if="chartMeta.length" class="section-block">
          <div class="section-header">
            <span class="section-title">Charts</span>
            <span class="section-sub">Trends and distributions</span>
          </div>

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
                <div class="chart-type-badge">{{ chartTypeName(item.chartType) }}</div>
              </div>
              <div :style="{ position: 'relative', height: item.chartType === 'timeline' ? '200px' : '210px' }">
                <canvas :ref="el => { if (el) canvasMap[item.col.name] = el }"></canvas>
              </div>
            </div>
          </div>
        </div>

      </template>
    </template>

  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { useDynamicDashboard, getVal, clearCanvasMap, computeOptionStats } from './useDynamicDashboard.js'
import api from '@/api/axios'

/* ─── STATE ─────────────────────────────────────────── */
const loading        = ref(true)
const rebuilding     = ref(false)
const allowedModules = ref([])
const activeModule   = ref(null)
const logsByModule   = ref({})

const dateFrom = ref('')
const dateTo   = ref('')

const chartMeta    = ref([])
const numericStats = ref([])
const optionStats  = ref([])   // ← NEW: one entry per option/categorical column
const canvasMap    = {}

const toast = ref({ show: false, message: '', type: 'success' })

/* ─── COMPOSABLE ────────────────────────────────────── */
const { analyse, buildCharts, destroyAll } = useDynamicDashboard()

/* ─── COMPUTED ──────────────────────────────────────── */
const currentLogs = computed(() =>
  activeModule.value ? (logsByModule.value[activeModule.value.id] || []) : []
)

const filteredLogs = computed(() => {
  let logs = currentLogs.value
  const dateCol = activeModule.value?.columns?.find(c => c.type === 'date')
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

/* ─── MODULE SELECT ─────────────────────────────────── */
const selectModule = async (m) => {
  activeModule.value = m
  dateFrom.value = ''
  dateTo.value   = ''
  if (!logsByModule.value[m.id]) await loadLogsForModule(m)
  await rebuild()
}

/* ─── REBUILD ───────────────────────────────────────── */
const rebuild = async () => {
  if (!activeModule.value) return
  rebuilding.value = true
  destroyAll()
  clearCanvasMap(canvasMap)

  chartMeta.value    = []
  numericStats.value = []
  optionStats.value  = []

  await nextTick()

  const logs    = filteredLogs.value
  const columns = activeModule.value.columns || []

  if (!logs.length) { rebuilding.value = false; return }

  // Numeric + chart analysis (unchanged)
  const result = analyse(columns, logs)
  chartMeta.value    = result.chartMeta
  numericStats.value = result.numericStats

  // NEW: option/categorical breakdown
  optionStats.value = computeOptionStats(columns, logs)

  rebuilding.value = false
  await nextTick()
  await nextTick()
  buildCharts(chartMeta.value, logs, canvasMap)
}

/* ─── DATE HELPERS ──────────────────────────────────── */
const setLast30 = () => {
  const to   = new Date()
  const from = new Date()
  from.setDate(from.getDate() - 29)
  dateFrom.value = from.toISOString().slice(0, 10)
  dateTo.value   = to.toISOString().slice(0, 10)
  rebuild()
}

const clearDates = () => {
  dateFrom.value = ''
  dateTo.value   = ''
  rebuild()
}

/* ─── CHART LABELS ──────────────────────────────────── */
const chartSubLabel = ({ col, chartType }) => {
  if (chartType === 'timeline')      return `Daily count by ${col.name} (last 30 days)`
  if (chartType === 'doughnut')      return `${col.name} distribution`
  if (chartType === 'bar-breakdown') return `Count by ${col.name}`
  if (chartType === 'top-bar')       return `Top entries for ${col.name}`
  return ''
}

const chartTypeName = (type) => {
  const map = {
    doughnut:        'Pie',
    'bar-breakdown': 'Bar',
    timeline:        'Timeline',
    'top-bar':       'Top-N bar',
  }
  return map[type] ?? type.replace(/-/g, ' ')
}

/* ─── TOAST ─────────────────────────────────────────── */
const showToast = (message, type = 'success') => {
  toast.value = { show: true, message, type }
  setTimeout(() => { toast.value.show = false }, 2500)
}

/* ─── LOAD DATA ─────────────────────────────────────── */
const normalizeLog = (log, moduleId) => {
  const data = {}
  if (Array.isArray(log.values)) {
    log.values.forEach(v => { data[v.column?.name || v.column] = v.value })
  }
  if (log.data && typeof log.data === 'object') Object.assign(data, log.data)
  return { ...log, data, moduleId }
}

const loadLogsForModule = async (m) => {
  try {
    const res = await api.get(`/logs/module/${m.id}`)
    logsByModule.value = {
      ...logsByModule.value,
      [m.id]: res.data.map(l => normalizeLog(l, m.id)),
    }
  } catch (err) {
    console.error(err)
    showToast(`Failed to load logs for ${m.name}`, 'error')
  }
}

/* ─── MOUNT ─────────────────────────────────────────── */
onMounted(async () => {
  try {
    const activeProfile = JSON.parse(localStorage.getItem('activeProfile') || '{}')
    const profileId = activeProfile?.id
    if (!profileId) { loading.value = false; return }

    const res  = await api.get(`/modules/profile/${profileId}`)
    const mods = res.data || []

    allowedModules.value = mods.map(m => ({
      ...m,
      columns: typeof m.columns === 'string' ? JSON.parse(m.columns) : (m.columns || []),
    }))

    if (allowedModules.value.length) {
      await loadLogsForModule(allowedModules.value[0])
      activeModule.value = allowedModules.value[0]
    }
  } catch (err) {
    console.error(err)
    showToast('Failed to load your modules', 'error')
  } finally {
    loading.value = false
    await nextTick()
    if (activeModule.value) await rebuild()
  }
})

onBeforeUnmount(() => destroyAll())
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
  display: flex; align-items: flex-start;
  justify-content: space-between; flex-wrap: wrap;
  gap: 12px; margin-bottom: 16px;
}
.topbar-left h1 { font-size: 20px; font-weight: 600; color: #111827; margin: 0; }
.topbar-left p  { font-size: 13px; color: #6b7280; margin-top: 2px; }
.topbar-left strong { color: #111827; }

.filter-row { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.date-range-row { display: flex; align-items: center; gap: 6px; }
.date-input-wrap { position: relative; }
.date-input {
  height: 34px; padding: 14px 8px 4px;
  border: 1px solid #e5e7eb; border-radius: 8px;
  font-size: 12px; color: #111827; background: white;
  outline: none; transition: border-color 0.15s;
  min-width: 130px; box-sizing: border-box;
}
.date-input:focus { border-color: #378ADD; box-shadow: 0 0 0 3px rgba(55,138,221,0.12); }
.date-label {
  position: absolute; left: 8px; top: 4px;
  font-size: 9px; font-weight: 600; color: #9ca3af;
  letter-spacing: 0.04em; text-transform: uppercase; pointer-events: none;
}
.date-input:focus ~ .date-label,
.date-input:valid ~ .date-label { color: #378ADD; }
.date-sep { font-size: 12px; color: #9ca3af; }
.btn-today {
  height: 34px; padding: 0 10px;
  background: #eff6ff; border: 1px solid #bfdbfe;
  color: #1d4ed8; border-radius: 8px;
  font-size: 12px; font-weight: 500; cursor: pointer;
  white-space: nowrap; transition: all 0.15s;
}
.btn-today:hover { background: #dbeafe; }
.clear-btn {
  display: flex; align-items: center; gap: 5px;
  padding: 7px 12px; font-size: 12px;
  border: 1px solid #e5e7eb; border-radius: 8px;
  background: white; color: #6b7280; cursor: pointer;
  transition: background 0.15s, color 0.15s;
}
.clear-btn:hover { background: #fef2f2; color: #ef4444; border-color: #fca5a5; }

/* ─── MODULE TABS ────────────────────────────────────── */
.module-tabs {
  display: flex; gap: 6px; flex-wrap: wrap;
  margin-bottom: 20px; padding-bottom: 16px;
  border-bottom: 1px solid #eef2f7;
}
.tab-btn {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 7px 14px; border: 1px solid #e5e7eb;
  border-radius: 99px; background: white; color: #6b7280;
  font-size: 13px; cursor: pointer; transition: all 0.15s; font-family: inherit;
}
.tab-btn:hover { border-color: #bfdbfe; background: #eff6ff; color: #1d4ed8; }
.tab-btn.active { background: #111827; border-color: #111827; color: white; font-weight: 500; }
.tab-count {
  font-size: 11px; padding: 1px 7px; border-radius: 99px;
  background: rgba(255,255,255,0.2); color: inherit; font-weight: 600;
}
.tab-btn:not(.active) .tab-count { background: #f1f5f9; color: #9ca3af; }

/* ─── STAT CARDS ─────────────────────────────────────── */
.stat-grid {
  display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 12px; margin-bottom: 20px;
}
.stat-card {
  background: white; border: 1px solid #eef2f7;
  border-radius: 12px; padding: 16px;
  border-left: 3px solid #e5e7eb; transition: box-shadow 0.15s;
}
.stat-card:hover   { box-shadow: 0 2px 8px rgba(0,0,0,0.06); }
.stat-card.numeric { border-left-color: #378ADD; }
.stat-label { font-size: 12px; color: #6b7280; margin-bottom: 6px; }
.stat-value { font-size: 26px; font-weight: 600; color: #111827; letter-spacing: -0.5px; }
.stat-sub   { font-size: 11px; color: #9ca3af; margin-top: 4px; }

/* ─── SECTION BLOCKS ─────────────────────────────────── */
.section-block { margin-bottom: 24px; }
.section-header {
  display: flex; align-items: baseline; gap: 10px;
  margin-bottom: 12px;
}
.section-title { font-size: 13px; font-weight: 600; color: #111827; }
.section-sub   { font-size: 11px; color: #9ca3af; }

/* ─── OPTION BREAKDOWN ───────────────────────────────── */
.option-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 14px;
}

.option-card {
  background: white;
  border: 1px solid #eef2f7;
  border-radius: 14px;
  padding: 16px;
  transition: box-shadow 0.15s;
}
.option-card:hover { box-shadow: 0 2px 10px rgba(0,0,0,0.06); }

.option-card-head {
  display: flex; align-items: center;
  justify-content: space-between; margin-bottom: 12px;
}
.option-card-name  { font-size: 13px; font-weight: 600; color: #111827; }
.option-card-total { font-size: 11px; color: #9ca3af; }

/* Stacked progress bar */
.option-stack-bar {
  display: flex; height: 6px; border-radius: 99px;
  overflow: hidden; gap: 2px; margin-bottom: 14px;
  background: #f1f5f9;
}
.option-stack-seg {
  height: 100%; min-width: 2px;
  transition: width 0.4s ease; border-radius: 2px;
}

/* Per-value rows */
.option-rows {
  display: flex; flex-direction: column; gap: 8px; margin-bottom: 12px;
}
.option-row {
  display: grid;
  grid-template-columns: 120px 1fr 70px;
  align-items: center; gap: 8px;
}
.option-row-left {
  display: flex; align-items: center; gap: 6px; min-width: 0;
}
.option-dot {
  width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0;
}
.option-label {
  font-size: 12px; color: #374151;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.option-bar-track {
  height: 6px; background: #f1f5f9;
  border-radius: 99px; overflow: hidden;
}
.option-bar-fill {
  height: 100%; border-radius: 99px;
  transition: width 0.4s ease; opacity: 0.75;
}
.option-row-right {
  display: flex; align-items: center;
  justify-content: flex-end; gap: 6px;
}
.option-count { font-size: 12px; font-weight: 600; color: #111827; }
.option-pct   { font-size: 11px; font-weight: 500; min-width: 30px; text-align: right; }

/* Pills */
.option-pills {
  display: flex; flex-wrap: wrap; gap: 5px;
  padding-top: 10px; border-top: 1px solid #f1f5f9;
}
.option-pill {
  display: inline-flex; align-items: center; gap: 5px;
  padding: 3px 9px; border-radius: 99px; border: 1px solid;
  font-size: 11px; font-weight: 500;
}
.option-pill strong { font-weight: 700; }

/* ─── CHARTS ─────────────────────────────────────────── */
.charts-grid {
  display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px;
}
.charts-grid.single-col { grid-template-columns: 1fr; }
.charts-grid .span-2    { grid-column: span 2; }

.chart-card {
  background: white; border: 1px solid #eef2f7;
  border-radius: 14px; padding: 16px;
}
.chart-header {
  display: flex; align-items: flex-start;
  justify-content: space-between; gap: 8px; margin-bottom: 12px;
}
.chart-title { font-size: 13px; font-weight: 600; color: #111827; margin-bottom: 2px; }
.chart-sub   { font-size: 11px; color: #9ca3af; }
.chart-type-badge {
  font-size: 10px; font-weight: 600;
  padding: 3px 8px; border-radius: 99px;
  background: #f1f5f9; color: #64748b;
  white-space: nowrap; flex-shrink: 0;
  text-transform: uppercase; letter-spacing: 0.04em;
}

/* ─── EMPTY / LOADING ────────────────────────────────── */
.empty-board {
  display: flex; flex-direction: column; align-items: center;
  justify-content: center; gap: 8px; padding: 60px 0;
  color: #9ca3af; text-align: center;
}
.empty-icon  { font-size: 36px; opacity: 0.5; }
.empty-board p    { font-size: 14px; font-weight: 500; color: #6b7280; margin: 0; }
.empty-board span { font-size: 12px; }

.loading-overlay {
  display: flex; flex-direction: column; align-items: center;
  justify-content: center; gap: 12px; padding: 80px 0;
  color: #9ca3af; font-size: 13px;
}
.spinner {
  width: 28px; height: 28px; border: 3px solid #e5e7eb;
  border-top-color: #378ADD; border-radius: 50%;
  animation: spin 0.7s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

/* ─── RESPONSIVE ─────────────────────────────────────── */
@media (max-width: 900px) {
  .charts-grid { grid-template-columns: 1fr; }
  .charts-grid .span-2 { grid-column: span 1; }
  .option-grid { grid-template-columns: 1fr; }
  .option-row  { grid-template-columns: 100px 1fr 56px; }
}
@media (max-width: 768px) {
  .page { padding: 16px; }
  .topbar { flex-direction: column; }
  .date-range-row { flex-wrap: wrap; }
}
</style>