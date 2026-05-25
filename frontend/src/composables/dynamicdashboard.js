/**
 * useDynamicDashboard.js
 *
 * Auto-detects column types from module definitions and generates
 * appropriate chart configs + stat cards for any module's log data.
 *
 * Column type → chart mapping:
 *   select / varchar (≤8 unique vals)  → doughnut (if ≤5 vals) or bar breakdown
 *   date                               → timeline line chart (last 30 days)
 *   int (non-ID)                       → stat card (sum + avg)
 *   int (ID/ticket-like name)          → stat card showing UNIQUE COUNT only
 *   varchar (high cardinality)         → top-10 bar chart
 *
 * FIX: int columns whose name contains ID/ticket keywords now show
 *      the count of unique values (e.g. 4 tickets = 4), not the sum.
 */

import { Chart, registerables } from 'chart.js'
Chart.register(...registerables)

/* ─── THRESHOLDS ──────────────────────────────────────── */
export const THRESHOLDS = {
  doughnutMaxUniq:      5,
  barBreakdownMaxUniq:  8,
  topBarLimit:         10,
  optionAutoMaxUniq:   15,
  optionAutoMinUniq:    2,
}

/* ─── ID / TICKET KEYWORD DETECTION ──────────────────── */
const ID_KEYWORDS = [
  'ticket', 'id', 'no', 'num', 'number', 'ref',
  'code', 'case', 'order', 'invoice', 'serial',
]

export const isIdColumn = (col) =>
  ID_KEYWORDS.some(kw => col.name.toLowerCase().includes(kw))

/* ─── OPTION ANALYSIS PALETTE ─────────────────────────── */
export const OPTION_COLORS = [
  '#378ADD', '#22c55e', '#f59e0b', '#ef4444',
  '#8b5cf6', '#06b6d4', '#ec4899', '#14b8a6',
  '#f97316', '#6366f1', '#84cc16', '#e11d48',
]
export const OPTION_COLOR_FALLBACK = '#9ca3af'

/* ─── THEME ───────────────────────────────────────────── */
const mql = window.matchMedia('(prefers-color-scheme: dark)')
let _isDark = mql.matches
const getGrid = () => _isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)'
const getTick = () => _isDark ? '#888' : '#9ca3af'
mql.addEventListener('change', e => { _isDark = e.matches })

const PALETTE = [
  '#378ADD', '#639922', '#BA7517', '#7C3AED',
  '#0891B2', '#DB2777', '#D97706', '#059669',
  '#DC2626', '#4F46E5',
]

const PIE_PALETTE = [
  '#378ADD', '#639922', '#BA7517', '#7C3AED',
  '#0891B2', '#DB2777', '#D97706', '#059669',
]

/* ─── HELPERS ─────────────────────────────────────────── */

export const getVal = (log, colName) => {
  if (!log.data) return ''
  const key = Object.keys(log.data).find(k => k.toLowerCase() === colName.toLowerCase())
  return key !== undefined ? String(log.data[key] ?? '') : ''
}

const uniqueVals = (logs, colName) => {
  const set = new Set()
  logs.forEach(l => { const v = getVal(l, colName); if (v && v !== '-') set.add(v) })
  return [...set]
}

const freqMap = (logs, colName) => {
  const map = {}
  logs.forEach(l => {
    const v = getVal(l, colName)
    if (v && v !== '-') map[v] = (map[v] || 0) + 1
  })
  return map
}

const lastNDays = (n) => {
  const today = new Date()
  return Array.from({ length: n }, (_, i) => {
    const d = new Date(today)
    d.setDate(today.getDate() - (n - 1) + i)
    return d.toISOString().slice(0, 10)
  })
}

const fmtDay = (iso) => {
  const d = new Date(iso)
  return `${d.toLocaleString('default', { month: 'short' })} ${d.getDate()}`
}

/* ─── OPTION ANALYSIS ─────────────────────────────────── */

const OPTION_TYPES = new Set([
  'option', 'select', 'status', 'enum', 'dropdown', 'choice',
])

const isOptionColumn = (col, logs) => {
  if (OPTION_TYPES.has(col.type)) return true
  const vals = logs
    .map(l => { const v = getVal(l, col.name); return v && v !== '-' ? v.trim() : null })
    .filter(Boolean)
  if (!vals.length) return false
  const unique = new Set(vals)
  const allNumeric = [...unique].every(v => !isNaN(Number(v)))
  return (
    unique.size >= THRESHOLDS.optionAutoMinUniq &&
    unique.size <= THRESHOLDS.optionAutoMaxUniq &&
    !allNumeric
  )
}

export const computeOptionStats = (columns, logs) => {
  if (!logs.length || !columns.length) return []
  return columns
    .filter(col => isOptionColumn(col, logs))
    .map(col => {
      const tally = {}
      let total = 0
      logs.forEach(l => {
        const raw = getVal(l, col.name)
        const val = raw && raw !== '-' ? raw.trim() : null
        if (!val) return
        tally[val] = (tally[val] || 0) + 1
        total++
      })
      const items = Object.entries(tally)
        .sort((a, b) => b[1] - a[1])
        .map(([value, count], idx) => ({
          value,
          count,
          pct:   total ? Math.round((count / total) * 100) : 0,
          color: OPTION_COLORS[idx] ?? OPTION_COLOR_FALLBACK,
        }))
      return { colName: col.name, items, total }
    })
}

/* ─── COLUMN CLASSIFICATION ───────────────────────────── */

export const classifyColumn = (col, logs) => {
  if (!logs.length) return 'skip'

  switch (col.type) {
    case 'date':
      return 'timeline'

    case 'int': {
      const vals = logs.map(l => getVal(l, col.name)).filter(v => v && v !== '-')
      if (!vals.length) return 'skip'
      // ID/ticket columns → unique-count stat card (never summed, never bar)
      if (isIdColumn(col)) return 'numeric-stat'
      // Regular numeric → stat card with sum/avg
      const numeric = vals.map(v => parseFloat(v)).filter(v => !isNaN(v))
      return numeric.length ? 'numeric-stat' : 'skip'
    }

    case 'select': {
      const uniq = uniqueVals(logs, col.name)
      if (!uniq.length) return 'skip'
      return uniq.length <= THRESHOLDS.doughnutMaxUniq ? 'doughnut' : 'bar-breakdown'
    }

    case 'varchar':
    case 'text': {
      const uniq = uniqueVals(logs, col.name)
      if (!uniq.length) return 'skip'
      return uniq.length <= THRESHOLDS.barBreakdownMaxUniq ? 'bar-breakdown' : 'top-bar'
    }

    case 'time':
      return 'skip'

    default:
      return 'skip'
  }
}

/* ─── STAT CARD BUILDER ───────────────────────────────── */

export const buildNumericStat = (col, logs) => {
  const vals = logs.map(l => getVal(l, col.name)).filter(v => v && v !== '-')
  if (!vals.length) return null

  // ── FIX: ID/ticket columns → show unique count, never sum ──
  if (isIdColumn(col)) {
    const unique = new Set(vals)
    return {
      colName:  col.name,
      count:    unique.size,
      sum:      unique.size,  // display slot reused for unique count
      avg:      null,
      min:      null,
      max:      null,
      isIdCol:  true,
    }
  }

  // Regular numeric column
  const numeric = vals.map(v => parseFloat(v)).filter(v => !isNaN(v))
  if (!numeric.length) return null

  const sum = numeric.reduce((a, b) => a + b, 0)
  const avg = sum / numeric.length

  return {
    colName:  col.name,
    count:    numeric.length,
    sum:      Math.round(sum * 100) / 100,
    avg:      Math.round(avg * 100) / 100,
    min:      Math.min(...numeric),
    max:      Math.max(...numeric),
    isIdCol:  false,
  }
}

/* ─── CHART BUILDERS ──────────────────────────────────── */

const BASE_OPTS = {
  responsive:          true,
  maintainAspectRatio: false,
  animation:           { duration: 400 },
}

export const buildDoughnut = (canvas, col, logs) => {
  const fm     = freqMap(logs, col.name)
  const labels = Object.keys(fm)
  const data   = Object.values(fm)
  return new Chart(canvas, {
    type: 'doughnut',
    data: {
      labels,
      datasets: [{
        data,
        backgroundColor: PIE_PALETTE.slice(0, labels.length),
        borderWidth:  0,
        hoverOffset:  4,
      }],
    },
    options: {
      ...BASE_OPTS,
      cutout: '62%',
      plugins: {
        legend: {
          display:  true,
          position: 'bottom',
          labels: { font: { size: 11 }, color: getTick(), boxWidth: 12, padding: 8 },
        },
      },
    },
  })
}

export const buildBar = (canvas, col, logs, { horizontal = false, limit = THRESHOLDS.topBarLimit } = {}) => {
  const fm      = freqMap(logs, col.name)
  const entries = Object.entries(fm).sort((a, b) => b[1] - a[1]).slice(0, limit)
  const GRID    = getGrid()
  const TICK    = getTick()
  const colors  = horizontal ? PALETTE.slice(0, entries.length) : 'rgba(55,138,221,0.7)'

  return new Chart(canvas, {
    type: 'bar',
    data: {
      labels:   entries.map(e => e[0]),
      datasets: [{
        data:            entries.map(e => e[1]),
        backgroundColor: colors,
        borderWidth:     0,
        borderRadius:    4,
      }],
    },
    options: {
      ...BASE_OPTS,
      indexAxis: horizontal ? 'y' : 'x',
      plugins: { legend: { display: false } },
      scales: {
        x: {
          ticks: { color: TICK, font: { size: 11 }, ...(horizontal ? {} : { maxRotation: 35 }) },
          grid:  horizontal ? { color: GRID } : { display: false },
          ...(horizontal ? {} : { beginAtZero: true }),
        },
        y: {
          ticks: { color: TICK, font: { size: 11 } },
          grid:  horizontal ? { display: false } : { color: GRID },
          ...(horizontal ? {} : { beginAtZero: true }),
        },
      },
    },
  })
}

export const buildBarBreakdown = (canvas, col, logs, limit) =>
  buildBar(canvas, col, logs, { horizontal: true, limit })

export const buildTopBar = (canvas, col, logs, limit) =>
  buildBar(canvas, col, logs, { horizontal: false, limit })

export const buildTimeline = (canvas, col, logs, days = 30) => {
  const dayList = lastNDays(days)
  const counts  = dayList.map(d => logs.filter(l => getVal(l, col.name) === d).length)
  const labels  = dayList.map(fmtDay)
  const GRID    = getGrid()
  const TICK    = getTick()

  return new Chart(canvas, {
    type: 'line',
    data: {
      labels,
      datasets: [{
        label:                col.name,
        data:                 counts,
        borderColor:          '#378ADD',
        backgroundColor:      'rgba(55,138,221,0.08)',
        tension:              0.4,
        pointRadius:          3,
        pointBackgroundColor: '#378ADD',
        fill:                 true,
        borderWidth:          2,
      }],
    },
    options: {
      ...BASE_OPTS,
      plugins: { legend: { display: false } },
      scales: {
        x: {
          ticks: { color: TICK, font: { size: 11 }, maxRotation: 40, autoSkip: true, maxTicksLimit: 8 },
          grid:  { color: GRID },
        },
        y: { ticks: { color: TICK, font: { size: 11 } }, grid: { color: GRID }, beginAtZero: true },
      },
    },
  })
}

/* ─── CANVAS MAP HELPER ───────────────────────────────── */

export const clearCanvasMap = (canvasMap) => {
  Object.keys(canvasMap).forEach(k => delete canvasMap[k])
}

/* ─── MAIN COMPOSABLE ─────────────────────────────────── */

export const useDynamicDashboard = () => {
  let activeCharts = []

  const destroyAll = () => {
    activeCharts.forEach(c => { try { c.destroy() } catch (_) {} })
    activeCharts = []
  }

  const analyse = (columns, logs, overrides = {}) => {
    const chartMeta    = []
    const numericStats = []

    for (const col of columns) {
      const chartType = overrides[col.name] ?? classifyColumn(col, logs)
      if (chartType === 'skip') continue

      if (chartType === 'numeric-stat') {
        const stat = buildNumericStat(col, logs)
        if (stat) numericStats.push(stat)
      } else {
        chartMeta.push({ col, chartType })
      }
    }

    return { chartMeta, numericStats }
  }

  const buildCharts = (chartMeta, logs, canvasMap) => {
    destroyAll()

    for (const { col, chartType } of chartMeta) {
      const canvas = canvasMap[col.name]
      if (!canvas) continue

      let chart = null
      try {
        if (chartType === 'doughnut')      chart = buildDoughnut(canvas, col, logs)
        if (chartType === 'bar-breakdown') chart = buildBar(canvas, col, logs, { horizontal: true })
        if (chartType === 'top-bar')       chart = buildBar(canvas, col, logs, { horizontal: false })
        if (chartType === 'timeline')      chart = buildTimeline(canvas, col, logs)
      } catch (err) {
        console.error(`[useDynamicDashboard] Failed to build chart for "${col.name}":`, err)
      }

      if (chart) activeCharts.push(chart)
    }
  }

  return { analyse, buildCharts, destroyAll }
}