<template>
  <div v-if="isAdmin" class="page">

    <!-- TOPBAR -->
    <div class="topbar">
      <div class="topbar-left">
        <h1>Dashboard</h1>
        <p>Overview of all log activity</p>
      </div>
      <div class="filter-row">
        <div class="select-wrap">
          <svg class="select-icon" viewBox="0 0 16 16" fill="none"><path d="M2 5h12M4 8h8M6 11h4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
          <select v-model="selectedModule" @change="applyFilter">
            <option value="all">All modules</option>
            <option v-for="m in moduleList" :key="m.id" :value="m.id">{{ m.name }}</option>
          </select>
        </div>
        <div class="select-wrap">
          <svg class="select-icon" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="5" r="2.5" stroke="currentColor" stroke-width="1.4"/><path d="M2.5 13c0-2.485 2.462-4.5 5.5-4.5s5.5 2.015 5.5 4.5" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>
          <select v-model="selectedTeam" @change="applyFilter">
            <option value="all">All teams</option>
            <option v-for="t in teamList" :key="t" :value="t">{{ t }}</option>
          </select>
        </div>
        <button v-if="selectedModule !== 'all' || selectedTeam !== 'all'" class="clear-btn" @click="clearFilter">
          <svg viewBox="0 0 16 16" fill="none" width="12" height="12"><path d="M3 3l10 10M13 3L3 13" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
          Clear
        </button>
      </div>
    </div>

    <!-- ACTIVE FILTER BADGE -->
    <div v-if="selectedModule !== 'all' || selectedTeam !== 'all'" class="filter-badge">
      <svg viewBox="0 0 16 16" fill="none" width="13" height="13"><path d="M2 4h12l-4.5 5.5V14l-3-1.5V9.5L2 4z" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/></svg>
      Filtered: {{ activeFilterLabel }}
    </div>

    <!-- STAT CARDS -->
    <div class="stat-grid">
      <div class="stat-card">
        <div class="stat-label">Total logs</div>
        <div class="stat-value">{{ stats.total.toLocaleString() }}</div>
        <div class="stat-sub">{{ activeFilterLabel }}</div>
      </div>
      <div class="stat-card done">
        <div class="stat-label">Done</div>
        <div class="stat-value">{{ stats.done.toLocaleString() }}</div>
        <div class="stat-sub">{{ stats.total ? Math.round(stats.done / stats.total * 100) : 0 }}% completion rate</div>
      </div>
      <div class="stat-card inprog">
        <div class="stat-label">In progress</div>
        <div class="stat-value">{{ stats.inProgress.toLocaleString() }}</div>
        <div class="stat-sub">{{ stats.total ? Math.round(stats.inProgress / stats.total * 100) : 0 }}% of logs</div>
      </div>
      <div class="stat-card pending">
        <div class="stat-label">Pending</div>
        <div class="stat-value">{{ stats.pending.toLocaleString() }}</div>
        <div class="stat-sub">Needs attention</div>
      </div>
    </div>

    <!-- LOADING -->
    <div v-if="loading" class="loading-overlay">
      <div class="spinner"></div>
      <span>Loading data…</span>
    </div>

    <template v-else>
      <!-- TIMELINE CHART -->
      <div class="chart-card full" style="margin-bottom: 16px;">
        <div class="chart-header">
          <div>
            <div class="chart-title">Logs over time</div>
            <div class="chart-sub">Daily log count + done status (last 14 days) — {{ activeFilterLabel }}</div>
          </div>
          <div class="legend">
            <span><span class="leg-dot" style="background:#378ADD"></span>Total logs</span>
            <span><span class="leg-dot" style="background:#639922"></span>Done</span>
          </div>
        </div>
        <div style="position:relative;height:200px;">
          <canvas ref="timelineRef" role="img" aria-label="Daily logs over time"></canvas>
        </div>
      </div>

      <!-- CHARTS GRID -->
      <div class="charts-grid">

        <!-- STATUS DOUGHNUT -->
        <div class="chart-card">
          <div class="chart-title">Logs by status</div>
          <div class="chart-sub">{{ activeFilterLabel }} distribution</div>
          <div class="legend">
            <span><span class="leg-dot" style="background:#639922"></span>Done</span>
            <span><span class="leg-dot" style="background:#378ADD"></span>In progress</span>
            <span><span class="leg-dot" style="background:#BA7517"></span>Pending</span>
          </div>
          <div style="position:relative;height:190px;">
            <canvas ref="statusRef" role="img" aria-label="Log status breakdown"></canvas>
          </div>
        </div>

        <!-- TEAM BAR -->
        <div class="chart-card">
          <div class="chart-title">Logs by assigned team</div>
          <div class="chart-sub">Total log count per team</div>
          <div style="position:relative;height:190px;">
            <canvas ref="teamRef" role="img" aria-label="Logs by team"></canvas>
          </div>
        </div>

        <!-- MODULE BAR (hidden when single module is selected) -->
        <div class="chart-card" v-if="selectedModule === 'all'">
          <div class="chart-title">Logs per module</div>
          <div class="chart-sub">Count of logs in each module</div>
          <div style="position:relative;height:190px;">
            <canvas ref="moduleRef" role="img" aria-label="Logs per module"></canvas>
          </div>
        </div>

        <!-- TOP EMPLOYEES — DONE -->
        <div class="chart-card" :style="selectedModule !== 'all' ? 'grid-column: span 2' : ''">
          <div class="chart-title">Top employees — Done</div>
          <div class="chart-sub">Most logs marked as done — {{ activeFilterLabel }}</div>
          <div v-if="topEmployees.length === 0" class="empty-state">
            <svg viewBox="0 0 24 24" fill="none" width="28" height="28"><circle cx="12" cy="8" r="3.5" stroke="currentColor" stroke-width="1.4"/><path d="M4 20c0-4 3.582-7 8-7s8 3 8 7" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>
            <span>No employee data found for this filter</span>
          </div>
          <div v-else class="top-emp">
            <div v-for="(e, i) in topEmployees" :key="i" class="emp-row">
              <div class="emp-rank" :class="['rank-'+( i < 3 ? i+1 : 'rest')]">{{ i + 1 }}</div>
              <span class="emp-name">{{ e.name }}</span>
              <div class="emp-bar-wrap">
                <div class="emp-bar" :style="{ width: Math.round(e.count / (topEmployees[0]?.count || 1) * 100) + '%' }"></div>
              </div>
              <span class="emp-count">{{ e.count }}</span>
            </div>
          </div>
        </div>

      </div>
    </template>

  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { Chart, registerables } from 'chart.js'
import { useRouter } from 'vue-router'
import api from '@/api/axios'

Chart.register(...registerables)

const router = useRouter()

const activeProfile = JSON.parse(localStorage.getItem('activeProfile') || '{}')
const isAdmin = activeProfile?.team?.toLowerCase() === 'admin' || activeProfile?.name?.toLowerCase() === 'admin'
if (!isAdmin) router.replace('/dashboard/module/')

/* ─── REFS ─────────────────────────────────────────── */
const timelineRef = ref(null)
const statusRef   = ref(null)
const teamRef     = ref(null)
const moduleRef   = ref(null)

const loading        = ref(true)
const allLogs        = ref([])
const moduleList     = ref([])
const teamList       = ref([])
const selectedModule = ref('all')
const selectedTeam   = ref('all')

const stats        = ref({ total: 0, done: 0, inProgress: 0, pending: 0 })
const topEmployees = ref([])

let charts = []

/* ─── THEME ─────────────────────────────────────────── */
const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches
const grid   = isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)'
const tick   = isDark ? '#888' : '#9ca3af'

/* ─── HELPERS ────────────────────────────────────────── */
const getVal = (log, key) => log.data?.[key] ?? ''

const getStatus = (log) => {
  const raw = Object.entries(log.data || {}).find(([k]) => k.toLowerCase().includes('status'))
  return raw ? String(raw[1]).toLowerCase().trim() : ''
}

const getTeam = (log) =>
  getVal(log, 'ASSIGNED TEAM') || getVal(log, 'Assigned Team') || getVal(log, 'assigned team') || ''

const getEmployee = (log) => {
  const key = Object.keys(log.data || {}).find(k =>
    k.toLowerCase().includes('employee') ||
    k.toLowerCase().includes('name') ||
    k.toLowerCase().includes('personnel')
  )
  return key ? String(log.data[key]).trim() : ''
}

const getDate = (log) => {
  const key = Object.keys(log.data || {}).find(k => k.toLowerCase().includes('date'))
  return key ? log.data[key] : log.createdAt?.slice(0, 10) || ''
}

const activeFilterLabel = computed(() => {
  const parts = []
  if (selectedModule.value !== 'all') {
    const m = moduleList.value.find(x => x.id === selectedModule.value)
    if (m) parts.push(m.name)
  }
  if (selectedTeam.value !== 'all') parts.push(selectedTeam.value)
  return parts.length ? parts.join(' · ') : 'All modules'
})

/* ─── FILTER & REBUILD ───────────────────────────────── */
const applyFilter = async () => {
  let logs = allLogs.value

  if (selectedModule.value !== 'all') {
    logs = logs.filter(l => l.moduleId === selectedModule.value)
  }
  if (selectedTeam.value !== 'all') {
    logs = logs.filter(l => getTeam(l) === selectedTeam.value)
  }

  buildStats(logs)
  buildTopEmployees(logs)

  // Destroy old charts then rebuild
  charts.forEach(c => c.destroy())
  charts = []

  await nextTick()
  buildCharts(logs)
}

const clearFilter = () => {
  selectedModule.value = 'all'
  selectedTeam.value   = 'all'
  applyFilter()
}

/* ─── STATS ──────────────────────────────────────────── */
const buildStats = (logs) => {
  const done       = logs.filter(l => getStatus(l) === 'done').length
  const inProgress = logs.filter(l => ['in progress', 'ongoing', 'active'].includes(getStatus(l))).length
  const pending    = logs.filter(l => ['pending', 'open', 'new'].includes(getStatus(l))).length
  stats.value = { total: logs.length, done, inProgress, pending }
}

/* ─── TOP EMPLOYEES ──────────────────────────────────── */
const buildTopEmployees = (logs) => {
  const empMap = {}
  logs
    .filter(l => getStatus(l) === 'done')
    .forEach(l => {
      const name = getEmployee(l)
      if (name && name !== '-' && name !== '') {
        empMap[name] = (empMap[name] || 0) + 1
      }
    })
  topEmployees.value = Object.entries(empMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([name, count]) => ({ name, count }))
}

/* ─── CHARTS ─────────────────────────────────────────── */
const teamColors = [
  'rgba(55,138,221,0.75)',
  'rgba(99,153,34,0.75)',
  'rgba(186,117,23,0.75)',
  'rgba(163,45,45,0.75)',
  'rgba(83,74,183,0.75)',
  'rgba(20,184,166,0.75)',
]

const buildCharts = (logs) => {
  // Timeline
  const today = new Date()
  const days = Array.from({ length: 14 }, (_, i) => {
    const d = new Date(today)
    d.setDate(today.getDate() - 13 + i)
    return d.toISOString().slice(0, 10)
  })
  const dayTotals = days.map(d => logs.filter(l => getDate(l) === d).length)
  const dayDone   = days.map(d => logs.filter(l => getDate(l) === d && getStatus(l) === 'done').length)
  const dayLabels = days.map(d => {
    const dt = new Date(d)
    return `${dt.toLocaleString('default', { month: 'short' })} ${dt.getDate()}`
  })

  // Status
  const statusDone = logs.filter(l => getStatus(l) === 'done').length
  const statusIP   = logs.filter(l => ['in progress', 'ongoing', 'active'].includes(getStatus(l))).length
  const statusPend = logs.filter(l => ['pending', 'open', 'new'].includes(getStatus(l))).length

  // By team
  const teamMap = {}
  logs.forEach(l => { const t = getTeam(l); if (t && t !== '-') teamMap[t] = (teamMap[t] || 0) + 1 })
  const teamEntries = Object.entries(teamMap).sort((a, b) => b[1] - a[1]).slice(0, 6)

  // By module (only when showing all)
  const modMap = {}
  logs.forEach(l => { modMap[l.moduleName] = (modMap[l.moduleName] || 0) + 1 })
  const modEntries = Object.entries(modMap).sort((a, b) => b[1] - a[1]).slice(0, 6)

  const baseOpts = {
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 400 },
  }

  // Timeline chart
  if (timelineRef.value) {
    charts.push(new Chart(timelineRef.value, {
      type: 'bar',
      data: {
        labels: dayLabels,
        datasets: [
          {
            type: 'bar', label: 'Total logs', data: dayTotals,
            backgroundColor: 'rgba(55,138,221,0.3)', borderColor: '#378ADD', borderWidth: 1, borderRadius: 3,
          },
          {
            type: 'line', label: 'Done', data: dayDone,
            borderColor: '#639922', backgroundColor: 'rgba(99,153,34,0.08)',
            tension: 0.4, pointRadius: 3, pointBackgroundColor: '#639922', fill: true,
          },
        ],
      },
      options: {
        ...baseOpts,
        plugins: { legend: { display: false } },
        scales: {
          x: { ticks: { color: tick, font: { size: 11 }, maxRotation: 45, autoSkip: true, maxTicksLimit: 7 }, grid: { color: grid } },
          y: { ticks: { color: tick, font: { size: 11 } }, grid: { color: grid }, beginAtZero: true },
        },
      },
    }))
  }

  // Status doughnut
  if (statusRef.value) {
    charts.push(new Chart(statusRef.value, {
      type: 'doughnut',
      data: {
        labels: ['Done', 'In progress', 'Pending'],
        datasets: [{
          data: [statusDone, statusIP, statusPend],
          backgroundColor: ['#639922', '#378ADD', '#BA7517'],
          borderWidth: 0, hoverOffset: 4,
        }],
      },
      options: {
        ...baseOpts,
        cutout: '65%',
        plugins: { legend: { display: false } },
      },
    }))
  }

  // Team bar
  if (teamRef.value) {
    charts.push(new Chart(teamRef.value, {
      type: 'bar',
      data: {
        labels: teamEntries.map(e => e[0]),
        datasets: [{ data: teamEntries.map(e => e[1]), backgroundColor: teamColors, borderWidth: 0, borderRadius: 3 }],
      },
      options: {
        ...baseOpts,
        indexAxis: 'y',
        plugins: { legend: { display: false } },
        scales: {
          x: { ticks: { color: tick, font: { size: 11 } }, grid: { color: grid }, beginAtZero: true },
          y: { ticks: { color: tick, font: { size: 11 } }, grid: { display: false } },
        },
      },
    }))
  }

  // Module bar (only when all modules shown)
  if (moduleRef.value && selectedModule.value === 'all') {
    charts.push(new Chart(moduleRef.value, {
      type: 'bar',
      data: {
        labels: modEntries.map(e => e[0]),
        datasets: [{ data: modEntries.map(e => e[1]), backgroundColor: 'rgba(83,74,183,0.7)', borderWidth: 0, borderRadius: 3 }],
      },
      options: {
        ...baseOpts,
        plugins: { legend: { display: false } },
        scales: {
          x: { ticks: { color: tick, font: { size: 11 }, maxRotation: 30 }, grid: { display: false } },
          y: { ticks: { color: tick, font: { size: 11 } }, grid: { color: grid }, beginAtZero: true },
        },
      },
    }))
  }
}

/* ─── MOUNT ──────────────────────────────────────────── */
onMounted(async () => {
  if (!isAdmin) return

  const user = JSON.parse(localStorage.getItem('user') || '{}')

  const modulesRes = await api.get(`/modules/${user.id}`)
  const modules = modulesRes.data || []
  moduleList.value = modules

  const rawLogs = (await Promise.all(
    modules.map(m =>
      api.get(`/logs/module/${m.id}`).then(r =>
        r.data.map(log => {
          const data = {}
          if (Array.isArray(log.values)) log.values.forEach(v => { data[v.column?.name || v.column] = v.value })
          if (log.data && typeof log.data === 'object') Object.assign(data, log.data)
          return { ...log, data, moduleId: m.id, moduleName: m.name }
        })
      )
    )
  )).flat()

  allLogs.value = rawLogs

  // Build team list for dropdown
  const tSet = new Set()
  rawLogs.forEach(l => { const t = getTeam(l); if (t && t !== '-') tSet.add(t) })
  teamList.value = [...tSet].sort()

  // Initial build
  buildStats(rawLogs)
  buildTopEmployees(rawLogs)

  loading.value = false
  await nextTick()
  buildCharts(rawLogs)
})

onBeforeUnmount(() => charts.forEach(c => c.destroy()))
</script>

<style scoped>
/* ─── PAGE ───────────────────────────────────────────── */
.page {
  padding: 24px;
  background: #f6f8fb;
  min-height: 100vh;
  font-family: Inter, Arial, sans-serif;
}

/* ─── TOPBAR ─────────────────────────────────────────── */
.topbar {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 16px;
}
.topbar-left h1 { font-size: 20px; font-weight: 600; color: #111827; margin: 0; }
.topbar-left p  { font-size: 13px; color: #6b7280; margin-top: 2px; }

.filter-row { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }

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
.select-wrap select:hover  { border-color: #d1d5db; }
.select-wrap select:focus  { border-color: #378ADD; box-shadow: 0 0 0 3px rgba(55,138,221,0.12); }
.select-icon {
  position: absolute;
  left: 8px;
  width: 15px;
  height: 15px;
  color: #9ca3af;
  pointer-events: none;
}

.clear-btn {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 7px 12px;
  font-size: 12px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: white;
  color: #6b7280;
  cursor: pointer;
  transition: background 0.15s, color 0.15s;
}
.clear-btn:hover { background: #fef2f2; color: #ef4444; border-color: #fca5a5; }

/* ─── FILTER BADGE ───────────────────────────────────── */
.filter-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 14px;
  padding: 5px 12px;
  background: #eff6ff;
  border: 1px solid #bfdbfe;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 500;
  color: #2563eb;
}

/* ─── STAT CARDS ─────────────────────────────────────── */
.stat-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
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
.stat-card:hover         { box-shadow: 0 2px 8px rgba(0,0,0,0.06); }
.stat-card.done          { border-left-color: #639922; }
.stat-card.inprog        { border-left-color: #378ADD; }
.stat-card.pending       { border-left-color: #BA7517; }

.stat-label { font-size: 12px; color: #6b7280; margin-bottom: 6px; }
.stat-value { font-size: 26px; font-weight: 600; color: #111827; letter-spacing: -0.5px; }
.stat-sub   { font-size: 11px; color: #9ca3af; margin-top: 4px; }

/* ─── CHARTS ─────────────────────────────────────────── */
.charts-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}
.chart-card {
  background: white;
  border: 1px solid #eef2f7;
  border-radius: 14px;
  padding: 16px;
}
.chart-card.full { margin-bottom: 0; }
.chart-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 12px;
}
.chart-title { font-size: 13px; font-weight: 600; color: #111827; margin-bottom: 2px; }
.chart-sub   { font-size: 11px; color: #9ca3af; }

.legend {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  font-size: 11px;
  color: #6b7280;
}
.leg-dot {
  width: 10px; height: 10px;
  border-radius: 2px;
  display: inline-block;
  margin-right: 4px;
  vertical-align: middle;
}

/* ─── TOP EMPLOYEES ──────────────────────────────────── */
.top-emp { display: flex; flex-direction: column; gap: 9px; margin-top: 8px; }
.emp-row { display: flex; align-items: center; gap: 9px; font-size: 12px; }

.emp-rank {
  width: 20px; height: 20px;
  border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-size: 10px; font-weight: 700;
  flex-shrink: 0;
}
.rank-1 { background: #fef9c3; color: #92400e; }
.rank-2 { background: #f1f5f9; color: #475569; }
.rank-3 { background: #fff7ed; color: #9a3412; }
.rank-rest { background: #f9fafb; color: #9ca3af; }

.emp-name {
  width: 110px;
  color: #374151;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  flex-shrink: 0;
  font-weight: 500;
}
.emp-bar-wrap { flex: 1; background: #f1f5f9; border-radius: 4px; height: 7px; overflow: hidden; }
.emp-bar { height: 7px; border-radius: 4px; background: linear-gradient(90deg, #378ADD, #5ba3e8); transition: width 0.4s ease; }
.emp-count { width: 28px; text-align: right; color: #111827; font-weight: 600; font-size: 12px; flex-shrink: 0; }

/* ─── LOADING ────────────────────────────────────────── */
.loading-overlay {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 60px 0;
  color: #9ca3af;
  font-size: 13px;
}
.spinner {
  width: 28px; height: 28px;
  border: 3px solid #e5e7eb;
  border-top-color: #378ADD;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

/* ─── EMPTY STATE ────────────────────────────────────── */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 30px 0;
  color: #9ca3af;
  font-size: 12px;
}

/* ─── RESPONSIVE ─────────────────────────────────────── */
@media (max-width: 768px) {
  .charts-grid { grid-template-columns: 1fr; }
  .page { padding: 16px; }
  .topbar { flex-direction: column; }
}
</style>