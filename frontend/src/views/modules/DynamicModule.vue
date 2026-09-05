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


        <button
          v-if="monitoringConfig?.enabled"
          class="btn-outline monitoring-top-btn"
          @click="showMonitoring = true"
          title="Open monitoring"
        >
          <span class="btn-icon-left">◉</span>
          Monitoring
        </button>

        <button
          v-if="upcomingConfig?.enabled"
          class="btn-outline upcoming-top-btn"
          @click="showUpcomingCenter = true"
          title="Upcoming alerts"
        >
          <span class="btn-icon-left">⏰</span>
          Upcoming
          <span v-if="upcomingItems.length" class="upcoming-count-badge">
            {{ upcomingItems.length }}
          </span>
        </button>

        <button class="btn-outline" @click="printLogs" title="Print logs">

          <span class="btn-icon-left">🖨</span> Print

        </button>

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

    <!-- ================= FILTER PANEL ================= -->

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

                      <input type="date" v-model="dateFilters[col.name].from" class="date-dropdown-input" :max="dateFilters[col.name].to || undefined" />

                    </div>

                    <div class="date-dropdown-field">

                      <label class="date-dropdown-label">To</label>

                      <input type="date" v-model="dateFilters[col.name].to" class="date-dropdown-input" :min="dateFilters[col.name].from || undefined" />

                    </div>

                  </div>

                  <div class="date-dropdown-footer">

                    <button class="btn-shortcut" @click="setToday(col.name)">Today</button>

                    <button class="btn-shortcut" @click="setThisMonth(col.name)">This month</button>

                  </div>

                </div>

              </div>

            </template>

            <!-- SELECT FILTER — options are now { label, color } objects -->

            <div v-else-if="col.type === 'select'" class="fl-wrap fl-select">

              <select

                v-model="activeFilters[col.name]"

                class="fl-input fl-input-select"

                :id="`filter-select-${col.name}`"

              >

                <option value="" disabled selected>All</option>

                <option

                  v-for="opt in normalizeOptions(col.options)"

                  :key="opt.label"

                  :value="opt.label"

                >{{ opt.label }}</option>

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

            <tr

              v-for="log in pagedLogs"

              :key="log.id"

              :class="{ 'row-new': isNewLog(log) }"

            >

              <td v-for="col in columns" :key="col.name">

                <!-- LINK column type -->

                <template v-if="col.type === 'link'">

                  <a

                    v-if="getValue(log, col.name) && getValue(log, col.name) !== '-'"

                    :href="(col.baseUrl || '') + getValue(log, col.name)"

                    target="_blank"

                    class="cell-link"

                  >{{ getValue(log, col.name) }}</a>

                  <span v-else class="cell-empty">—</span>

                </template>

                <!-- SELECT column type — colored badge -->

                <template v-else-if="col.type === 'select'">

                  <span

                    v-if="getValue(log, col.name) && getValue(log, col.name) !== '-'"

                    class="select-badge"

                    :style="getOptionStyle(col, getValue(log, col.name))"

                  >{{ getValue(log, col.name) }}</span>

                  <span v-else class="cell-empty">—</span>

                </template>

                <!-- ALL OTHER column types -->

                <template v-else>

                  <span v-if="getValue(log, col.name) !== '-'" class="cell-value">

                    {{ getValue(log, col.name) }}

                  </span>

                  <span v-else class="cell-empty">—</span>

                </template>

              </td>

              <td class="td-actions no-print">

                <button

                  v-if="docxTemplate"

                  class="action-btn"

                  @click="fillAndPrint(log)"

                  title="Fill & Print form"

                  :disabled="filling"

                >

                  <svg viewBox="0 0 16 16" fill="none" width="14" height="14">

                    <path d="M4 2h6l3 3v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1z" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/>

                    <path d="M6 9h4M6 11.5h4" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/>

                  </svg>

                </button>

                <button class="action-btn edit" @click="openEdit(log)" title="Edit">

                  <svg viewBox="0 0 16 16" fill="none" width="14" height="14">

                    <path d="M11 2l3 3-8 8H3v-3l8-8z" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/>

                  </svg>

                </button>

                <button class="action-btn danger" @click="askDelete(log)" title="Delete">

                  <svg viewBox="0 0 16 16" fill="none" width="14" height="14">

                    <path d="M2 4h12M5 4V2h6v2M6 7v5M10 7v5M3 4l1 9h8l1-9" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>

                  </svg>

                </button>

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

            <button v-if="p !== '...'" :class="['page-btn', { active: p === currentPage }]" @click="currentPage = p">{{ p }}</button>

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

            <!-- SELECT input -->

            <select

              v-if="col.type === 'select'"

              v-model="form[col.name]"

              :class="['form-input', { 'input-error': fieldErrors[col.name] }]"

            >

              <option value="" disabled selected>Select option</option>

              <option

                v-for="opt in normalizeOptions(col.options)"

                :key="opt.label"

                :value="opt.label"

              >{{ opt.label }}</option>

            </select>

            <!-- LINK input — plain text, user enters the value (e.g. ticket number) -->

            <input

              v-else-if="col.type === 'link'"

              v-model="form[col.name]"

              type="text"

              :class="['form-input', { 'input-error': fieldErrors[col.name] }]"

              :placeholder="`Enter ${col.name.toLowerCase()}`"

            />

            <!-- ALL OTHER inputs -->

            <input

              v-else

              v-model="form[col.name]"

              :type="inputType(col.type)"

              :class="['form-input', { 'input-error': fieldErrors[col.name] }]"

              :placeholder="col.type === 'date' || col.type === 'time' ? '' : `Enter ${col.name.toLowerCase()}`"

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

    <!-- =====================================================

     FILLED DOCX PRINT PREVIEW

\===================================================== -->

<div

  v-if="showDocxPreview"

  class="docx-preview-backdrop"

>

  <div class="docx-preview-modal">



    <!-- ================= HEADER ================= -->

    <div class="docx-preview-header">

      <div class="docx-preview-title">

        <h3>

          Print Preview

        </h3>

        <p>

          {{ generatedDocxName }}

        </p>

      </div>



      <button

        type="button"

        class="docx-preview-close"

        @click="closeDocxPreview"

        title="Close preview"

      >

        ✕

      </button>

    </div>



    <!-- ================= PREVIEW BODY ================= -->

    <div class="docx-preview-body">

      <div

        ref="docxPreviewContainer"

        class="docx-render-container"

      ></div>

    </div>



    <!-- ================= FOOTER ================= -->

    <div class="docx-preview-footer">

      <div class="docx-preview-info">

        Review the filled form before printing.

      </div>



      <div class="docx-preview-actions">

        <button

          type="button"

          class="btn-ghost"

          @click="closeDocxPreview"

        >

          Cancel

        </button>



        <button

          type="button"

          class="btn-outline"

          @click="downloadFilledDocx"

        >

          ↓ Download DOCX

        </button>



        <button

          type="button"

          class="btn-primary"

          @click="printFilledDocx"

        >

          <span class="btn-icon-left">

            🖨

          </span>

          Print

        </button>

      </div>

    </div>

  </div>

</div>

  

    <!-- ================= MONITORING POPUP ================= -->
    <div
      v-if="showMonitoring"
      class="monitoring-backdrop"
      @click.self="showMonitoring = false"
    >
      <div class="monitoring-modal">
        <div class="monitoring-modal-header">
          <div>
            <h3>{{ monitoringConfig?.title || 'Monitoring' }}</h3>
            <p>
              {{ monitoringRows.length }} tracked item(s)
            </p>
          </div>

          <button
            class="btn-ghost-sm"
            @click="showMonitoring = false"
            title="Close monitoring"
          >
            ✕
          </button>
        </div>

        <div class="monitoring-modal-body">
          <div v-if="monitoringRows.length === 0" class="monitoring-empty">
            <div class="monitoring-empty-icon">◉</div>
            <strong>No monitoring data yet</strong>
            <span>
              Add log records using the configured monitoring columns.
            </span>
          </div>

          <div v-else class="monitoring-table-wrap">
            <table class="monitoring-table">
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Last borrowed by</th>
                  <th>Current state</th>
                  <th>Borrow date</th>
                  <th>Return date</th>
                  <th v-if="monitoringConfig?.statusColumn">Status</th>
                </tr>
              </thead>

              <tbody>
                <tr
                  v-for="row in monitoringRows"
                  :key="row.item"
                >
                  <td>
                    <strong>{{ row.item }}</strong>
                  </td>

                  <td>{{ row.location }}</td>

                  <td>
                    <span
                      :class="[
                        'monitoring-state',
                        row.returned
                          ? 'monitoring-state-returned'
                          : 'monitoring-state-out'
                      ]"
                    >
                      {{
                        row.returned
                          ? 'Returned'
                          : ('With ' + row.location)
                      }}
                    </span>
                  </td>

                  <td>{{ formatMonitoringDate(row.borrowDate) }}</td>

                  <td>{{ formatMonitoringDate(row.returnDate) }}</td>

                  <td v-if="monitoringConfig?.statusColumn">
                    {{ row.status || '-' }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div class="monitoring-modal-footer">
          <span>
            Latest record is shown for each
            {{ monitoringConfig?.itemColumn || 'item' }}.
          </span>

          <button
            class="btn-primary"
            @click="showMonitoring = false"
          >
            Close
          </button>
        </div>
      </div>
    </div>

    <!-- ================= UPCOMING ALERT CENTER ================= -->
    <div
      v-if="showUpcomingCenter"
      class="upcoming-center-backdrop"
      @click.self="showUpcomingCenter = false"
    >
      <div class="upcoming-center-modal">
        <div class="upcoming-center-header">
          <div>
            <h3>{{ upcomingConfig?.title || 'Upcoming Alerts' }}</h3>
            <p>
              {{
                upcomingItems.length
                  ? upcomingItems.length + ' upcoming item(s)'
                  : 'No upcoming items in the reminder window'
              }}
            </p>
          </div>

          <button class="btn-ghost-sm" @click="showUpcomingCenter = false">
            ✕
          </button>
        </div>

        <div class="upcoming-center-body">
          <div v-if="upcomingItems.length === 0" class="upcoming-empty">
            <div class="upcoming-empty-icon">⏰</div>
            <strong>No upcoming alerts</strong>
            <span>
              Alerts appear here once a record enters the configured reminder window.
            </span>
          </div>

          <div
            v-for="item in upcomingItems"
            :key="item.key"
            class="upcoming-card"
          >
            <div class="upcoming-card-main">
              <div class="upcoming-card-title">{{ item.label }}</div>

              <div
                v-if="item.detail && item.detail !== '-'"
                class="upcoming-card-detail"
              >
                {{ item.detail }}
              </div>

              <div class="upcoming-card-date">
                Due:
                <strong>{{ formatUpcomingDate(item.eventDate) }}</strong>
              </div>
            </div>

            <div class="upcoming-card-time">
              <strong>{{ formatTimeRemaining(item.msRemaining) }}</strong>
              <span>remaining</span>
            </div>
          </div>
        </div>

        <div class="upcoming-center-footer">
          <span>Reminder: {{ upcomingLeadLabel }}</span>

          <button class="btn-primary" @click="showUpcomingCenter = false">
            Close
          </button>
        </div>
      </div>
    </div>

    <!-- ================= AUTOMATIC ALARM ================= -->
    <div v-if="activeUpcomingAlert" class="alarm-backdrop">
      <div class="alarm-modal">
        <div class="alarm-icon-wrap">⏰</div>

        <div class="alarm-content">
          <div class="alarm-eyebrow">Upcoming reminder</div>

          <h3>{{ upcomingConfig?.title || 'Upcoming Alert' }}</h3>

          <p class="alarm-item">{{ activeUpcomingAlert.label }}</p>

          <p
            v-if="activeUpcomingAlert.detail && activeUpcomingAlert.detail !== '-'"
            class="alarm-detail"
          >
            {{ activeUpcomingAlert.detail }}
          </p>

          <div class="alarm-due">
            Due
            <strong>
              {{ formatUpcomingDate(activeUpcomingAlert.eventDate) }}
            </strong>
          </div>

          <div class="alarm-remaining">
            {{ formatTimeRemaining(activeUpcomingAlert.msRemaining) }}
            remaining
          </div>
        </div>

        <div class="alarm-actions">
          <button class="btn-ghost" @click="dismissUpcomingAlert">
            Dismiss
          </button>

          <button class="btn-primary" @click="openUpcomingFromAlarm">
            View upcoming
          </button>
        </div>
      </div>
    </div>

</div>

</template>

<script setup>

import { ref, onMounted, onUnmounted, watch, computed, nextTick} from 'vue'

import { useRoute } from 'vue-router'

import api from '@/api/axios'

import PizZip from 'pizzip'

import Docxtemplater from 'docxtemplater'

import { saveAs } from 'file-saver'

import { renderAsync } from 'docx-preview'

const route = useRoute()

const module    = ref(null)

const columns   = ref([])

const logs      = ref([])

const showModal = ref(false)

const showDelete  = ref(false)

const showFilters = ref(false)

const isEdit      = ref(false)

const selectedId  = ref(null)

const form        = ref({})

const fieldErrors = ref({})

const searchQuery = ref('')

const activeFilters = ref({})

const dateFilters   = ref({})

const saving        = ref(false)

const filling       = ref(false)

const showDocxPreview = ref(false)

const docxPreviewContainer = ref(null)

const generatedDocxBlob = ref(null)

const generatedDocxName = ref('')

/* ================= UPCOMING ALERT STATE ================= */


const showMonitoring = ref(false)

const defaultMonitoringConfig = () => ({
  enabled: false,
  title: 'Monitoring',
  itemColumn: '',
  locationColumn: '',
  borrowDateColumn: '',
  returnDateColumn: '',
  statusColumn: '',
  autoOpen: false
})

const parseMonitoringConfig = (value) => {
  if (!value) return defaultMonitoringConfig()

  let parsed = value

  if (typeof value === 'string') {
    try {
      parsed = JSON.parse(value)
    } catch {
      parsed = {}
    }
  }

  return {
    ...defaultMonitoringConfig(),
    ...(parsed || {})
  }
}

const monitoringConfig = computed(() =>
  parseMonitoringConfig(module.value?.monitoringConfig)
)

const monitoringTimestamp = (value) => {
  if (!value || value === '-') return 0

  const raw = String(value).trim()

  const localDate = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (localDate) {
    return new Date(
      Number(localDate[1]),
      Number(localDate[2]) - 1,
      Number(localDate[3]),
      0, 0, 0, 0
    ).getTime()
  }

  const parsed = new Date(raw)
  const time = parsed.getTime()
  return Number.isNaN(time) ? 0 : time
}

const monitoringRows = computed(() => {
  const cfg = monitoringConfig.value

  if (!cfg?.enabled || !cfg.itemColumn) return []

  const latest = new Map()

  for (const log of logs.value || []) {
    const itemRaw = log?.data?.[cfg.itemColumn]
    const item = String(itemRaw ?? '').trim()

    if (!item) continue

    const borrowDate = cfg.borrowDateColumn
      ? log?.data?.[cfg.borrowDateColumn]
      : ''

    const timestamp =
      monitoringTimestamp(borrowDate) ||
      monitoringTimestamp(log?.createdAt) ||
      Number(log?.id || 0)

    const previous = latest.get(item)

    if (!previous || timestamp >= previous.timestamp) {
      const locationRaw = cfg.locationColumn
        ? log?.data?.[cfg.locationColumn]
        : ''

      const returnDate = cfg.returnDateColumn
        ? log?.data?.[cfg.returnDateColumn]
        : ''

      const statusRaw = cfg.statusColumn
        ? log?.data?.[cfg.statusColumn]
        : ''

      latest.set(item, {
        item,
        location: String(locationRaw ?? '').trim() || '-',
        borrowDate: borrowDate || '',
        returnDate: returnDate || '',
        status: String(statusRaw ?? '').trim(),
        returned: !!String(returnDate ?? '').trim(),
        timestamp
      })
    }
  }

  return Array.from(latest.values())
    .sort((a, b) => a.item.localeCompare(b.item))
})

const formatMonitoringDate = (value) => {
  if (!value || value === '-') return '-'

  const raw = String(value).trim()

  const localDate = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (localDate) {
    return `${localDate[2]}/${localDate[3]}/${localDate[1]}`
  }

  const parsed = new Date(raw)
  if (Number.isNaN(parsed.getTime())) return raw

  return parsed.toLocaleDateString()
}

const showUpcomingCenter = ref(false)
const activeUpcomingAlert = ref(null)
const notifiedUpcomingKeys = ref(new Set())
const dismissedUpcomingKeys = ref(new Set())
let upcomingCheckInterval = null

const defaultUpcomingConfig = () => ({
  enabled: false,
  title: 'Upcoming Reminder',
  dateColumn: '',
  timeColumn: '',
  defaultTime: '08:00',
  leadValue: 1,
  leadUnit: 'hours',
  labelColumn: '',
  detailColumn: '',
  autoPopup: true,
  browserNotification: false
})

const parseUpcomingConfig = (value) => {
  if (!value) return defaultUpcomingConfig()

  if (typeof value === 'object') {
    return {
      ...defaultUpcomingConfig(),
      ...value
    }
  }

  try {
    return {
      ...defaultUpcomingConfig(),
      ...JSON.parse(value)
    }
  } catch {
    return defaultUpcomingConfig()
  }
}

const upcomingConfig = computed(() =>
  parseUpcomingConfig(module.value?.upcomingConfig)
)

const upcomingLeadMinutes = computed(() => {
  const cfg = upcomingConfig.value
  const value = Math.max(1, Number(cfg.leadValue) || 1)

  if (cfg.leadUnit === 'days') return value * 1440
  if (cfg.leadUnit === 'hours') return value * 60
  return value
})

const upcomingLeadLabel = computed(() => {
  const cfg = upcomingConfig.value
  const value = Math.max(1, Number(cfg.leadValue) || 1)
  return `${value} ${cfg.leadUnit} before`
})


/* ================= SEEN TRACKING ================= */

// Timestamp recorded when this module was last opened.

// Used by the sidebar to determine how many logs are "new".

const SEEN_KEY = (id) => `imiss_last_seen_${id}`

/**

 * Call this whenever the user is actively viewing this module.

 * Records now as the last-seen timestamp so the sidebar badge clears.

 */

const markCurrentModuleSeen = () => {

  const id = route.params.id

  if (!id) return

  localStorage.setItem(SEEN_KEY(id), new Date().toISOString())

  // Let the sidebar know it can clear the badge for this module

  window.dispatchEvent(new CustomEvent('imiss:module-seen', { detail: { moduleId: id } }))

}

/* ================= NEW-ROW HIGHLIGHT ================= */

// Logs created after the previous visit get a subtle highlight.

const prevSeenTimestamp = ref(null)

const isNewLog = (log) => {

  if (!prevSeenTimestamp.value) return false

  const created = log.createdAt || log.created_at || log.timestamp

  return created && new Date(created) > prevSeenTimestamp.value

}

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

const clearSort = () => { sortKey.value = ''; sortDir.value = 'asc' }

/* ================= PAGINATION ================= */

const currentPage = ref(1)

const pageSize    = ref(25)

/* ================= TOAST ================= */

const toast = ref({ show: false, message: '', type: 'success' })

const showToast = (message, type = 'success') => {

  toast.value = { show: true, message, type }

  setTimeout(() => { toast.value.show = false }, 2500)

}

/* ================= HELPERS ================= */

const safeParse = (val) => {

  if (!val) return []

  if (typeof val === 'object') return val

  try { return JSON.parse(val) } catch { return [] }

}

const normalizeOptions = (options) => {

  if (!Array.isArray(options)) return []

  return options.map(o =>

    typeof o === 'object' && o !== null

      ? o

      : { label: String(o), color: '#6b7280' }

  )

}

const getOptionStyle = (col, value) => {

  const opts = normalizeOptions(col.options)

  const opt  = opts.find(o => o.label === value)

  const color = opt?.color || '#6b7280'

  return {

    background: color + '22',

    color:      color,

    border:     `1px solid ${color}55`,

  }

}


/* ================= DOCX TEMPLATE DETECTION ================= */

// Use the first DOCX template attached to this module.
// Case-insensitive so "DOCX", "Docx", and "docx" all work.
const docxTemplate = computed(() =>
  (module.value?.templates || []).find(
    t => String(t.kind || '').toLowerCase() === 'docx'
  )
)

// Must match the tag-sanitizing rule used in ManageModules.vue.
const toTag = (name) =>
  String(name || '').replace(/[^a-zA-Z0-9]/g, '')

/* ================= DOCX FILL & PREVIEW ================= */

const fillAndPrint = async (log) => {

  if (!docxTemplate.value) return

  filling.value = true

  try {

    /* -----------------------------------------

       1. DOWNLOAD ORIGINAL DOCX TEMPLATE

    ----------------------------------------- */

    const res = await api.get(

      `/modules/templates/${docxTemplate.value.id}/file`,

      {

        responseType: 'arraybuffer'

      }

    )

    /* -----------------------------------------

       2. LOAD TEMPLATE

    ----------------------------------------- */

    const zip = new PizZip(res.data)

    const doc = new Docxtemplater(zip, {

      paragraphLoop: true,

      linebreaks: true

    })

    /* -----------------------------------------

       3. BUILD TEMPLATE DATA

    ----------------------------------------- */

    const data = {}

    columns.value.forEach(col => {

      const val = getValue(log, col.name)

      data[toTag(col.name)] =

        val === '-' ? '' : val

    })

    /* -----------------------------------------

       4. FILL DOCX TEMPLATE

    ----------------------------------------- */

    doc.render(data)

    /* -----------------------------------------

       5. GENERATE FILLED DOCX

    ----------------------------------------- */

    const out = doc.getZip().generate({

      type: 'blob',

      mimeType:

        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'

    })

    generatedDocxBlob.value = out

    const safeName = (

      docxTemplate.value.name || 'Form'

    ).replace(/[^a-zA-Z0-9-_ ]/g, '')

    generatedDocxName.value =

      `${safeName}-${log.id}.docx`

    /* -----------------------------------------

       6. OPEN PREVIEW MODAL

    ----------------------------------------- */

    showDocxPreview.value = true

    await nextTick()

    /* -----------------------------------------

       7. CLEAR OLD PREVIEW

    ----------------------------------------- */

    if (docxPreviewContainer.value) {

      docxPreviewContainer.value.innerHTML = ''

    }

    /* -----------------------------------------

       8. RENDER DOCX

    ----------------------------------------- */

    await renderAsync(

      out,

      docxPreviewContainer.value,

      docxPreviewContainer.value,

      {

        className: 'docx',

        inWrapper: true,

        breakPages: true,

        ignoreWidth: false,

        ignoreHeight: false,

        ignoreFonts: false,

        renderHeaders: true,

        renderFooters: true,

        renderFootnotes: true,

        useBase64URL: true

      }

    )

  } catch (err) {

    console.error('DOCX preview error:', err)

    showToast(

      'Failed to generate document preview',

      'error'

    )

    showDocxPreview.value = false

  } finally {

    filling.value = false

  }

}

/* ================= DOWNLOAD FILLED DOCX ================= */

const downloadFilledDocx = () => {

  if (!generatedDocxBlob.value) return

  saveAs(

    generatedDocxBlob.value,

    generatedDocxName.value || 'document.docx'

  )

}



/* ================= CLOSE DOCX PREVIEW ================= */

const closeDocxPreview = () => {

  showDocxPreview.value = false

  generatedDocxBlob.value = null

  generatedDocxName.value = ''

  if (docxPreviewContainer.value) {

    docxPreviewContainer.value.innerHTML = ''

  }

}



/* ================= PRINT DOCX PREVIEW ================= */

const printFilledDocx = () => {

  const container = docxPreviewContainer.value

  if (!container) return

  const printWindow = window.open(

    '',

    '_blank',

    'width=1000,height=800'

  )

  if (!printWindow) {

    showToast(

      'Please allow pop-ups to print the document',

      'error'

    )

    return

  }

  /*

   * Copy styles generated by docx-preview.

   */

  const styles = Array.from(

    document.querySelectorAll('style')

  )

    .map(style => style.outerHTML)

    .join('\n')

  printWindow.document.write(`

    <!DOCTYPE html>

    <html>

      <head>

        <meta charset="UTF-8">

        <title>

          ${generatedDocxName.value || 'Document'}

        </title>

        ${styles}

        <style>

          html,

          body {

            margin: 0;

            padding: 0;

            background: white !important;

          }

          body {

            display: block !important;

          }

          .docx-wrapper {

            background: white !important;

            padding: 0 !important;

          }

          .docx-wrapper > section.docx {

            margin: 0 auto !important;

            box-shadow: none !important;

          }

          @media print {

            body {

              background: white !important;

            }

            .docx-wrapper {

              background: white !important;

              padding: 0 !important;

            }

            .docx-wrapper > section.docx {

              box-shadow: none !important;

              margin: 0 auto !important;

            }

          }

        </style>

      </head>

      <body>

        ${container.innerHTML}

      </body>

    </html>

  `)

  printWindow.document.close()

  printWindow.focus()

  printWindow.onload = () => {

    setTimeout(() => {

      printWindow.print()

    }, 300)

  }

}


/* =========================================================
   UPCOMING ALERT LOGIC
========================================================= */

const parseUpcomingDateTime = (log) => {
  const cfg = upcomingConfig.value

  if (!cfg.enabled || !cfg.dateColumn) return null

  const rawDate = getValue(log, cfg.dateColumn)

  if (!rawDate || rawDate === '-') return null

  const dateText = String(rawDate).trim()

  let timeText = ''

  if (cfg.timeColumn) {
    const rawTime = getValue(log, cfg.timeColumn)

    if (rawTime && rawTime !== '-') {
      timeText = String(rawTime).trim()
    }
  }

  if (!timeText) {
    timeText = cfg.defaultTime || '08:00'
  }

  const dateMatch = dateText.match(/^(\d{4})-(\d{2})-(\d{2})/)
  const timeMatch = timeText.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?/)

  if (dateMatch) {
    const [, y, m, d] = dateMatch

    const hh = timeMatch ? Number(timeMatch[1]) : 8
    const mm = timeMatch ? Number(timeMatch[2]) : 0
    const ss = timeMatch ? Number(timeMatch[3] || 0) : 0

    const result = new Date(
      Number(y),
      Number(m) - 1,
      Number(d),
      hh,
      mm,
      ss,
      0
    )

    return isNaN(result.getTime()) ? null : result
  }

  const fallback = new Date(`${dateText} ${timeText}`)

  return isNaN(fallback.getTime()) ? null : fallback
}

const upcomingItems = computed(() => {
  const cfg = upcomingConfig.value

  if (!cfg.enabled || !cfg.dateColumn) return []

  const now = Date.now()
  const leadMs = upcomingLeadMinutes.value * 60 * 1000

  return logs.value
    .map(log => {
      const eventDate = parseUpcomingDateTime(log)

      if (!eventDate) return null

      const eventMs = eventDate.getTime()
      const msRemaining = eventMs - now

      if (msRemaining < 0 || msRemaining > leadMs) {
        return null
      }

      const rawLabel = cfg.labelColumn
        ? getValue(log, cfg.labelColumn)
        : ''

      const rawDetail = cfg.detailColumn
        ? getValue(log, cfg.detailColumn)
        : ''

      const label =
        rawLabel && rawLabel !== '-'
          ? rawLabel
          : `${module.value?.name || 'Record'} #${log.id}`

      return {
        key: `${route.params.id}:${log.id}:${eventMs}`,
        logId: log.id,
        label,
        detail: rawDetail,
        eventDate,
        eventMs,
        msRemaining
      }
    })
    .filter(Boolean)
    .sort((a, b) => a.eventMs - b.eventMs)
})

const formatUpcomingDate = (date) => {
  if (!date) return '—'

  return new Intl.DateTimeFormat(
    'en-PH',
    {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    }
  ).format(date)
}

const formatTimeRemaining = (ms) => {
  const totalMinutes = Math.max(
    0,
    Math.ceil(ms / 60000)
  )

  if (totalMinutes < 60) {
    return `${totalMinutes} min`
  }

  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60

  if (hours < 24) {
    return minutes
      ? `${hours}h ${minutes}m`
      : `${hours}h`
  }

  const days = Math.floor(hours / 24)
  const remainingHours = hours % 24

  return remainingHours
    ? `${days}d ${remainingHours}h`
    : `${days}d`
}

const requestUpcomingNotificationPermission = async () => {
  const cfg = upcomingConfig.value

  if (
    !cfg.enabled ||
    !cfg.browserNotification ||
    typeof Notification === 'undefined'
  ) {
    return
  }

  if (Notification.permission === 'default') {
    try {
      await Notification.requestPermission()
    } catch (err) {
      console.warn('Notification permission error:', err)
    }
  }
}

const sendBrowserUpcomingNotification = (item) => {
  const cfg = upcomingConfig.value

  if (
    !cfg.browserNotification ||
    typeof Notification === 'undefined' ||
    Notification.permission !== 'granted' ||
    notifiedUpcomingKeys.value.has(item.key)
  ) {
    return
  }

  try {
    new Notification(
      cfg.title || 'Upcoming Reminder',
      {
        body:
          `${item.label}` +
          (
            item.detail && item.detail !== '-'
              ? ` — ${item.detail}`
              : ''
          ) +
          `\nDue: ${formatUpcomingDate(item.eventDate)}`,
        tag: item.key
      }
    )

    notifiedUpcomingKeys.value.add(item.key)

  } catch (err) {
    console.warn('Browser notification failed:', err)
  }
}

const checkUpcomingAlerts = () => {
  const cfg = upcomingConfig.value

  if (!cfg.enabled) {
    activeUpcomingAlert.value = null
    return
  }

  const nextAlert = upcomingItems.value.find(
    item => !dismissedUpcomingKeys.value.has(item.key)
  )

  if (!nextAlert) return

  sendBrowserUpcomingNotification(nextAlert)

  if (cfg.autoPopup && !activeUpcomingAlert.value) {
    activeUpcomingAlert.value = {
      ...nextAlert
    }
  }
}

const dismissUpcomingAlert = () => {
  if (activeUpcomingAlert.value?.key) {
    dismissedUpcomingKeys.value.add(
      activeUpcomingAlert.value.key
    )
  }

  activeUpcomingAlert.value = null
}

const openUpcomingFromAlarm = () => {
  dismissUpcomingAlert()
  showUpcomingCenter.value = true
}

const stopUpcomingAlertWatcher = () => {
  if (upcomingCheckInterval) {
    clearInterval(upcomingCheckInterval)
    upcomingCheckInterval = null
  }
}

const startUpcomingAlertWatcher = () => {
  stopUpcomingAlertWatcher()

  requestUpcomingNotificationPermission()
  checkUpcomingAlerts()

  upcomingCheckInterval = setInterval(
    checkUpcomingAlerts,
    30000
  )
}

/* ================= DEBOUNCE ================= */

const debounce = (fn, delay) => {

  let timer = null

  return (...args) => { clearTimeout(timer); timer = setTimeout(() => fn(...args), delay) }

}

const debouncedSearch  = ref('')

const debouncedFilters = ref({})

const debouncedDates   = ref({})

const applyDebounced = debounce(() => {

  debouncedSearch.value  = searchQuery.value

  debouncedFilters.value = { ...activeFilters.value }

  debouncedDates.value   = JSON.parse(JSON.stringify(dateFilters.value))

  currentPage.value = 1

}, 300)

watch([searchQuery, activeFilters, dateFilters], applyDebounced, { deep: true })

/* ================= DATE PICKER ================= */

const openDatePicker = ref(null)

const todayStr = () => new Date().toISOString().slice(0, 10)

const toggleDatePicker = (colName) => {

  openDatePicker.value = openDatePicker.value === colName ? null : colName

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

  const y   = now.getFullYear()

  const m   = String(now.getMonth() + 1).padStart(2, '0')

  const lastDay = new Date(y, now.getMonth() + 1, 0).getDate()

  dateFilters.value[colName].from = `${y}-${m}-01`

  dateFilters.value[colName].to   = `${y}-${m}-${lastDay}`

  currentPage.value = 1

}

const dateRangeLabel = (colName) => {

  const { from, to } = dateFilters.value[colName] || {}

  if (from && to) return `${from} → ${to}`

  if (from)       return `From ${from}`

  if (to)         return `Until ${to}`

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

  debouncedFilters.value = { ...activeFilters.value }

  debouncedDates.value   = JSON.parse(JSON.stringify(dateFilters.value))

  debouncedSearch.value  = ''

}

/* ================= LOAD MODULE ================= */

const loadModule = async () => {

  const res = await api.get(`/modules/single/${route.params.id}`)

  module.value = res.data

  const parsedColumns = safeParse(res.data.columns)

  columns.value = parsedColumns.map(col => ({

    ...col,

    options: typeof col.options === 'string' ? safeParse(col.options) : (col.options || []),

    baseUrl: col.baseUrl || ''

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

      const colName = v.column?.name ?? v.column_name ?? v.column

      if (colName && typeof colName === 'string') data[colName] = v.value

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

  // Snapshot the previous last-seen time BEFORE we mark as seen,

  // so we can highlight new rows during this session.

  const raw = localStorage.getItem(SEEN_KEY(route.params.id))

  prevSeenTimestamp.value = raw ? new Date(raw) : null

  await loadModule()

  await loadLogs()

  notifiedUpcomingKeys.value = new Set()
  dismissedUpcomingKeys.value = new Set()
  activeUpcomingAlert.value = null

  startUpcomingAlertWatcher()

  if (monitoringConfig.value?.enabled && monitoringConfig.value?.autoOpen) {
    await nextTick()
    showMonitoring.value = true
  }

  // Mark as seen now that we've loaded

  markCurrentModuleSeen()

}

/* ================= POLLING ================= */

let pollInterval = null

const startPolling = () => {

  pollInterval = setInterval(async () => {

    if (document.hidden) return

    try {

      const res = await api.get(`/logs/module/${route.params.id}`)

      logs.value = res.data.map(normalizeLog)

      // Keep refreshing the seen timestamp while the user is actively on this page

      markCurrentModuleSeen()

    } catch (err) {

      console.error('Poll error:', err)

    }

  }, 5000)

}

const stopPolling = () => {

  if (pollInterval) { clearInterval(pollInterval); pollInterval = null }

}

/* ================= GET VALUE ================= */

const getValue = (log, columnName) => log.data?.[columnName] ?? '-'

/* ================= FILTERS ================= */

const activeFilterCount = computed(() => {

  let count = 0

  if (searchQuery.value) count++

  Object.values(activeFilters.value).forEach(v => { if (v && v !== 'all') count++ })

  Object.values(dateFilters.value).forEach(df => { if (df.from || df.to) count++ })

  return count

})

const hasActiveFilters = computed(() => activeFilterCount.value > 0)

const clearFilters = () => {

  searchQuery.value = ''

  initFilters()

  debouncedSearch.value  = ''

  debouncedFilters.value = {}

  debouncedDates.value   = {}

  currentPage.value = 1

}

const parseDate = (val) => {

  if (!val) return null

  const d = new Date(val)

  return isNaN(d) ? null : d

}

const filteredLogs = computed(() => {

  const base = logs.value.filter(log => {

    const matchesSearch = !debouncedSearch.value ||

      Object.values(log.data || {}).join(' ').toLowerCase().includes(debouncedSearch.value.toLowerCase())

    const matchesFilters = Object.entries(debouncedFilters.value).every(([key, value]) => {

      if (!value || value === 'all') return true

      return String(getValue(log, key)).toLowerCase().includes(String(value).toLowerCase())

    })

    const matchesDates = Object.entries(debouncedDates.value).every(([key, range]) => {

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

    if (col?.type === 'int')  return (Number(aVal) - Number(bVal)) * dir

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

  if (cur <= 4)          return [1, 2, 3, 4, 5, '...', total]

  if (cur >= total - 3)  return [1, '...', total - 4, total - 3, total - 2, total - 1, total]

  return [1, '...', cur - 1, cur, cur + 1, '...', total]

})

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

  isEdit.value      = false

  selectedId.value  = null

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

    markCurrentModuleSeen()

    showToast(isEdit.value ? 'Log updated' : 'Log added', 'success')

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

      .map(([key, df]) => `${key}: ${df.from || '—'} → ${df.to || '—'}`)

      .join('  |  ')

    const moduleName = module.value?.name || 'Module'

    const printDate  = new Date().toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' })

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

      <!DOCTYPE html><html><head>

        <title>${moduleName} — Logs</title>

        <style>

          * { margin: 0; padding: 0; box-sizing: border-box; }

          body { font-family: 'Segoe UI', Arial, sans-serif; color: #111; padding: 24px; }

          .print-header { margin-bottom: 18px; border-bottom: 2px solid #111827; padding-bottom: 12px; }

          .print-header h1 { font-size: 20px; font-weight: 700; }

          .print-meta { display: flex; gap: 24px; margin-top: 6px; font-size: 12px; color: #555; flex-wrap: wrap; }

          table { width: 100%; border-collapse: collapse; font-size: 12px; }

          thead { background: #111827; color: white; }

          th { padding: 9px 12px; text-align: left; font-weight: 600; letter-spacing: 0.03em; }

          td { padding: 8px 12px; border-bottom: 1px solid #e5e7eb; }

          tbody tr:nth-child(even) { background: #f9fafb; }

          .footer { margin-top: 16px; font-size: 11px; color: #9ca3af; text-align: right; }

          @media print { body { padding: 0; } @page { margin: 15mm; } }

        </style>

      </head><body>

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

        <table><thead><tr>${colHeaders}</tr></thead><tbody>${rows}</tbody></table>

        <div class="footer">Generated from ${moduleName} Log System</div>

        <script>window.onload = () => { window.print(); }<\/script>

      </body></html>

    `)

    win.document.close()

  }

/* ================= INIT ================= */

onMounted(async () => {

  await loadAll()

  startPolling()

})

onUnmounted(() => {
  stopPolling()
  stopUpcomingAlertWatcher()
})

watch(() => route.params.id, async (newId, oldId) => {

  if (newId && newId !== oldId) {

    stopPolling()
    stopUpcomingAlertWatcher()

    await loadAll()

    startPolling()

  }

})

</script>

<style scoped>

.page { padding: 24px; background: #f6f8fb; min-height: 100vh; font-family: Inter, Arial, sans-serif; color: #111827; box-sizing: border-box; }

/* ===== NEW ROW HIGHLIGHT ===== */

.row-new {

  background: #f0fdf4 !important;

  animation: row-fade-in 1.5s ease forwards;

}

.row-new td:first-child {

  border-left: 3px solid #22c55e;

}

@keyframes row-fade-in {

  0%   { background: #dcfce7; }

  100% { background: #f0fdf4; }

}

/* ===== TOAST ===== */

.toast { position: fixed; top: 20px; right: 20px; display: flex; align-items: center; gap: 8px; padding: 10px 16px; border-radius: 10px; color: white; font-size: 13px; font-weight: 500; z-index: 9999; box-shadow: 0 4px 16px rgba(0,0,0,0.15); }

.toast.success { background: #22c55e; }

.toast.error   { background: #ef4444; }

.toast-icon { font-size: 14px; }

.toast-slide-enter-active, .toast-slide-leave-active { transition: all 0.25s ease; }

.toast-slide-enter-from, .toast-slide-leave-to { opacity: 0; transform: translateY(-8px); }

/* ===== TOPBAR ===== */

.topbar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }

.topbar h1 { font-size: 20px; font-weight: 600; margin: 0; }

.topbar p  { font-size: 13px; color: #6b7280; margin: 2px 0 0; }

.topbar-actions { display: flex; gap: 8px; align-items: center; }

/* ===== BUTTONS ===== */

.btn-primary { background: #111827; color: white; border: none; padding: 9px 16px; border-radius: 10px; font-size: 13px; font-weight: 500; cursor: pointer; display: inline-flex; align-items: center; gap: 6px; transition: background 0.15s; }

.btn-primary:hover    { background: #1f2937; }

.btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }

.btn-outline { background: white; color: #374151; border: 1px solid #e5e7eb; padding: 9px 16px; border-radius: 10px; font-size: 13px; font-weight: 500; cursor: pointer; display: inline-flex; align-items: center; gap: 6px; transition: all 0.15s; }

.btn-outline:hover { background: #f9fafb; border-color: #d1d5db; }

.btn-filter { background: white; color: #374151; border: 1px solid #e5e7eb; padding: 9px 16px; border-radius: 10px; font-size: 13px; font-weight: 500; cursor: pointer; display: inline-flex; align-items: center; gap: 6px; transition: all 0.15s; }

.btn-filter:hover { background: #f9fafb; border-color: #d1d5db; }

.btn-filter.active { background: #eff6ff; border-color: #bfdbfe; color: #1d4ed8; }

.filter-badge { display: inline-flex; align-items: center; justify-content: center; min-width: 18px; height: 18px; padding: 0 4px; border-radius: 99px; background: #1d4ed8; color: white; font-size: 10px; font-weight: 700; }

.btn-ghost { background: transparent; border: 1px solid #e5e7eb; color: #6b7280; padding: 8px 14px; border-radius: 10px; font-size: 13px; cursor: pointer; transition: all 0.15s; }

.btn-ghost:hover { background: #f3f4f6; }

.btn-ghost-sm { background: transparent; border: 1px solid #e5e7eb; color: #6b7280; font-size: 12px; cursor: pointer; padding: 6px 12px; border-radius: 8px; transition: all 0.15s; }

.btn-ghost-sm:hover { background: #f3f4f6; color: #374151; }

.btn-danger { background: #ef4444; color: white; border: none; padding: 9px 16px; border-radius: 10px; font-size: 13px; cursor: pointer; transition: background 0.15s; }

.btn-danger:hover { background: #dc2626; }

.btn-clear { background: transparent; border: 1px solid #fca5a5; color: #ef4444; padding: 6px 12px; border-radius: 8px; font-size: 12px; cursor: pointer; white-space: nowrap; transition: all 0.15s; }

.btn-clear:hover { background: #fee2e2; }

.btn-icon-left { font-size: 16px; line-height: 1; }

/* ===== FILTER PANEL ===== */

.filter-bar-panel { background: white; border: 1px solid #eef2f7; border-radius: 14px; padding: 14px 16px 12px; margin-bottom: 16px; }

.filter-slide-enter-active, .filter-slide-leave-active { transition: all 0.2s ease; overflow: hidden; }

.filter-slide-enter-from, .filter-slide-leave-to { opacity: 0; transform: translateY(-6px); }

.filter-bar { display: flex; align-items: flex-end; gap: 8px; flex-wrap: wrap; }

.filter-bar > * { flex: 1 1 140px; }

.filter-footer { display: flex; justify-content: flex-end; align-items: center; gap: 8px; margin-top: 12px; padding-top: 10px; border-top: 1px solid #f1f5f9; }

/* ===== FLOATING LABEL ===== */

.fl-wrap { position: relative; display: flex; flex-direction: column; justify-content: flex-end; }

.fl-input { height: 44px; padding: 16px 10px 4px; border: 1px solid #e5e7eb; border-radius: 8px; font-size: 13px; color: #111827; background: white; outline: none; transition: border-color 0.15s, box-shadow 0.15s; width: 100%; box-sizing: border-box; appearance: auto; }

.fl-input:focus { border-color: #3b82f6; box-shadow: 0 0 0 3px rgba(59,130,246,0.1); }

.fl-label { position: absolute; left: 10px; top: 50%; transform: translateY(-50%); font-size: 13px; color: #9ca3af; pointer-events: none; transition: all 0.2s ease; white-space: nowrap; }

.fl-wrap .fl-input:focus \~ .fl-label,

.fl-wrap .fl-input:not(:placeholder-shown) \~ .fl-label { top: 6px; transform: translateY(0); font-size: 10px; font-weight: 500; color: #3b82f6; letter-spacing: 0.03em; }

.fl-label-select { top: 6px; transform: translateY(0); font-size: 10px; font-weight: 500; color: #6b7280; letter-spacing: 0.03em; }

.fl-search { min-width: 0; flex: 2 1 200px; }

.search-icon { position: absolute; left: 10px; bottom: 11px; color: #9ca3af; font-size: 16px; pointer-events: none; z-index: 1; }

.fl-search:focus-within .search-icon { color: #3b82f6; }

.search-input { height: 44px; padding: 16px 10px 4px 30px; border: 1px solid #e5e7eb; border-radius: 8px; font-size: 13px; color: #111827; background: white; outline: none; transition: border-color 0.15s, box-shadow 0.15s; width: 100%; box-sizing: border-box; }

.search-input:focus { border-color: #3b82f6; box-shadow: 0 0 0 3px rgba(59,130,246,0.1); }

.search-label { left: 30px; }

.fl-search .search-input:focus \~ .search-label,

.fl-search .search-input:not(:placeholder-shown) \~ .search-label { top: 6px; transform: translateY(0); font-size: 10px; font-weight: 500; color: #3b82f6; letter-spacing: 0.03em; }

.fl-clear-btn { position: absolute; right: 8px; bottom: 10px; background: none; border: none; cursor: pointer; font-size: 11px; color: #9ca3af; line-height: 1; padding: 2px; display: flex; align-items: center; transition: color 0.15s; z-index: 2; }

.fl-clear-btn:hover { color: #ef4444; }

.fl-input-select { appearance: none; padding-right: 28px; }

.select-icon-btn, .select-caret { position: absolute; right: 8px; bottom: 10px; pointer-events: none; font-size: 11px; color: #9ca3af; line-height: 1; }

.select-icon-btn { pointer-events: all; background: none; border: none; cursor: pointer; padding: 2px; display: flex; align-items: center; transition: color 0.15s; z-index: 2; }

.select-icon-btn:hover { color: #ef4444; }

/* ===== DATE PICKER ===== */

.date-picker-wrap { position: relative; display: flex; flex-direction: column; gap: 4px; min-width: 0; }

.fl-label-static { font-size: 10px; font-weight: 500; color: #6b7280; letter-spacing: 0.03em; padding-left: 2px; }

.date-trigger { height: 44px; padding: 0 10px; border: 1px solid #e5e7eb; border-radius: 8px; background: white; color: #111827; font-size: 13px; cursor: pointer; display: flex; align-items: center; gap: 6px; width: 100%; text-align: left; transition: border-color 0.15s, box-shadow 0.15s; }

.date-trigger:hover { border-color: #d1d5db; background: #f9fafb; }

.date-trigger.active { border-color: #3b82f6; box-shadow: 0 0 0 3px rgba(59,130,246,0.1); color: #1d4ed8; }

.date-trigger-label { flex: 1; font-size: 12px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

.date-trigger-caret { font-size: 11px; color: #9ca3af; flex-shrink: 0; }

.date-trigger-clear { font-size: 11px; color: #9ca3af; flex-shrink: 0; line-height: 1; transition: color 0.15s; }

.date-trigger-clear:hover { color: #ef4444; }

.date-dropdown { position: absolute; top: calc(100% + 4px); left: 0; z-index: 100; background: white; border: 1px solid #e5e7eb; border-radius: 10px; padding: 12px; box-shadow: 0 8px 24px rgba(0,0,0,0.1); min-width: 260px; display: flex; flex-direction: column; gap: 10px; }

.date-dropdown-row { display: flex; gap: 8px; }

.date-dropdown-field { flex: 1; display: flex; flex-direction: column; gap: 4px; }

.date-dropdown-label { font-size: 10px; font-weight: 500; color: #6b7280; letter-spacing: 0.03em; }

.date-dropdown-input { height: 36px; padding: 0 8px; border: 1px solid #e5e7eb; border-radius: 7px; font-size: 12px; color: #111827; background: white; outline: none; width: 100%; box-sizing: border-box; transition: border-color 0.15s; }

.date-dropdown-input:focus { border-color: #3b82f6; box-shadow: 0 0 0 3px rgba(59,130,246,0.1); }

.date-dropdown-footer { display: flex; gap: 6px; padding-top: 8px; border-top: 1px solid #f1f5f9; }

.btn-shortcut { flex: 1; background: #f3f4f6; border: 1px solid #e5e7eb; color: #374151; padding: 5px 0; border-radius: 6px; font-size: 11px; font-weight: 500; cursor: pointer; transition: all 0.15s; }

.btn-shortcut:hover { background: #e5e7eb; }

/* ===== PANEL / TABLE ===== */

.panel { background: white; border: 1px solid #eef2f7; border-radius: 14px; overflow: hidden; }

.table-wrapper { overflow-x: auto; }

.table { width: 100%; border-collapse: collapse; min-width: 500px; }

.table thead { background: #111827; }

.table th { padding: 13px 16px; text-align: left; font-size: 12px; font-weight: 600; color: white; letter-spacing: 0.04em; }

.sortable-th { cursor: pointer; user-select: none; transition: background 0.15s; }

.sortable-th:hover { background: #1f2937; }

.th-inner { display: flex; align-items: center; gap: 6px; }

.sort-icon { display: inline-flex; flex-direction: column; gap: 1px; margin-left: 2px; line-height: 1; }

.sort-arrow { font-size: 8px; opacity: 0.25; transition: opacity 0.15s; line-height: 1; }

.sort-arrow.active { opacity: 1; color: #60a5fa; }

.th-actions { text-align: right; }

.req-dot { color: #f87171; font-size: 14px; line-height: 1; }

.table td { padding: 12px 16px; border-bottom: 1px solid #f1f5f9; font-size: 13px; color: #374151; }

.table tbody tr:last-child td { border-bottom: none; }

.table tbody tr:hover { background: #f8fafc; }

.td-actions { display: flex; justify-content: flex-end; gap: 4px; padding-right: 12px; }

.cell-value { color: #111827; }

.cell-empty { color: #d1d5db; }

/* ===== LINK CELL ===== */

.cell-link { color: #2563eb; font-weight: 500; text-decoration: none; border-bottom: 1px dashed #93c5fd; transition: color 0.15s, border-color 0.15s; }

.cell-link:hover { color: #1d4ed8; border-bottom-color: #1d4ed8; }

/* ===== SELECT BADGE ===== */

.select-badge { display: inline-block; padding: 3px 10px; border-radius: 99px; font-size: 11px; font-weight: 600; white-space: nowrap; }

/* ===== ACTION BUTTONS ===== */

.action-btn {

  width: 30px;

  height: 30px;

  border-radius: 7px;

  border: 1px solid transparent;

  background: transparent;

  color: #9ca3af;

  cursor: pointer;

  display: inline-flex;

  align-items: center;

  justify-content: center;

  transition: all 0.15s;

  flex-shrink: 0;

}

.action-btn:hover        { background: #f3f4f6; color: #374151; border-color: #e5e7eb; }

.action-btn.edit:hover   { background: #eff6ff; color: #1d4ed8; border-color: #bfdbfe; }

.action-btn.danger:hover { background: #fef2f2; color: #dc2626; border-color: #fecaca; }

.action-btn:disabled     { opacity: 0.4; cursor: not-allowed; }

/* ===== EMPTY / PLACEHOLDER ===== */

.empty-row td { text-align: center; padding: 40px 0; }

.empty-state { color: #9ca3af; }

.empty-icon { font-size: 28px; opacity: 0.3; margin-bottom: 8px; }

.empty-state p { font-size: 13px; margin: 0; }

.placeholder-panel { display: flex; align-items: center; justify-content: center; min-height: 200px; border: 1px dashed #e5e7eb !important; background: #fafafa !important; }

.placeholder-content { text-align: center; color: #9ca3af; }

.placeholder-icon { font-size: 28px; opacity: 0.3; margin-bottom: 8px; }

.placeholder-content p { font-size: 13px; margin: 0; }

/* ===== PAGINATION ===== */

.pagination-bar { display: flex; justify-content: space-between; align-items: center; padding: 12px 16px; border-top: 1px solid #f1f5f9; background: #fafafa; flex-wrap: wrap; gap: 8px; }

.pagination-info { font-size: 12px; color: #6b7280; display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }

.sort-badge { display: inline-flex; align-items: center; gap: 4px; background: #eff6ff; border: 1px solid #bfdbfe; color: #1d4ed8; border-radius: 99px; padding: 2px 8px; font-size: 11px; font-weight: 500; }

.btn-clear-sort { background: none; border: none; color: #93c5fd; cursor: pointer; font-size: 10px; padding: 0 2px; line-height: 1; display: inline-flex; align-items: center; transition: color 0.15s; }

.btn-clear-sort:hover { color: #1d4ed8; }

.pagination-controls { display: flex; align-items: center; gap: 4px; flex-wrap: wrap; }

.page-size-select { height: 32px; padding: 0 8px; border: 1px solid #e5e7eb; border-radius: 7px; font-size: 12px; color: #374151; background: white; outline: none; cursor: pointer; margin-right: 6px; }

.page-btn { min-width: 32px; height: 32px; padding: 0 6px; border: 1px solid #e5e7eb; border-radius: 7px; background: white; color: #374151; font-size: 13px; cursor: pointer; display: inline-flex; align-items: center; justify-content: center; transition: all 0.15s; }

.page-btn:hover:not(:disabled) { background: #f3f4f6; border-color: #d1d5db; }

.page-btn.active { background: #111827; color: white; border-color: #111827; font-weight: 600; }

.page-btn:disabled { opacity: 0.35; cursor: not-allowed; }

.page-ellipsis { font-size: 13px; color: #9ca3af; padding: 0 4px; line-height: 32px; }

/* ===== MODAL ===== */

.modal-backdrop { position: fixed; inset: 0; background: rgba(0,0,0,0.4); display: flex; justify-content: center; align-items: flex-start; overflow-y: auto; padding: 40px 16px; z-index: 9999; }

.modal { background: white; border-radius: 16px; width: 480px; max-width: 100%; overflow: hidden; box-shadow: 0 20px 60px rgba(0,0,0,0.2); }

.modal-header { display: flex; justify-content: space-between; align-items: flex-start; padding: 18px 20px; border-bottom: 1px solid #eef2f7; }

.modal-header h3 { margin: 0; font-size: 15px; font-weight: 600; color: #111827; }

.modal-header p  { margin: 4px 0 0; font-size: 12px; color: #9ca3af; }

.danger-header h3 { color: #dc2626; }

.modal-body { padding: 18px 20px; display: flex; flex-direction: column; gap: 14px; max-height: 55vh; overflow-y: auto; }

.delete-msg { font-size: 13px; color: #374151; margin: 0; }

.modal-footer { display: flex; justify-content: flex-end; gap: 8px; padding: 14px 20px; border-top: 1px solid #eef2f7; background: #fafafa; }

/* ===== FORM ===== */

.form-group { display: flex; flex-direction: column; gap: 5px; }

.form-label { font-size: 12px; color: #6b7280; font-weight: 500; display: flex; align-items: center; gap: 2px; }

.required-star { color: #ef4444; font-size: 13px; }

.form-input { width: 100%; padding: 9px 12px; border: 1px solid #e5e7eb; border-radius: 10px; font-size: 13px; color: #111827; background: white; outline: none; box-sizing: border-box; transition: border-color 0.15s; }

.form-input:focus { border-color: #3b82f6; box-shadow: 0 0 0 3px rgba(59,130,246,0.1); }

.form-input.input-error { border-color: #ef4444; background: #fff5f5; }

.form-input.input-error:focus { box-shadow: 0 0 0 3px rgba(239,68,68,0.1); }

.error-msg { font-size: 11px; color: #ef4444; font-weight: 500; }


/* =========================================================
   UPCOMING ALERTS
========================================================= */

.upcoming-top-btn {
  position: relative;
}

.upcoming-count-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 18px;
  height: 18px;
  padding: 0 5px;
  margin-left: 2px;
  border-radius: 99px;
  background: #f59e0b;
  color: white;
  font-size: 10px;
  font-weight: 700;
}

.upcoming-center-backdrop {
  position: fixed;
  inset: 0;
  z-index: 10800;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding: 40px 18px;
  background: rgba(17,24,39,.58);
}

.upcoming-center-modal {
  width: min(820px, 100%);
  max-height: calc(100vh - 80px);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: white;
  border-radius: 16px;
  box-shadow: 0 24px 70px rgba(0,0,0,.25);
}

.upcoming-center-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
  padding: 17px 20px;
  border-bottom: 1px solid #eef2f7;
}

.upcoming-center-header h3 {
  margin: 0;
  font-size: 16px;
  color: #111827;
}

.upcoming-center-header p {
  margin: 4px 0 0;
  font-size: 11px;
  color: #9ca3af;
}

.upcoming-center-body {
  padding: 14px;
  overflow-y: auto;
  background: #f8fafc;
}

.upcoming-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  padding: 13px 14px;
  margin-bottom: 8px;
  border: 1px solid #fde68a;
  border-radius: 11px;
  background: white;
}

.upcoming-card-main {
  min-width: 0;
}

.upcoming-card-title {
  font-size: 13px;
  font-weight: 600;
  color: #111827;
}

.upcoming-card-detail {
  margin-top: 2px;
  font-size: 11px;
  color: #6b7280;
}

.upcoming-card-date {
  margin-top: 6px;
  font-size: 10px;
  color: #92400e;
}

.upcoming-card-time {
  flex-shrink: 0;
  min-width: 90px;
  padding: 8px 10px;
  border-radius: 9px;
  background: #fffbeb;
  text-align: center;
}

.upcoming-card-time strong {
  display: block;
  font-size: 14px;
  color: #92400e;
}

.upcoming-card-time span {
  display: block;
  margin-top: 2px;
  font-size: 9px;
  color: #b45309;
}

.upcoming-empty {
  min-height: 180px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 5px;
  text-align: center;
  color: #9ca3af;
}

.upcoming-empty-icon {
  font-size: 30px;
  opacity: .55;
}

.upcoming-empty strong {
  font-size: 13px;
  color: #6b7280;
}

.upcoming-empty span {
  max-width: 360px;
  font-size: 11px;
  line-height: 1.5;
}

.upcoming-center-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 12px 18px;
  border-top: 1px solid #eef2f7;
  background: white;
  font-size: 10px;
  color: #9ca3af;
}

.alarm-backdrop {
  position: fixed;
  inset: 0;
  z-index: 11500;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 18px;
  background: rgba(17,24,39,.68);
}

.alarm-modal {
  width: min(460px, 100%);
  padding: 22px;
  background: white;
  border-radius: 18px;
  box-shadow: 0 28px 80px rgba(0,0,0,.32);
}

.alarm-icon-wrap {
  width: 52px;
  height: 52px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 14px;
  border-radius: 14px;
  background: #fffbeb;
  font-size: 27px;
}

.alarm-eyebrow {
  margin-bottom: 5px;
  font-size: 10px;
  font-weight: 700;
  color: #d97706;
  text-transform: uppercase;
  letter-spacing: .08em;
}

.alarm-content h3 {
  margin: 0;
  font-size: 18px;
  color: #111827;
}

.alarm-item {
  margin: 12px 0 0;
  font-size: 15px;
  font-weight: 600;
  color: #374151;
}

.alarm-detail {
  margin: 3px 0 0;
  font-size: 12px;
  color: #6b7280;
}

.alarm-due {
  margin-top: 13px;
  padding: 10px 12px;
  border-radius: 9px;
  background: #f8fafc;
  font-size: 11px;
  color: #6b7280;
}

.alarm-due strong {
  margin-left: 4px;
  color: #111827;
}

.alarm-remaining {
  margin-top: 7px;
  font-size: 11px;
  font-weight: 600;
  color: #d97706;
}

.alarm-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 18px;
}

/* ===== PRINT ===== */

@media print { .no-print { display: none !important; } }

/* ===== RESPONSIVE ===== */

@media (max-width: 768px) {

  .page { padding: 56px 12px 12px; }

  .topbar { flex-direction: column; align-items: flex-start; gap: 8px; }

  .topbar h1 { font-size: 16px; }

  .topbar p  { font-size: 12px; }

  .topbar-actions { width: 100%; justify-content: flex-end; flex-wrap: wrap; gap: 6px; }

  .btn-primary, .btn-outline, .btn-filter { padding: 7px 10px; font-size: 12px; }

  .filter-bar { flex-direction: column; align-items: stretch; }

  .filter-bar > * { flex: unset; width: 100%; }

  .table-wrapper { overflow-x: auto; -webkit-overflow-scrolling: touch; }

  .table { min-width: 480px; }

  .table th, .table td { padding: 10px 10px; font-size: 12px; }

  .pagination-bar { flex-direction: column; align-items: flex-start; gap: 10px; padding: 10px 12px; }

  .pagination-controls { width: 100%; flex-wrap: wrap; gap: 4px; }

  .page-size-select { width: 100%; margin-right: 0; margin-bottom: 6px; }

  .page-btn { min-width: 30px; height: 30px; font-size: 12px; }

  .modal-backdrop { padding: 0; align-items: flex-end; }

  .modal { width: 100%; max-width: 100%; border-radius: 16px 16px 0 0; max-height: 90vh; display: flex; flex-direction: column; }

  .modal-body { max-height: unset; flex: 1; overflow-y: auto; }

  .date-dropdown { left: 0; right: 0; min-width: unset; width: 100%; }

  .filter-footer { flex-direction: column-reverse; align-items: stretch; gap: 6px; }

  .filter-footer button { width: 100%; justify-content: center; }

  .upcoming-center-backdrop {
    padding: 0;
    align-items: flex-end;
  }

  .upcoming-center-modal {
    width: 100%;
    max-height: 88vh;
    border-radius: 16px 16px 0 0;
  }

  .upcoming-center-footer {
    flex-direction: column;
    align-items: stretch;
  }

  .alarm-actions {
    flex-direction: column-reverse;
  }

  .alarm-actions button {
    width: 100%;
    justify-content: center;
  }

}



/* ================= DOCX PRINT PREVIEW MODAL ================= */

.docx-preview-backdrop {
  position: fixed;
  inset: 0;
  z-index: 12000;
  background: rgba(15, 23, 42, 0.62);
  backdrop-filter: blur(3px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
}

.docx-preview-modal {
  width: min(1180px, 96vw);
  height: min(900px, 94vh);
  background: #ffffff;
  border-radius: 16px;
  box-shadow: 0 24px 80px rgba(15, 23, 42, 0.35);
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.docx-preview-header {
  flex: 0 0 auto;
  min-height: 68px;
  padding: 14px 18px;
  border-bottom: 1px solid #e5e7eb;
  background: #ffffff;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.docx-preview-title {
  min-width: 0;
}

.docx-preview-title h3 {
  margin: 0;
  font-size: 17px;
  font-weight: 700;
  color: #111827;
}

.docx-preview-title p {
  margin: 4px 0 0;
  font-size: 12px;
  color: #6b7280;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 720px;
}

.docx-preview-close {
  width: 36px;
  height: 36px;
  flex: 0 0 36px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px solid #e5e7eb;
  border-radius: 9px;
  background: #ffffff;
  color: #6b7280;
  font-size: 16px;
  cursor: pointer;
  transition: background 0.15s, border-color 0.15s, color 0.15s;
}

.docx-preview-close:hover {
  background: #f3f4f6;
  border-color: #d1d5db;
  color: #111827;
}

.docx-preview-body {
  flex: 1 1 auto;
  min-height: 0;
  overflow: auto;
  padding: 26px;
  background: #e5e7eb;
}

.docx-render-container {
  min-height: 100%;
  display: flex;
  justify-content: center;
  align-items: flex-start;
}

.docx-render-container .docx-wrapper {
  background: transparent !important;
  padding: 0 !important;
}

.docx-render-container .docx-wrapper > section.docx {
  margin: 0 auto 24px !important;
  box-shadow: 0 5px 24px rgba(15, 23, 42, 0.18) !important;
}

.docx-preview-footer {
  flex: 0 0 auto;
  min-height: 70px;
  padding: 12px 18px;
  border-top: 1px solid #e5e7eb;
  background: #ffffff;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
}

.docx-preview-info {
  font-size: 12px;
  color: #6b7280;
}

.docx-preview-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

@media (max-width: 760px) {
  .docx-preview-backdrop {
    padding: 0;
    align-items: stretch;
  }

  .docx-preview-modal {
    width: 100vw;
    height: 100vh;
    max-width: none;
    max-height: none;
    border-radius: 0;
  }

  .docx-preview-body {
    padding: 12px;
  }

  .docx-preview-footer {
    align-items: stretch;
    flex-direction: column;
  }

  .docx-preview-actions {
    width: 100%;
  }

  .docx-preview-actions > button {
    flex: 1;
  }

  .docx-preview-title p {
    max-width: 65vw;
  }
}



/* ================= MONITORING POPUP ================= */

.monitoring-top-btn {
  position: relative;
}

.monitoring-backdrop {
  position: fixed;
  inset: 0;
  z-index: 11800;
  background: rgba(15, 23, 42, 0.58);
  backdrop-filter: blur(3px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
}

.monitoring-modal {
  width: min(1180px, 96vw);
  max-height: 90vh;
  background: #ffffff;
  border-radius: 16px;
  box-shadow: 0 24px 80px rgba(15, 23, 42, 0.35);
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.monitoring-modal-header {
  flex: 0 0 auto;
  min-height: 68px;
  padding: 14px 18px;
  border-bottom: 1px solid #e5e7eb;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.monitoring-modal-header h3 {
  margin: 0;
  color: #111827;
  font-size: 18px;
}

.monitoring-modal-header p {
  margin: 4px 0 0;
  color: #6b7280;
  font-size: 12px;
}

.monitoring-modal-body {
  flex: 1 1 auto;
  min-height: 0;
  overflow: auto;
  padding: 18px;
  background: #f9fafb;
}

.monitoring-table-wrap {
  overflow: auto;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  background: #ffffff;
}

.monitoring-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

.monitoring-table th,
.monitoring-table td {
  padding: 12px 14px;
  border-bottom: 1px solid #eef0f3;
  text-align: left;
  vertical-align: middle;
  white-space: nowrap;
}

.monitoring-table th {
  position: sticky;
  top: 0;
  z-index: 1;
  background: #f8fafc;
  color: #475569;
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.monitoring-table tbody tr:last-child td {
  border-bottom: 0;
}

.monitoring-state {
  display: inline-flex;
  align-items: center;
  min-height: 26px;
  padding: 4px 9px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 700;
}

.monitoring-state-out {
  background: #fff7ed;
  color: #c2410c;
}

.monitoring-state-returned {
  background: #ecfdf5;
  color: #047857;
}

.monitoring-empty {
  min-height: 240px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 7px;
  color: #6b7280;
  text-align: center;
}

.monitoring-empty-icon {
  font-size: 34px;
}

.monitoring-empty strong {
  color: #111827;
}

.monitoring-modal-footer {
  flex: 0 0 auto;
  min-height: 66px;
  padding: 12px 18px;
  border-top: 1px solid #e5e7eb;
  background: #ffffff;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  color: #6b7280;
  font-size: 12px;
}

@media (max-width: 760px) {
  .monitoring-backdrop {
    padding: 0;
    align-items: stretch;
  }

  .monitoring-modal {
    width: 100vw;
    max-height: none;
    height: 100vh;
    border-radius: 0;
  }

  .monitoring-modal-footer {
    align-items: stretch;
    flex-direction: column;
  }
}

</style>