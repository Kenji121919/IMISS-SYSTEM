<template>
  <div v-if="isAdmin" class="page">
    <div class="topbar">
      <h1>Dashboard</h1>
      <p>Overview of all log activity</p>
    </div>

    <!-- STAT CARDS -->
    <div class="stat-grid">
      <div class="stat-card">
        <div class="stat-label">Total logs</div>
        <div class="stat-value">{{ stats.total.toLocaleString() }}</div>
        <div class="stat-sub">Across all modules</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Done</div>
        <div class="stat-value">{{ stats.done.toLocaleString() }}</div>
        <div class="stat-sub">{{ stats.total ? Math.round(stats.done / stats.total * 100) : 0 }}% completion rate</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">In progress</div>
        <div class="stat-value">{{ stats.inProgress.toLocaleString() }}</div>
        <div class="stat-sub">{{ stats.total ? Math.round(stats.inProgress / stats.total * 100) : 0 }}% of all logs</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Pending</div>
        <div class="stat-value">{{ stats.pending.toLocaleString() }}</div>
        <div class="stat-sub">Needs attention</div>
      </div>
    </div>

    <!-- CHARTS ROW 1: timeline full width -->
    <div class="chart-card" style="margin-bottom: 16px;">
      <div class="chart-title">Logs over time</div>
      <div class="chart-sub">Daily log count + done status (last 14 days)</div>
      <div class="legend">
        <span><span class="leg-dot" style="background:#378ADD"></span>Total logs</span>
        <span><span class="leg-dot" style="background:#639922"></span>Done</span>
      </div>
      <div style="position:relative;height:200px;">
        <canvas ref="timelineRef" role="img" aria-label="Daily logs over time">Daily logs chart.</canvas>
      </div>
    </div>

    <!-- CHARTS ROW 2: 2 columns -->
    <div class="charts-grid" style="margin-bottom: 16px;">
      <div class="chart-card">
        <div class="chart-title">Logs by status</div>
        <div class="chart-sub">Distribution across all modules</div>
        <div class="legend">
          <span><span class="leg-dot" style="background:#639922"></span>Done</span>
          <span><span class="leg-dot" style="background:#378ADD"></span>In progress</span>
          <span><span class="leg-dot" style="background:#BA7517"></span>Pending</span>
        </div>
        <div style="position:relative;height:190px;">
          <canvas ref="statusRef" role="img" aria-label="Log status breakdown">Status chart.</canvas>
        </div>
      </div>

      <div class="chart-card">
        <div class="chart-title">Logs by assigned team</div>
        <div class="chart-sub">Total log count per team</div>
        <div style="position:relative;height:190px;">
          <canvas ref="teamRef" role="img" aria-label="Logs by team">Team chart.</canvas>
        </div>
      </div>

      <div class="chart-card">
        <div class="chart-title">Logs per module</div>
        <div class="chart-sub">Count of logs in each module</div>
        <div style="position:relative;height:190px;">
          <canvas ref="moduleRef" role="img" aria-label="Logs per module">Module chart.</canvas>
        </div>
      </div>

      <div class="chart-card">
        <div class="chart-title">Top employees — Done</div>
        <div class="chart-sub">Most logs marked as done</div>
        <div class="top-emp">
          <div v-for="(e, i) in topEmployees" :key="i" class="emp-row">
            <span class="emp-name">{{ i + 1 }}. {{ e.name }}</span>
            <div class="emp-bar-wrap">
              <div class="emp-bar" :style="{ width: Math.round(e.count / (topEmployees[0]?.count || 1) * 100) + '%' }"></div>
            </div>
            <span class="emp-count">{{ e.count }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { Chart, registerables } from 'chart.js'
import { useRouter } from 'vue-router'
import api from '@/api/axios'

Chart.register(...registerables)

const router = useRouter()

// Evaluated immediately — template uses this before onMounted runs
const activeProfile = JSON.parse(localStorage.getItem('activeProfile') || '{}')
const isAdmin = activeProfile?.team?.toLowerCase() === 'admin' || activeProfile?.name?.toLowerCase() === 'admin'

if (!isAdmin) {
  router.replace('/dashboard/module/')  
}

const timelineRef = ref(null)
const statusRef   = ref(null)
const teamRef     = ref(null)
const moduleRef   = ref(null)

const stats = ref({ total: 0, done: 0, inProgress: 0, pending: 0 })
const topEmployees = ref([])

let charts = []

const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches
const grid   = isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)'
const tick   = isDark ? '#888' : '#9ca3af'

/* ===== HELPERS ===== */
const getVal = (log, key) => log.data?.[key] ?? ''

const getStatus = (log) => {
  const raw = Object.entries(log.data || {}).find(([k]) =>
    k.toLowerCase().includes('status')
  )
  return raw ? String(raw[1]).toLowerCase() : ''
}

const getTeam = (log) => getVal(log, 'ASSIGNED TEAM') || getVal(log, 'Assigned Team') || ''

const getEmployee = (log) => {
  const key = Object.keys(log.data || {}).find(k =>
    k.toLowerCase().includes('employee') ||
    k.toLowerCase().includes('name') ||
    k.toLowerCase().includes('personnel')
  )
  return key ? log.data[key] : ''
}

const getDate = (log) => {
  const key = Object.keys(log.data || {}).find(k => k.toLowerCase().includes('date'))
  return key ? log.data[key] : log.createdAt?.slice(0, 10) || ''
}

/* ===== LOAD ===== */
onMounted(async () => {
  if (!isAdmin) return

  const user = JSON.parse(localStorage.getItem('user') || '{}')

  const [modulesRes] = await Promise.all([api.get(`/modules/${user.id}`)])
  const modules = modulesRes.data || []

  const allLogs = (await Promise.all(
    modules.map(m => api.get(`/logs/module/${m.id}`).then(r =>
      r.data.map(log => {
        const data = {}
        if (Array.isArray(log.values)) log.values.forEach(v => { data[v.column?.name || v.column] = v.value })
        if (log.data && typeof log.data === 'object') Object.assign(data, log.data)
        return { ...log, data, moduleName: m.name }
      })
    ))
  )).flat()

  // --- Stats ---
  const done       = allLogs.filter(l => getStatus(l) === 'done').length
  const inProgress = allLogs.filter(l => ['in progress','ongoing','active'].includes(getStatus(l))).length
  const pending    = allLogs.filter(l => ['pending','open','new'].includes(getStatus(l))).length

  stats.value = { total: allLogs.length, done, inProgress, pending }

  // --- Timeline (last 14 days) ---
  const today = new Date()
  const days  = Array.from({ length: 14 }, (_, i) => {
    const d = new Date(today); d.setDate(today.getDate() - 13 + i)
    return d.toISOString().slice(0, 10)
  })
  const dayTotals = days.map(d => allLogs.filter(l => getDate(l) === d).length)
  const dayDone   = days.map(d => allLogs.filter(l => getDate(l) === d && getStatus(l) === 'done').length)
  const dayLabels = days.map(d => { const dt = new Date(d); return `${dt.toLocaleString('default',{month:'short'})} ${dt.getDate()}` })

  // --- Status ---
  const statusDone = allLogs.filter(l => getStatus(l) === 'done').length
  const statusIP   = allLogs.filter(l => ['in progress','ongoing','active'].includes(getStatus(l))).length
  const statusPend = allLogs.filter(l => ['pending','open','new'].includes(getStatus(l))).length

  // --- By team ---
  const teamMap = {}
  allLogs.forEach(l => { const t = getTeam(l); if (t && t !== '-') teamMap[t] = (teamMap[t] || 0) + 1 })
  const teamEntries = Object.entries(teamMap).sort((a, b) => b[1] - a[1]).slice(0, 6)

  // --- Per module ---
  const modMap = {}
  allLogs.forEach(l => { modMap[l.moduleName] = (modMap[l.moduleName] || 0) + 1 })
  const modEntries = Object.entries(modMap).sort((a, b) => b[1] - a[1]).slice(0, 6)

  // --- Top employees (done) ---
  const empMap = {}
  allLogs.filter(l => getStatus(l) === 'done').forEach(l => {
    const name = getEmployee(l)
    if (name && name !== '-') empMap[name] = (empMap[name] || 0) + 1
  })
  topEmployees.value = Object.entries(empMap)
    .sort((a, b) => b[1] - a[1]).slice(0, 5)
    .map(([name, count]) => ({ name, count }))

  // --- Draw charts ---
  const teamColors = ['rgba(55,138,221,0.7)','rgba(99,153,34,0.7)','rgba(186,117,23,0.7)','rgba(163,45,45,0.7)','rgba(83,74,183,0.7)','rgba(20,184,166,0.7)']

  charts.push(new Chart(timelineRef.value, {
    type: 'bar',
    data: {
      labels: dayLabels,
      datasets: [
        { type: 'bar',  label: 'Total logs', data: dayTotals, backgroundColor: 'rgba(55,138,221,0.35)', borderColor: '#378ADD', borderWidth: 1 },
        { type: 'line', label: 'Done',       data: dayDone,   borderColor: '#639922', backgroundColor: 'rgba(99,153,34,0.08)', tension: 0.4, pointRadius: 3, pointBackgroundColor: '#639922', fill: true }
      ]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: { ticks: { color: tick, font: { size: 11 }, maxRotation: 45, autoSkip: true, maxTicksLimit: 7 }, grid: { color: grid } },
        y: { ticks: { color: tick, font: { size: 11 } }, grid: { color: grid }, beginAtZero: true }
      }
    }
  }))

  charts.push(new Chart(statusRef.value, {
    type: 'doughnut',
    data: {
      labels: ['Done','In progress','Pending'],
      datasets: [{ data: [statusDone, statusIP, statusPend], backgroundColor: ['#639922','#378ADD','#BA7517'], borderWidth: 0, hoverOffset: 4 }]
    },
    options: {
      responsive: true, maintainAspectRatio: false, cutout: '65%',
      plugins: { legend: { display: false } }
    }
  }))

  charts.push(new Chart(teamRef.value, {
    type: 'bar',
    data: {
      labels: teamEntries.map(e => e[0]),
      datasets: [{ data: teamEntries.map(e => e[1]), backgroundColor: teamColors, borderWidth: 0 }]
    },
    options: {
      indexAxis: 'y', responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: { ticks: { color: tick, font: { size: 11 } }, grid: { color: grid }, beginAtZero: true },
        y: { ticks: { color: tick, font: { size: 11 } }, grid: { display: false } }
      }
    }
  }))

  charts.push(new Chart(moduleRef.value, {
    type: 'bar',
    data: {
      labels: modEntries.map(e => e[0]),
      datasets: [{ data: modEntries.map(e => e[1]), backgroundColor: 'rgba(83,74,183,0.7)', borderWidth: 0 }]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: { ticks: { color: tick, font: { size: 11 }, maxRotation: 30 }, grid: { display: false } },
        y: { ticks: { color: tick, font: { size: 11 } }, grid: { color: grid }, beginAtZero: true }
      }
    }
  }))
})

onBeforeUnmount(() => charts.forEach(c => c.destroy()))
</script>

<style scoped>
.page { padding: 24px; background: #f6f8fb; min-height: 100vh; font-family: Inter, Arial, sans-serif; }
.topbar { margin-bottom: 20px; }
.topbar h1 { font-size: 20px; font-weight: 600; color: #111827; margin: 0; }
.topbar p  { font-size: 13px; color: #6b7280; margin-top: 2px; }

.stat-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px,1fr)); gap: 12px; margin-bottom: 20px; }
.stat-card { background: white; border: 1px solid #eef2f7; border-radius: 12px; padding: 16px; }
.stat-label { font-size: 12px; color: #6b7280; margin-bottom: 6px; }
.stat-value { font-size: 24px; font-weight: 600; color: #111827; }
.stat-sub   { font-size: 11px; color: #9ca3af; margin-top: 4px; }

.charts-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
.chart-card  { background: white; border: 1px solid #eef2f7; border-radius: 14px; padding: 16px; }
.chart-title { font-size: 13px; font-weight: 600; color: #111827; margin-bottom: 2px; }
.chart-sub   { font-size: 11px; color: #9ca3af; margin-bottom: 12px; }

.legend { display: flex; flex-wrap: wrap; gap: 12px; margin-bottom: 10px; font-size: 11px; color: #6b7280; }
.leg-dot { width: 10px; height: 10px; border-radius: 2px; display: inline-block; margin-right: 4px; vertical-align: middle; }

.top-emp { display: flex; flex-direction: column; gap: 10px; margin-top: 4px; }
.emp-row  { display: flex; align-items: center; gap: 10px; font-size: 12px; }
.emp-name { width: 100px; color: #6b7280; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.emp-bar-wrap { flex: 1; background: #f1f5f9; border-radius: 4px; height: 8px; overflow: hidden; }
.emp-bar  { height: 8px; border-radius: 4px; background: #378ADD; }
.emp-count { width: 28px; text-align: right; color: #111827; font-weight: 600; font-size: 12px; }

@media (max-width: 768px) {
  .charts-grid { grid-template-columns: 1fr; }
  .page { padding: 16px; }
}
</style>