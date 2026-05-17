/**
 * useDynamicDashboard.js
 *
 * Auto-detects column types from module definitions and generates
 * appropriate chart configs + stat cards for any module's log data.
 *
 * Column type → chart mapping:
 *   select / varchar (≤8 unique vals)  → doughnut (if ≤5 vals) or bar breakdown
 *   date                               → timeline line chart (last 30 days)
 *   int                                → stat card (sum + avg) + optional bar
 *   varchar (high cardinality)         → top-10 bar chart
 *
 * FIXES applied vs original:
 *   - Dark mode: MediaQueryList listener instead of one-time snapshot
 *   - Bar builders: merged buildBarBreakdown + buildTopBar → single buildBar()
 *   - Thresholds: named constants instead of magic numbers
 *   - Chart.register: done once here; components must NOT call it again
 *   - clearCanvasMap() helper exported so callers can wipe stale refs
 */

import { Chart, registerables } from 'chart.js'
Chart.register(...registerables)

/* ─── THRESHOLDS ──────────────────────────────────────── */
export const THRESHOLDS = {
  doughnutMaxUniq:      5,   // ≤ this → doughnut; > this → bar-breakdown
  barBreakdownMaxUniq:  8,   // ≤ this → bar-breakdown; > this → top-bar
  topBarLimit:         10,   // max entries in a top-bar
}

/* ─── THEME (reactive to system changes) ─────────────────*/
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

/** Pull a value from a log's data by column name (case-insensitive) */
export const getVal = (log, colName) => {
  if (!log.data) return ''
  const key = Object.keys(log.data).find(k => k.toLowerCase() === colName.toLowerCase())
  return key !== undefined ? String(log.data[key] ?? '') : ''
}

/** Get all unique non-empty values for a column across logs */
const uniqueVals = (logs, colName) => {
  const set = new Set()
  logs.forEach(l => { const v = getVal(l, colName); if (v && v !== '-') set.add(v) })
  return [...set]
}

/** Frequency map: value → count */
const freqMap = (logs, colName) => {
  const map = {}
  logs.forEach(l => {
    const v = getVal(l, colName)
    if (v && v !== '-') map[v] = (map[v] || 0) + 1
  })
  return map
}

/** Get last N days as YYYY-MM-DD strings */
const lastNDays = (n) => {
  const today = new Date()
  return Array.from({ length: n }, (_, i) => {
    const d = new Date(today)
    d.setDate(today.getDate() - (n - 1) + i)
    return d.toISOString().slice(0, 10)
  })
}

/** Format date label: "Jun 1" */
const fmtDay = (iso) => {
  const d = new Date(iso)
  return `${d.toLocaleString('default', { month: 'short' })} ${d.getDate()}`
}

/* ─── COLUMN ANALYSIS ─────────────────────────────────── */

/**
 * Decide what kind of visualisation to create for a given column.
 * Returns one of: 'doughnut' | 'bar-breakdown' | 'timeline' | 'numeric-stat' | 'top-bar' | 'skip'
 */
export const classifyColumn = (col, logs) => {
  if (!logs.length) return 'skip'

  switch (col.type) {
    case 'date':
      return 'timeline'

    case 'int': {
      const vals = logs.map(l => parseFloat(getVal(l, col.name))).filter(v => !isNaN(v))
      return vals.length ? 'numeric-stat' : 'skip'
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

/**
 * Build a stat card definition for a numeric column.
 * Returns { colName, sum, avg, min, max, count }
 */
export const buildNumericStat = (col, logs) => {
  const vals = logs
    .map(l => parseFloat(getVal(l, col.name)))
    .filter(v => !isNaN(v))

  if (!vals.length) return null

  const sum = vals.reduce((a, b) => a + b, 0)
  const avg = sum / vals.length

  return {
    colName: col.name,
    count:   vals.length,
    sum:     Math.round(sum * 100) / 100,
    avg:     Math.round(avg * 100) / 100,
    min:     Math.min(...vals),
    max:     Math.max(...vals),
  }
}

/* ─── CHART BUILDERS ──────────────────────────────────── */

const BASE_OPTS = {
  responsive:          true,
  maintainAspectRatio: false,
  animation:           { duration: 400 },
}

/** Doughnut chart for select columns with ≤ THRESHOLDS.doughnutMaxUniq options */
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

/**
 * Unified bar chart builder — replaces separate buildBarBreakdown + buildTopBar.
 *
 * @param {HTMLCanvasElement} canvas
 * @param {Object}  col
 * @param {Array}   logs
 * @param {Object}  opts
 * @param {boolean} opts.horizontal  true → indexAxis:'y' (breakdown), false → vertical (top-bar)
 * @param {number}  opts.limit       max entries to show
 */
export const buildBar = (canvas, col, logs, { horizontal = false, limit = THRESHOLDS.topBarLimit } = {}) => {
  const fm      = freqMap(logs, col.name)
  const entries = Object.entries(fm).sort((a, b) => b[1] - a[1]).slice(0, limit)
  const GRID    = getGrid()
  const TICK    = getTick()

  const colors = horizontal
    ? PALETTE.slice(0, entries.length)
    : 'rgba(55,138,221,0.7)'

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

// Convenience aliases kept for backwards-compat with any direct callers
export const buildBarBreakdown = (canvas, col, logs, limit) =>
  buildBar(canvas, col, logs, { horizontal: true, limit })

export const buildTopBar = (canvas, col, logs, limit) =>
  buildBar(canvas, col, logs, { horizontal: false, limit })

/** Timeline chart for date columns — last 30 days */
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
        label:              col.name,
        data:               counts,
        borderColor:        '#378ADD',
        backgroundColor:    'rgba(55,138,221,0.08)',
        tension:            0.4,
        pointRadius:        3,
        pointBackgroundColor: '#378ADD',
        fill:               true,
        borderWidth:        2,
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

/**
 * Wipe all keys from a canvasMap object in-place.
 * Call this at the start of every rebuild() so stale canvas refs
 * from the previous module/filter don't pollute the next render.
 */
export const clearCanvasMap = (canvasMap) => {
  Object.keys(canvasMap).forEach(k => delete canvasMap[k])
}

/* ─── MAIN COMPOSABLE ─────────────────────────────────── */

/**
 * useDynamicDashboard()
 *
 * @returns {
 *   analyse:     (columns, logs) => { chartMeta, numericStats }
 *   buildCharts: (chartMeta, logs, canvasMap, overrides?) => void
 *   destroyAll:  () => void
 * }
 *
 * overrides: { [colName]: 'doughnut'|'bar-breakdown'|'top-bar'|'timeline'|'skip' }
 *   Allows admins to override auto-detected chart types per column.
 */
export const useDynamicDashboard = () => {
  let activeCharts = []

  const destroyAll = () => {
    activeCharts.forEach(c => { try { c.destroy() } catch (_) {} })
    activeCharts = []
  }

  /**
   * Analyse columns + logs → return { chartMeta, numericStats }
   * chartMeta items: { col, chartType }
   * Caller must call buildCharts(canvasMap) after nextTick × 2.
   */
  const analyse = (columns, logs, overrides = {}) => {
    const chartMeta    = []
    const numericStats = []

    for (const col of columns) {
      // Admin override takes precedence
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

  /**
   * Mount all charts onto canvas elements.
   * canvasMap: { [colName]: HTMLCanvasElement }
   *
   * FIX: caller must await nextTick() TWICE before calling this so that
   * the Vue :ref callbacks have fired on the newly-rendered canvases.
   */
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