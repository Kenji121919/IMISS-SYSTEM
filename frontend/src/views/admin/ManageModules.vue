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

        <h1>Manage modules</h1>

        <p>Build dynamic data entry forms with custom columns</p>

      </div>

      <div>

        <button class="btn-primary" @click="openCreate" style="width:fit-content !important">

          <span class="btn-icon-left">+</span> New module

        </button>

      </div>

    </div>

    <!-- ================= TWO COLUMN LAYOUT ================= -->

    <div class="two-col">

      <!-- ===== LEFT: MODULE LIST ===== -->

      <div class="panel">

        <div class="panel-label">Your modules</div>

        <div v-if="modules.length" class="module-list">

          <div

            v-for="m in modules"

            :key="m.id"

            :class="['module-item', { active: activeModule?.id === m.id }]"

            @click="openEdit(m)"

          >

            <div class="module-info">

              <div class="module-name">{{ m.name }}</div>

              <div class="module-meta">

                {{ m.columns?.length || 0 }} columns · {{ m.allowedProfiles?.length || 0 }} profiles

              </div>

            </div>

            <div class="item-actions" @click.stop>

  <button class="action-btn edit" @click="openEdit(m)" title="Edit">

    <svg viewBox="0 0 16 16" fill="none" width="14" height="14">

      <path d="M11 2l3 3-8 8H3v-3l8-8z" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/>

    </svg>

  </button>

  <button class="action-btn danger" @click="askDelete(m)" title="Delete">

    <svg viewBox="0 0 16 16" fill="none" width="14" height="14">

      <path d="M2 4h12M5 4V2h6v2M6 7v5M10 7v5M3 4l1 9h8l1-9" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>

    </svg>

  </button>

</div>

          </div>

        </div>

        <div v-else class="empty-state">

          <p>No modules yet.</p>

          <p>Click <strong>New module</strong> to get started.</p>

        </div>

      </div>

      <!-- ===== RIGHT: EDITOR PANEL ===== -->

      <div class="panel editor-panel" v-if="editorMode">

        <div class="editor-header">

          <div>

            <div class="panel-label">

              {{ editorMode === 'create' ? 'New module' : 'Edit module' }}

            </div>

            <div v-if="editorMode === 'edit'" class="active-badge">

              {{ editModule.name }}

            </div>

          </div>

          <button class="btn-ghost-sm" @click="closeEditor">✕</button>

        </div>

        <!-- MODULE NAME -->

        <div class="form-group">

          <label class="form-label">Module name</label>

          <input

            v-model="editModule.name"

            class="form-input"

            placeholder="e.g. Daily Attendance"

          />

        </div>

        <!-- COLUMNS -->

        <div class="section">

          <div class="section-label">Columns</div>

          <draggable

            v-model="editModule.columns"

            item-key="uid"

            animation="200"

            ghost-class="ghost"

            handle=".drag-handle"

          >

            <template #item="{ element, index }">

              <div class="col-row">

                <div class="drag-handle" title="Drag to reorder">⠿</div>

                <input

                  v-model="element.name"

                  class="col-input"

                  placeholder="Column name"

                />

                <select v-model="element.type" class="col-select">

                  <option value="varchar">Text</option>

                  <option value="int">Number</option>

                  <option value="date">Date</option>

                  <option value="time">Time</option>

                  <option value="select">Dropdown</option>

                  <option value="link">Link</option>

                </select>

                <!-- Dropdown options with colors -->

<div v-if="element.type === 'select'" class="options-wrap">

  <!-- Existing options (editable) -->

  <div

    v-for="(opt, oi) in element.parsedOptions"

    :key="oi"

    class="option-row"

  >

    <input

      v-model="opt.label"

      class="col-input"

      placeholder="Option label"

    />

    <input

      type="color"

      v-model="opt.color"

      class="color-picker"

      title="Pick color"

    />

    <button class="btn-remove" @click="removeOption(element, oi)">✕</button>

  </div>

  <!-- Footer actions -->

  <div class="options-actions">

    <button class="btn-add-opt" @click="addOption(element)">+ Add option</button>

    <!-- Copy from button — only show if other select columns exist -->

    <div class="copy-wrap" v-if="otherSelectColumns(element).length">

      <button

        class="btn-copy-opt"

        @click="toggleCopyMenu(element.uid)"

      >⎘ Copy from…</button>

      <!-- Dropdown menu -->

      <div v-if="copyMenuOpen === element.uid" class="copy-menu">

        <div

          v-for="other in otherSelectColumns(element)"

          :key="other.uid"

          class="copy-menu-item"

          @click="copyOptionsFrom(element, other)"

        >

          <span class="copy-menu-name">{{ other.name || '(unnamed)' }}</span>

          <span class="copy-menu-preview">

            {{ other.parsedOptions.slice(0, 3).map(o => o.label).join(', ') }}

            {{ other.parsedOptions.length > 3 ? '…' : '' }}

          </span>

        </div>

      </div>

    </div>

  </div>

</div>

                <!-- Link base URL -->

                <input

                  v-else-if="element.type === 'link'"

                  v-model="element.baseUrl"

                  class="col-input"

                  placeholder="http://172.16.1.39:5001/list?id="

                />

                <div v-else></div>

                <div class="col-badges">

                  <span

                    :class="['badge', element.required ? 'badge-green' : 'badge-off']"

                    @click="element.required = !element.required"

                    title="Toggle required"

                  >Required</span>

                  <span

                    :class="['badge', element.filterable ? 'badge-amber' : 'badge-off']"

                    @click="element.filterable = !element.filterable"

                    title="Toggle filterable"

                  >Filter</span>

                </div>

                <button class="btn-remove" @click="removeEditColumn(index)" title="Remove">✕</button>

              </div>

            </template>

          </draggable>

          <button class="btn-add-col" @click="addEditColumn">

            + Add column

          </button>

        </div>

        <!-- ALLOWED PROFILES -->

        <div class="section">

          <div class="section-label">Allowed profiles</div>

          <div class="profile-chips">

            <div

              v-for="p in profiles"

              :key="p.id"

              :class="['chip', { active: editModule.allowedProfiles?.map(Number).includes(Number(p.id)) }]"

              @click="toggleProfile(p.id)"

            >

              <span v-if="editModule.allowedProfiles?.map(Number).includes(Number(p.id))" class="chip-check">✓</span>

              {{ p.name }}

            </div>

          </div>

        </div>



        <!-- ================= MONITORING ================= -->
        <div class="section monitoring-section">
          <div class="monitoring-header">
            <div>
              <div class="section-label">Monitoring popup</div>
              <div class="monitoring-description">
                Show the latest/current location or borrower of each tracked item in this module.
              </div>
            </div>

            <label class="switch">
              <input
                type="checkbox"
                v-model="editModule.monitoringConfig.enabled"
              />
              <span class="switch-slider"></span>
            </label>
          </div>

          <transition name="monitor-slide">
            <div
              v-if="editModule.monitoringConfig.enabled"
              class="monitoring-config"
            >
              <div class="monitoring-field full-width">
                <label class="form-label">Popup title</label>
                <input
                  v-model="editModule.monitoringConfig.title"
                  class="form-input"
                  placeholder="e.g. Router Monitoring"
                />
              </div>

              <div class="monitoring-field">
                <label class="form-label">Tracked item column</label>
                <select
                  v-model="editModule.monitoringConfig.itemColumn"
                  class="form-input"
                >
                  <option value="">Select item column</option>
                  <option
                    v-for="col in editModule.columns.filter(c => c.name)"
                    :key="'mon-item-' + col.uid"
                    :value="col.name"
                  >
                    {{ col.name }}
                  </option>
                </select>
                <span class="monitoring-hint">Example: Router</span>
              </div>

              <div class="monitoring-field">
                <label class="form-label">Department / location column</label>
                <select
                  v-model="editModule.monitoringConfig.locationColumn"
                  class="form-input"
                >
                  <option value="">Select department/location</option>
                  <option
                    v-for="col in editModule.columns.filter(c => c.name)"
                    :key="'mon-location-' + col.uid"
                    :value="col.name"
                  >
                    {{ col.name }}
                  </option>
                </select>
                <span class="monitoring-hint">Example: Department / Office</span>
              </div>

              <div class="monitoring-field">
                <label class="form-label">Borrow / movement date</label>
                <select
                  v-model="editModule.monitoringConfig.borrowDateColumn"
                  class="form-input"
                >
                  <option value="">Select borrow date</option>
                  <option
                    v-for="col in editModule.columns.filter(c => c.name && c.type === 'date')"
                    :key="'mon-borrow-' + col.uid"
                    :value="col.name"
                  >
                    {{ col.name }}
                  </option>
                </select>
                <span class="monitoring-hint">Example: Barrow Date</span>
              </div>

              <div class="monitoring-field">
                <label class="form-label">Return date column</label>
                <select
                  v-model="editModule.monitoringConfig.returnDateColumn"
                  class="form-input"
                >
                  <option value="">None</option>
                  <option
                    v-for="col in editModule.columns.filter(c => c.name && c.type === 'date')"
                    :key="'mon-return-' + col.uid"
                    :value="col.name"
                  >
                    {{ col.name }}
                  </option>
                </select>
              </div>

              <div class="monitoring-field">
                <label class="form-label">Status column</label>
                <select
                  v-model="editModule.monitoringConfig.statusColumn"
                  class="form-input"
                >
                  <option value="">None</option>
                  <option
                    v-for="col in editModule.columns.filter(c => c.name)"
                    :key="'mon-status-' + col.uid"
                    :value="col.name"
                  >
                    {{ col.name }}
                  </option>
                </select>
              </div>

              <label class="monitoring-checkbox">
                <input
                  type="checkbox"
                  v-model="editModule.monitoringConfig.autoOpen"
                />
                <div>
                  <strong>Open monitoring automatically</strong>
                  <span>Open the monitoring popup when this module is opened.</span>
                </div>
              </label>

              <div class="monitoring-example">
                <strong>ROUTERS example:</strong>
                Router → Department / Office → Barrow Date → Return Date → Status.
              </div>
            </div>
          </transition>
        </div>

        <!-- ================= UPCOMING ALERTS ================= -->
        <div class="section upcoming-section">
          <div class="upcoming-header">
            <div>
              <div class="section-label">Upcoming alert</div>
              <div class="upcoming-description">
                Alert users before a scheduled date/time in this module.
                Example: show an alarm 1 hour before a router is due for return.
              </div>
            </div>

            <label class="switch">
              <input
                type="checkbox"
                v-model="editModule.upcomingConfig.enabled"
              />
              <span class="switch-slider"></span>
            </label>
          </div>

          <transition name="monitor-slide">
            <div
              v-if="editModule.upcomingConfig.enabled"
              class="upcoming-config"
            >
              <div class="upcoming-field full-width">
                <label class="form-label">Alert title</label>
                <input
                  v-model="editModule.upcomingConfig.title"
                  class="form-input"
                  placeholder="e.g. Router Return Reminder"
                />
              </div>

              <div class="upcoming-field">
                <label class="form-label">Date column</label>
                <select
                  v-model="editModule.upcomingConfig.dateColumn"
                  class="form-input"
                >
                  <option value="">Select date column</option>
                  <option
                    v-for="col in editModule.columns.filter(c => c.name && c.type === 'date')"
                    :key="col.uid"
                    :value="col.name"
                  >
                    {{ col.name }}
                  </option>
                </select>
                <span class="upcoming-hint">Example: Due Date or Return Date</span>
              </div>

              <div class="upcoming-field">
                <label class="form-label">Time column</label>
                <select
                  v-model="editModule.upcomingConfig.timeColumn"
                  class="form-input"
                >
                  <option value="">No time / use default time</option>
                  <option
                    v-for="col in editModule.columns.filter(c => c.name && c.type === 'time')"
                    :key="col.uid"
                    :value="col.name"
                  >
                    {{ col.name }}
                  </option>
                </select>
              </div>

              <div class="upcoming-field">
                <label class="form-label">Default time</label>
                <input
                  v-model="editModule.upcomingConfig.defaultTime"
                  type="time"
                  class="form-input"
                  :disabled="!!editModule.upcomingConfig.timeColumn"
                />
              </div>

              <div class="upcoming-field">
                <label class="form-label">Alert before</label>
                <div class="lead-time-row">
                  <input
                    v-model.number="editModule.upcomingConfig.leadValue"
                    type="number"
                    min="1"
                    class="form-input"
                  />

                  <select
                    v-model="editModule.upcomingConfig.leadUnit"
                    class="form-input"
                  >
                    <option value="minutes">Minutes</option>
                    <option value="hours">Hours</option>
                    <option value="days">Days</option>
                  </select>
                </div>
              </div>

              <div class="upcoming-field">
                <label class="form-label">Item / Label column</label>
                <select
                  v-model="editModule.upcomingConfig.labelColumn"
                  class="form-input"
                >
                  <option value="">Use module name</option>
                  <option
                    v-for="col in editModule.columns.filter(c => c.name)"
                    :key="col.uid"
                    :value="col.name"
                  >
                    {{ col.name }}
                  </option>
                </select>
                <span class="upcoming-hint">Example: Router</span>
              </div>

              <div class="upcoming-field">
                <label class="form-label">Detail column</label>
                <select
                  v-model="editModule.upcomingConfig.detailColumn"
                  class="form-input"
                >
                  <option value="">None</option>
                  <option
                    v-for="col in editModule.columns.filter(c => c.name)"
                    :key="col.uid"
                    :value="col.name"
                  >
                    {{ col.name }}
                  </option>
                </select>
                <span class="upcoming-hint">Example: Department / Office</span>
              </div>

              <label class="upcoming-checkbox">
                <input
                  type="checkbox"
                  v-model="editModule.upcomingConfig.autoPopup"
                />
                <div>
                  <strong>Show popup automatically</strong>
                  <span>Open an in-app warning when the alert time is reached.</span>
                </div>
              </label>

              <label class="upcoming-checkbox">
                <input
                  type="checkbox"
                  v-model="editModule.upcomingConfig.browserNotification"
                />
                <div>
                  <strong>Browser notification</strong>
                  <span>Also use a browser notification when permission is allowed.</span>
                </div>
              </label>

              <div class="upcoming-example">
                <strong>Example:</strong>
                {{ editModule.upcomingConfig.labelColumn || 'Router' }}
                will alert
                {{ editModule.upcomingConfig.leadValue }}
                {{ editModule.upcomingConfig.leadUnit }}
                before
                {{ editModule.upcomingConfig.dateColumn || 'Due Date' }}.
              </div>
            </div>
          </transition>
        </div>

        <!-- ================= PRINT / EXPORT TEMPLATES ================= -->

        <div class="section" style="margin-top:16px;">

          <div class="section-label">Print / export templates</div>

          <!-- Existing templates summary (always visible, regardless of chooser state) -->

          <div

            v-if="editModule.templateFile || (editModule.templates || []).filter(t => t.kind === 'docx').length"

            style="display:flex;flex-direction:column;gap:6px;margin-bottom:10px;"

          >

            <div v-if="editModule.templateFile" class="template-row">

              <span class="template-row-icon">📊</span>

              <span style="flex:1;">Excel — {{ editModule.templateFile }}</span>

              <button class="btn-copy-opt" @click="startAddTemplate('excel')" type="button">Edit mapping</button>

              <button class="btn-remove" @click="deleteExcelTemplate()" title="Remove" type="button" > ✕ </button>

            </div>

            <div

              v-for="t in editModule.templates.filter(t => t.kind === 'docx')"

              :key="t.id"

              class="template-row"

            >

              <span class="template-row-icon">📄</span>

              <span style="flex:1;">Word — {{ t.name }} ({{ t.fileName }})</span>

              <button class="btn-remove" @click="deleteDocxTemplate(t.id)" title="Remove">✕</button>

            </div>

          </div>

          <!-- CHOOSER: pick which type of template to add -->

          <div v-if="!addTemplateType" style="display:flex;gap:8px;">

            <button class="btn-add-col template-choice-btn" @click="startAddTemplate('excel')" type="button">

              + Add Excel template

            </button>

            <button class="btn-add-col template-choice-btn" @click="startAddTemplate('docx')" type="button">

              + Add Word template

            </button>

          </div>

          <!-- ADD/EDIT PANEL — only one template type shown at a time -->

          <div v-else class="template-add-panel">

            <div class="template-add-header">

              <span class="section-label" style="margin:0;">

                {{ addTemplateType === 'excel' ? 'Excel template (cell mapping)' : 'Word template (tag replace)' }}

              </span>

              <button class="btn-ghost-sm" @click="cancelAddTemplate" type="button">✕</button>

            </div>

            <!-- ===== EXCEL FLOW (legacy single-Excel-template) ===== -->

            <template v-if="addTemplateType === 'excel'">

              <input

                type="file"

                accept=".xlsx,.xls"

                @change="onTemplateSelected"

              />

              <div v-if="selectedTemplate" style="margin-top:6px;font-size:12px;color:#16a34a;">

                Selected: {{ selectedTemplate.name }} — click cells below to map columns

              </div>

              <div v-else-if="editModule.templateFile" style="margin-top:6px;font-size:12px;color:#64748b;">

                Editing mapping for: {{ editModule.templateFile }}

              </div>

              <!-- LEGEND: which columns are mapped -->

              <div v-if="previewGrid.length" class="mapping-legend">

                <div

                  v-for="(col, i) in editModule.columns.filter(c => c.name)"

                  :key="col.uid"

                  class="legend-chip"

                  :style="{ borderColor: colorForColumn(i), color: colorForColumn(i) }"

                >

                  <span class="legend-dot" :style="{ background: colorForColumn(i) }"></span>

                  {{ col.name }}

                  <span v-if="mappingForColumn(col.name)" class="legend-cell">

                    → {{ mappingForColumn(col.name).cell }}

                    <button class="legend-clear" @click="clearMappingForColumn(col.name)" type="button">✕</button>

                  </span>

                  <span v-else class="legend-unmapped">unmapped</span>

                </div>

              </div>

              <!-- SHEET PREVIEW -->

              <div v-if="previewGrid.length" class="sheet-preview-wrap">

                <table class="sheet-preview">

                  <tbody>

                    <tr v-for="(row, r) in previewGrid" :key="r">

                      <template v-for="(cell, c) in row" :key="c">

                        <td

                          v-if="!cell.hidden"

                          :rowspan="cell.rowspan"

                          :colspan="cell.colspan"

                          :class="['preview-cell', { mapped: mappingForCell(cell.address) }]"

                          :style="mappingForCell(cell.address) ? cellMappedStyle(cell.address) : {}"

                          @click="onCellClick(cell.address)"

                          :title="cell.address"

                        >

                          <span class="preview-cell-text">{{ cell.value }}</span>

                          <span v-if="mappingForCell(cell.address)" class="preview-cell-tag">

                            {{ mappingForCell(cell.address).column }}

                          </span>

                        </td>

                      </template>

                    </tr>

                  </tbody>

                </table>

              </div>

              <!-- COLUMN PICKER POPOVER -->

              <div v-if="pickerCell" class="cell-picker-backdrop" @click.self="pickerCell = null">

                <div class="cell-picker">

                  <div class="cell-picker-title">Map cell {{ pickerCell }} to:</div>

                  <div

                    v-for="col in editModule.columns.filter(c => c.name)"

                    :key="col.uid"

                    class="cell-picker-option"

                    @click="assignMapping(col.name, pickerCell)"

                  >{{ col.name }}</div>

                  <div class="cell-picker-option clear" @click="pickerCell = null">Cancel</div>

                </div>

              </div>

            </template>

            <!-- ===== WORD (DOCX) FLOW (multi-template) ===== -->

            <template v-else>

              <div style="margin-bottom:8px;font-size:11px;color:#6b7280;line-height:1.6;">

                In the Word file, replace each blank with the matching tag below:

                <div style="margin-top:4px;">

                  <code

                    v-for="col in editModule.columns.filter(c => c.name)"

                    :key="col.uid"

                    style="display:inline-block;margin:2px 6px 2px 0;padding:2px 6px;background:#eff6ff;border:1px solid #bfdbfe;border-radius:4px;color:#1d4ed8;"

                  >{{ tagFor(col.name) }}</code>

                </div>

              </div>

              <input

                type="text"

                v-model="newDocxName"

                placeholder="Template name (e.g. Pull-Out Form)"

                class="col-input"

                style="margin-bottom:6px;max-width:280px;"

              />

              <input type="file" accept=".docx" @change="onDocxSelected" />

              <div v-if="pendingDocxFile" style="margin-top:6px;font-size:12px;color:#16a34a;">

                Selected: {{ pendingDocxFile.name }} — will upload on save

              </div>

            </template>

          </div>

        </div>

        <!-- FOOTER -->

        <div class="editor-footer">

          <div><button class="btn-ghost" @click="closeEditor">Cancel</button></div>

          <div>

            <button

              class="btn-primary"

              style="width:fit-content !important"

              @click="editorMode === 'create' ? createModule() : updateModule()"

              :disabled="saving"

            >

              <span v-if="saving">Saving…</span>

              <span v-else>{{ editorMode === 'create' ? 'Create module' : 'Save changes' }}</span>

            </button>

          </div>

        </div>

      </div>

      <!-- PLACEHOLDER when nothing is selected -->

      <div class="panel placeholder-panel" v-else>

        <div class="placeholder-content">

          <div class="placeholder-icon">☰</div>

          <p>Select a module to edit,<br>or create a new one.</p>

        </div>

      </div>

    </div>

    <!-- ================= DELETE MODAL ================= -->

    <div v-if="showDeleteModal" class="modal-backdrop" @click.self="cancelDelete">

      <div class="modal">

        <div class="modal-header">

          <h3>Delete module</h3>

          <p>This action cannot be undone</p>

        </div>

        <div class="modal-body">

          <p>Are you sure you want to delete <strong>{{ deleteTarget?.name }}</strong>?</p>

        </div>

        <div class="modal-footer">

          <button class="btn-ghost" @click="cancelDelete">Cancel</button>

          <button class="btn-danger" @click="confirmDelete">Delete</button>

        </div>

      </div>

    </div>

  </div>

</template>

<script setup>

import { ref, onMounted } from 'vue'

import draggable from 'vuedraggable'

import api from '@/api/axios'

import * as XLSX from 'xlsx'

/* ================= STATE ================= */

const modules = ref([])

const profiles = ref([])

const activeModule = ref(null)

const editorMode = ref(null) // 'create' | 'edit' | null

const saving = ref(false)

const selectedTemplate = ref(null)


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

  let parsed = value

  if (typeof value === 'string') {
    try {
      parsed = JSON.parse(value)
    } catch {
      parsed = {}
    }
  }

  return {
    ...defaultUpcomingConfig(),
    ...(parsed || {})
  }
}


const editModule = ref({

  name: '',

  columns: [],

  allowedProfiles: [],

  monitoringConfig: defaultMonitoringConfig(),

  upcomingConfig: defaultUpcomingConfig(),

  templateStartRow: 8,

  templateRowsPerPage: 9,

  templateMappings: [],

  templates: [],

})

const showDeleteModal = ref(false)

const deleteTarget = ref(null)

const user = JSON.parse(localStorage.getItem('user'))

/* ================= TOAST ================= */

const toast = ref({ show: false, message: '', type: 'success' })

const showToast = (message, type = 'success') => {

  toast.value = { show: true, message, type }

  setTimeout(() => { toast.value.show = false }, 2500)

}

/* ================= TEMPLATE ADD/EDIT CHOOSER =================

   Controls which single template flow (Excel or Word) is shown at a time,

   instead of always rendering both upload UIs together. */

const addTemplateType = ref(null) // null | 'excel' | 'docx'

const startAddTemplate = (type) => {

  addTemplateType.value = type

  if (type === 'excel' && editModule.value.templateFile && !previewGrid.value.length) {

    // Pull the existing workbook in so the mapping grid is ready to edit

    loadExistingTemplateForMapping()

  }

}

const cancelAddTemplate = () => {

  addTemplateType.value = null

}

/* ================= TEMPLATE MAPPING STATE (legacy single-Excel-template) ================= */

const previewGrid = ref([])      // 2D array of { value, address, rowspan, colspan, hidden }

const pickerCell  = ref(null)    // cell address currently being assigned

const workbookRef = ref(null)    // parsed workbook, kept in case we need to re-export later

const MAPPING_COLORS = ['#2563eb', '#16a34a', '#d97706', '#dc2626', '#7c3aed', '#0891b2', '#db2777', '#65a30d']

const colorForColumn = (i) => MAPPING_COLORS[i % MAPPING_COLORS.length]

const mappingForCell = (address) =>

  (editModule.value.templateMappings || []).find(m => m.cell === address)

const mappingForColumn = (colName) =>

  (editModule.value.templateMappings || []).find(m => m.column === colName)

const cellMappedStyle = (address) => {

  const m = mappingForCell(address)

  if (!m) return {}

  const i = editModule.value.columns.findIndex(c => c.name === m.column)

  const color = colorForColumn(i === -1 ? 0 : i)

  return { background: color + '1a', borderColor: color, color }

}

const onCellClick = (address) => {

  pickerCell.value = address

}

const assignMapping = (columnName, cellAddress) => {

  // one cell = one column; remove any prior mapping using either this cell or this column

  editModule.value.templateMappings = (editModule.value.templateMappings || [])

    .filter(m => m.cell !== cellAddress && m.column !== columnName)

  editModule.value.templateMappings.push({ column: columnName, cell: cellAddress })

  pickerCell.value = null

}

const clearMappingForColumn = (columnName) => {

  editModule.value.templateMappings = (editModule.value.templateMappings || [])

    .filter(m => m.column !== columnName)

}

/* ================= BUILD PREVIEW GRID (handles merged cells) ================= */

const buildPreviewGrid = (worksheet) => {

  const sheetRef = worksheet['!ref']

  if (!sheetRef) { previewGrid.value = []; return }

  const range = XLSX.utils.decode_range(sheetRef)

  const merges = worksheet['!merges'] || []

  const anchorInfo = {}

  const hiddenSet = new Set()

  merges.forEach(m => {

    const rowspan = m.e.r - m.s.r + 1

    const colspan = m.e.c - m.s.c + 1

    anchorInfo[`${m.s.r},${m.s.c}`] = { rowspan, colspan }

    for (let r = m.s.r; r <= m.e.r; r++) {

      for (let c = m.s.c; c <= m.e.c; c++) {

        if (r === m.s.r && c === m.s.c) continue

        hiddenSet.add(`${r},${c}`)

      }

    }

  })

  const grid = []

  const maxRow = Math.min(range.e.r, 80) // cap preview so huge sheets don't choke the browser

  for (let r = range.s.r; r <= maxRow; r++) {

    const row = []

    for (let c = range.s.c; c <= range.e.c; c++) {

      const address = XLSX.utils.encode_cell({ r, c })

      const key = `${r},${c}`

      if (hiddenSet.has(key)) {

        row.push({ hidden: true })

        continue

      }

      const cellObj = worksheet[address]

      const info = anchorInfo[key]

      row.push({

        address,

        value: cellObj ? String(cellObj.v ?? '') : '',

        rowspan: info?.rowspan || 1,

        colspan: info?.colspan || 1,

        hidden: false,

      })

    }

    grid.push(row)

  }

  previewGrid.value = grid

}

const parseWorkbookFile = (file) => {

  const reader = new FileReader()

  reader.onload = (e) => {

    const wb = XLSX.read(e.target.result, { type: 'array' })

    workbookRef.value = wb

    const firstSheet = wb.Sheets[wb.SheetNames[0]]

    buildPreviewGrid(firstSheet)

  }

  reader.readAsArrayBuffer(file)

}

/* ================= FETCH EXISTING TEMPLATE FOR RE-MAPPING (legacy) ================= */

const loadExistingTemplateForMapping = async () => {

  try {

    const res = await api.get(`/modules/${editModule.value.id}/template`, { responseType: 'arraybuffer' })

    const wb = XLSX.read(res.data, { type: 'array' })

    workbookRef.value = wb

    const firstSheet = wb.Sheets[wb.SheetNames[0]]

    buildPreviewGrid(firstSheet)

  } catch (err) {

    console.error(err)

    showToast('Could not load existing template for mapping', 'error')

  }

}

/* ================= WORD (DOCX) TEMPLATE STATE — new multi-template flow ================= */

const newDocxName = ref('')

const pendingDocxFile = ref(null)

const onDocxSelected = (e) => {

  pendingDocxFile.value = e.target.files[0] || null

}

// Called after createModule()/updateModule() succeed, if a docx is staged

const uploadPendingDocxTemplate = async (moduleId) => {

  if (!pendingDocxFile.value) return

  try {

    const formData = new FormData()

    formData.append('file', pendingDocxFile.value)

    formData.append('name', newDocxName.value || 'Pull-Out Form')

    formData.append('kind', 'docx')

    await api.post(`/modules/${moduleId}/templates`, formData, {

      headers: { 'Content-Type': 'multipart/form-data' },

    })

  } catch (err) {

    console.error(err)

    showToast('Module saved, but the Word template failed to upload', 'error')

  } finally {

    pendingDocxFile.value = null

    newDocxName.value = ''

  }

}

// Builds the display tag (e.g. "{{DateStarted}}") for a column.

// Kept as a function rather than inline template string concatenation,

// since Vue's compiler misparses a literal '{{' inside a mustache expression.

const tagFor = (name) => '{{' + name.replace(/[^a-zA-Z0-9]/g, '') + '}}'

const deleteDocxTemplate = async (templateId) => {

  try {

    await api.delete(`/modules/templates/${templateId}`)

    editModule.value.templates = (editModule.value.templates || []).filter(t => t.id !== templateId)

    showToast('Template removed', 'success')

  } catch (err) {

    console.error(err)

    showToast('Failed to remove template', 'error')

  }

}

/* ================= INIT ================= */

onMounted(async () => {

  await loadModules()

  await loadProfiles()

})

/* ================= LOAD ================= */

const loadModules = async () => {

  try {

    const res = await api.get(`/modules/${user.id}`)

    modules.value = res.data.map(m => ({
      ...m,
      columns: typeof m.columns === 'string' ? JSON.parse(m.columns) : m.columns,
      monitoringConfig: parseMonitoringConfig(m.monitoringConfig),
      upcomingConfig: parseUpcomingConfig(m.upcomingConfig)
    }))

  } catch (err) {

    console.error(err)

    showToast('Failed to load modules', 'error')

  }

}

const loadProfiles = async () => {

  try {

    const res = await api.get(`/profiles/${user.id}`)

    profiles.value = res.data

  } catch (err) {

    console.error(err)

    showToast('Failed to load profiles', 'error')

  }

}

/* ================= EDITOR ================= */

const openCreate = () => {

  selectedTemplate.value = null

  previewGrid.value = []

  workbookRef.value = null

  pendingDocxFile.value = null

  newDocxName.value = ''

  addTemplateType.value = null

  activeModule.value = null

  editorMode.value = 'create'

  editModule.value = {

    name: '',

    columns: [{

      uid: Date.now(),

      name: '',

      type: 'varchar',

      parsedOptions: [],

      baseUrl: '',

      filterable: false,

      required: false

    }],

    allowedProfiles: [],

    monitoringConfig: defaultMonitoringConfig(),

    upcomingConfig: defaultUpcomingConfig(),

    templateStartRow: 8,

    templateRowsPerPage: 9,

    templateMappings: [],

    templates: [],

  }

}

const openEdit = (m) => {

  activeModule.value = m

  editorMode.value = 'edit'

  selectedTemplate.value = null

  previewGrid.value = []

  workbookRef.value = null

  pendingDocxFile.value = null

  newDocxName.value = ''

  addTemplateType.value = null

  let parsedColumns = m.columns

  if (typeof parsedColumns === 'string') parsedColumns = JSON.parse(parsedColumns)

  editModule.value = {

    ...m,

    columns: Array.isArray(parsedColumns)

      ? parsedColumns.map(col => ({

          uid: Date.now() + Math.random(),

          ...col,

          parsedOptions: (() => {

            const raw = typeof col.options === 'string'

              ? JSON.parse(col.options)

              : (col.options || [])

            return raw.map(o =>

              typeof o === 'object' ? o : { label: o, color: '#6b7280' }

            )

          })(),

          baseUrl: col.baseUrl || ''

        }))

      : [],

    allowedProfiles: m.allowedProfiles?.map(p => Number(typeof p === 'object' ? p.id : p)) || [],

    monitoringConfig: parseMonitoringConfig(m.monitoringConfig),

    upcomingConfig: parseUpcomingConfig(m.upcomingConfig),

    templateStartRow: 8,

    templateRowsPerPage: 9,

    templateMappings: m.templateMappings

      ? (typeof m.templateMappings === 'string' ? JSON.parse(m.templateMappings) : m.templateMappings)

      : [],

    templates: m.templates || [],

  }

}

const closeEditor = () => {

  editorMode.value = null

  activeModule.value = null

  addTemplateType.value = null

}

/* ================= COLUMNS ================= */

const addEditColumn = () => {

  editModule.value.columns.push({

    uid: Date.now() + Math.random(),

    name: '',

    type: 'varchar',

    parsedOptions: [],

    baseUrl: '',

    filterable: false,

    required: false

  })

}

const removeEditColumn = (i) => {

  const removed = editModule.value.columns[i]

  if (removed?.name) {

    const mon = editModule.value.monitoringConfig

    if (mon?.itemColumn === removed.name) mon.itemColumn = ''
    if (mon?.locationColumn === removed.name) mon.locationColumn = ''
    if (mon?.borrowDateColumn === removed.name) mon.borrowDateColumn = ''
    if (mon?.returnDateColumn === removed.name) mon.returnDateColumn = ''
    if (mon?.statusColumn === removed.name) mon.statusColumn = ''

    const cfg = editModule.value.upcomingConfig

    if (cfg?.dateColumn === removed.name) cfg.dateColumn = ''
    if (cfg?.timeColumn === removed.name) cfg.timeColumn = ''
    if (cfg?.labelColumn === removed.name) cfg.labelColumn = ''
    if (cfg?.detailColumn === removed.name) cfg.detailColumn = ''

  }

  editModule.value.columns.splice(i, 1)

}

/* ================= DROPDOWN OPTIONS ================= */

const addOption = (col) => {

  if (!col.parsedOptions) col.parsedOptions = []

  col.parsedOptions.push({ label: '', color: '#6b7280' })

}

const removeOption = (col, index) => {

  col.parsedOptions.splice(index, 1)

}

const copyMenuOpen = ref(null)

const toggleCopyMenu = (uid) => {

  copyMenuOpen.value = copyMenuOpen.value === uid ? null : uid

}

const otherSelectColumns = (current) => {

  return editModule.value.columns.filter(

    col => col.uid !== current.uid &&

           col.type === 'select' &&

           col.parsedOptions?.length > 0

  )

}

const copyOptionsFrom = (target, source) => {

  target.parsedOptions = source.parsedOptions.map((o) => ({

    label: o.label,

    color: o.color,

  }))

  copyMenuOpen.value = null

}

/* ================= PROFILES ================= */

const toggleProfile = (id) => {

  const list = editModule.value.allowedProfiles

  const idx = list.findIndex(i => Number(i) === Number(id))

  if (idx === -1) list.push(Number(id))

  else list.splice(idx, 1)

}

/* ================= FORMAT COLUMNS ================= */

const formatColumns = (columns) =>

  columns.map(col => ({

    name: col.name,

    type: col.type,

    filterable: col.filterable || false,

    required: col.required || false,

    baseUrl: col.type === 'link' ? (col.baseUrl || '') : undefined,

    options: col.type === 'select'

      ? (col.parsedOptions || []).map(o => ({ label: o.label, color: o.color }))

      : []

  }))

/* ================= TEMPLATE FILE SELECTION (legacy Excel) ================= */

const onTemplateSelected = (event) => {

  const file = event.target.files[0]

  if (!file) { selectedTemplate.value = null; previewGrid.value = []; return }

  const allowed = [

    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',

    'application/vnd.ms-excel'

  ]

  if (!allowed.includes(file.type)) {

    showToast('Please select a valid Excel file.', 'error')

    event.target.value = ''

    selectedTemplate.value = null

    return

  }

  selectedTemplate.value = file

  editModule.value.templateMappings = []   // fresh file = fresh mapping

  parseWorkbookFile(file)

}


/* ================= MONITORING VALIDATION ================= */

const validateMonitoringConfig = () => {
  const cfg = editModule.value.monitoringConfig

  if (!cfg?.enabled) return true

  if (!cfg.itemColumn) {
    showToast('Please select the tracked item column for monitoring', 'error')
    return false
  }

  if (!cfg.locationColumn) {
    showToast('Please select the department/location column for monitoring', 'error')
    return false
  }

  return true
}

/* ================= UPCOMING ALERT VALIDATION ================= */

const validateUpcomingConfig = () => {

  const cfg = editModule.value.upcomingConfig

  if (!cfg?.enabled) return true

  if (!cfg.dateColumn) {

    showToast(
      'Please select a date column for the upcoming alert',
      'error'
    )

    return false

  }

  if (!Number(cfg.leadValue) || Number(cfg.leadValue) < 1) {

    showToast(
      'Alert lead time must be at least 1',
      'error'
    )

    return false

  }

  return true

}

/* ================= CREATE ================= */

const createModule = async () => {

  if (!editModule.value.name.trim()) {

    return showToast('Module name required', 'error')

  }

  if (!validateMonitoringConfig()) return

  if (!validateUpcomingConfig()) return

  saving.value = true

  try {

    const res = await api.post('/modules', {

      name: editModule.value.name,

      columns: formatColumns(editModule.value.columns),

      allowedProfiles: editModule.value.allowedProfiles,

      monitoringConfig: editModule.value.monitoringConfig,

      upcomingConfig: editModule.value.upcomingConfig,

      templateStartRow: editModule.value.templateStartRow,

      templateRowsPerPage: editModule.value.templateRowsPerPage,

      templateMappings: editModule.value.templateMappings,

      userId: user.id,

    })

    if (selectedTemplate.value) {

      const formData = new FormData()

      formData.append('file', selectedTemplate.value)

      await api.post(

        `/modules/${res.data.id}/template`,

        formData,

        { headers: { 'Content-Type': 'multipart/form-data' } },

      )

    }

    await uploadPendingDocxTemplate(res.data.id)

    await loadModules()

    selectedTemplate.value = null

    closeEditor()

    showToast('Module created successfully.')

  } catch (err) {

    console.error(err)

    showToast('Failed to create module', 'error')

  } finally {

    saving.value = false

  }

}

/* ================= UPDATE ================= */


// Legacy Excel template removal currently has no DELETE endpoint in ModulesController.
// Keep the button safe instead of calling a non-existent API route.
const deleteExcelTemplate = () => {
  showToast(
    'Legacy Excel template removal is not available until a backend DELETE endpoint is added.',
    'error'
  )
}

const updateModule = async () => {

  if (!editModule.value.name.trim()) return showToast('Module name required', 'error')

  if (!validateMonitoringConfig()) return

  if (!validateUpcomingConfig()) return

  saving.value = true

  try {

    await api.put(`/modules/${editModule.value.id}`, {

      name: editModule.value.name,

      columns: formatColumns(editModule.value.columns),

      allowedProfiles: editModule.value.allowedProfiles.map(Number),

      monitoringConfig: editModule.value.monitoringConfig,

      upcomingConfig: editModule.value.upcomingConfig,

      templateStartRow: editModule.value.templateStartRow,

      templateRowsPerPage: editModule.value.templateRowsPerPage,

      templateMappings: editModule.value.templateMappings,

    })

    if (selectedTemplate.value) {

      const formData = new FormData()

      formData.append('file', selectedTemplate.value)

      await api.post(

        `/modules/${editModule.value.id}/template`,

        formData,

        { headers: { 'Content-Type': 'multipart/form-data' } },

      )

    }

    await uploadPendingDocxTemplate(editModule.value.id)

    await loadModules()

    selectedTemplate.value = null

    closeEditor()

    showToast('Module updated', 'success')

  } catch (err) {

    console.error(err)

    showToast('Failed to update module', 'error')

  } finally {

    saving.value = false

  }

}

/* ================= DELETE ================= */

const askDelete = (m) => {

  deleteTarget.value = m

  showDeleteModal.value = true

}

const confirmDelete = async () => {

  try {

    await api.delete(`/modules/${deleteTarget.value.id}`)

    if (activeModule.value?.id === deleteTarget.value.id) closeEditor()

    showDeleteModal.value = false

    deleteTarget.value = null

    await loadModules()

    showToast('Module deleted', 'success')

  } catch (err) {

    console.error(err)

    showToast('Delete failed', 'error')

  }

}

const cancelDelete = () => {

  deleteTarget.value = null

  showDeleteModal.value = false

}

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

.toast.error { background: #ef4444; }

.toast-icon { font-size: 14px; }

.toast-slide-enter-active, .toast-slide-leave-active { transition: all 0.25s ease; }

.toast-slide-enter-from, .toast-slide-leave-to { opacity: 0; transform: translateY(-8px); }

/* ===== TOPBAR ===== */

.topbar {

  display: flex;

  justify-content: space-between;

  align-items: center;

  margin-bottom: 20px;

}

.topbar h1 { font-size: 20px; font-weight: 600; margin: 0; }

.topbar p { font-size: 13px; color: #6b7280; margin: 2px 0 0; }

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

  width: fit-content !important;

  max-width: fit-content !important;

  align-self: flex-start;

  transition: background 0.15s;

}

.btn-primary:hover { background: #1f2937; }

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

.btn-icon-left { font-size: 16px; line-height: 1; }

/* ===== LAYOUT ===== */

.two-col {

  display: grid;

  grid-template-columns: 280px 1fr;

  gap: 16px;

  align-items: start;

}

/* ===== PANEL ===== */

.panel {

  background: white;

  border: 1px solid #eef2f7;

  border-radius: 14px;

  padding: 16px;

}

.panel-label {

  font-size: 11px;

  font-weight: 600;

  color: #9ca3af;

  text-transform: uppercase;

  letter-spacing: 0.06em;

  margin-bottom: 12px;

}

/* ===== MODULE LIST ===== */

.module-list { display: flex; flex-direction: column; gap: 6px; }

.module-item {

  display: flex;

  justify-content: space-between;

  align-items: center;

  padding: 10px 12px;

  border: 1px solid #eef2f7;

  border-radius: 10px;

  cursor: pointer;

  transition: all 0.15s;

}

.module-item:hover { border-color: #d1d5db; background: #fafafa; }

.module-item.active { border-color: #bfdbfe; background: #eff6ff; }

.module-info { flex: 1; min-width: 0; }

.module-name {

  font-size: 13px;

  font-weight: 500;

  color: #111827;

  white-space: nowrap;

  overflow: hidden;

  text-overflow: ellipsis;

}

.module-meta { font-size: 11px; color: #9ca3af; margin-top: 2px; }

.module-item.active .module-name { color: #1d4ed8; }

.module-item.active .module-meta { color: #93c5fd; }

.item-actions { display: flex; gap: 4px; margin-left: 8px; }

.btn-icon-action {

  width: 28px;

  height: 28px;

  border-radius: 6px;

  border: none;

  cursor: pointer;

  font-size: 13px;

  display: inline-flex;

  align-items: center;

  justify-content: center;

  transition: all 0.15s;

  background: transparent;

}

.btn-icon-action.edit { color: #0284c7; }

.btn-icon-action.edit:hover { background: #e0f2fe; }

.btn-icon-action.danger { color: #dc2626; }

.btn-icon-action.danger:hover { background: #fee2e2; }

/* ===== EDITOR PANEL ===== */

.editor-panel { display: flex; flex-direction: column; gap: 16px; }

.editor-header {

  display: flex;

  justify-content: space-between;

  align-items: flex-start;

}

.active-badge {

  font-size: 13px;

  font-weight: 500;

  color: #1d4ed8;

  background: #eff6ff;

  border: 1px solid #bfdbfe;

  border-radius: 99px;

  padding: 2px 10px;

  display: inline-block;

  margin-top: 4px;

}

/* ===== FORM ===== */

.form-group { display: flex; flex-direction: column; gap: 6px; }

.form-label { font-size: 12px; color: #6b7280; font-weight: 500; }

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

.form-input:focus { border-color: #3b82f6; }

/* ===== SECTION ===== */

.section { display: flex; flex-direction: column; gap: 8px; }

.section-label {

  font-size: 11px;

  font-weight: 600;

  color: #9ca3af;

  text-transform: uppercase;

  letter-spacing: 0.06em;

}

/* ===== COLUMN ROW ===== */

.col-row {

  display: grid;

  grid-template-columns: 20px 1fr 100px 1fr auto auto;

  gap: 8px;

  align-items: start;

  padding: 8px 10px;

  border: 1px solid #eef2f7;

  border-radius: 10px;

  background: #fafafa;

  margin-bottom: 4px;

}

.drag-handle {

  cursor: grab;

  font-size: 16px;

  color: #d1d5db;

  user-select: none;

  text-align: center;

  padding-top: 6px;

}

.drag-handle:active { cursor: grabbing; }

.col-input {

  padding: 6px 9px;

  border: 1px solid #e5e7eb;

  border-radius: 8px;

  font-size: 12px;

  color: #111827;

  background: white;

  outline: none;

  width: 100%;

  box-sizing: border-box;

}

.col-input:focus { border-color: #3b82f6; }

.col-select {

  padding: 6px 8px;

  border: 1px solid #e5e7eb;

  border-radius: 8px;

  font-size: 12px;

  color: #111827;

  background: white;

  outline: none;

  width: 100%;

}

.col-badges { display: flex; gap: 4px; flex-wrap: wrap; padding-top: 4px; }

.badge {

  font-size: 10px;

  font-weight: 500;

  padding: 3px 8px;

  border-radius: 99px;

  cursor: pointer;

  user-select: none;

  transition: all 0.15s;

  white-space: nowrap;

}

.badge-green { background: #dcfce7; color: #15803d; border: 1px solid #bbf7d0; }

.badge-amber { background: #fef9c3; color: #92400e; border: 1px solid #fde68a; }

.badge-off { background: #f3f4f6; color: #9ca3af; border: 1px solid #e5e7eb; }

.btn-remove {

  width: 26px;

  height: 26px;

  border-radius: 6px;

  border: none;

  background: transparent;

  color: #ef4444;

  cursor: pointer;

  font-size: 12px;

  display: flex;

  align-items: center;

  justify-content: center;

  transition: background 0.15s;

  flex-shrink: 0;

}

.btn-remove:hover { background: #fee2e2; }

.btn-add-col {

  display: flex;

  align-items: center;

  justify-content: center;

  width: 100%;

  padding: 8px;

  border: 1px dashed #d1d5db;

  border-radius: 10px;

  background: transparent;

  color: #9ca3af;

  font-size: 12px;

  cursor: pointer;

  transition: all 0.15s;

  margin-top: 2px;

}

.btn-add-col:hover { background: #f9fafb; color: #374151; border-color: #9ca3af; }

/* ===== DROPDOWN OPTIONS ===== */

.options-wrap {

  display: flex;

  flex-direction: column;

  gap: 4px;

}

.option-row {

  display: flex;

  align-items: center;

  gap: 6px;

}

.color-picker {

  width: 32px;

  height: 28px;

  border: 1px solid #e5e7eb;

  border-radius: 6px;

  padding: 2px;

  cursor: pointer;

  background: white;

  flex-shrink: 0;

}

.btn-add-opt {

  font-size: 11px;

  color: #6b7280;

  background: none;

  border: 1px dashed #d1d5db;

  border-radius: 6px;

  padding: 4px 10px;

  cursor: pointer;

  margin-top: 2px;

  transition: all 0.15s;

  width: fit-content;

}

.btn-add-opt:hover { background: #f9fafb; color: #374151; }

/* ===== PROFILE CHIPS ===== */

.profile-chips { display: flex; flex-wrap: wrap; gap: 6px; }

.chip {

  display: inline-flex;

  align-items: center;

  gap: 5px;

  padding: 5px 12px;

  border: 1px solid #e5e7eb;

  border-radius: 99px;

  font-size: 12px;

  color: #6b7280;

  cursor: pointer;

  background: white;

  transition: all 0.15s;

  user-select: none;

}

.chip:hover { border-color: #bfdbfe; background: #eff6ff; color: #1d4ed8; }

.chip.active { background: #eff6ff; border-color: #bfdbfe; color: #1d4ed8; font-weight: 500; }

.chip-check { font-size: 11px; }

/* ===== EDITOR FOOTER ===== */

.editor-footer {

  display: flex;

  justify-content: flex-end;

  align-items: center;

  align-self: stretch;

  gap: 8px;

  padding-top: 14px;

  border-top: 1px solid #eef2f7;

  margin-top: 4px;

}

.editor-footer .btn-primary,

.editor-footer .btn-ghost {

  width: fit-content;

  flex-shrink: 0;

}

/* ===== PLACEHOLDER ===== */

.placeholder-panel {

  display: flex;

  align-items: center;

  justify-content: center;

  min-height: 300px;

  border: 1px dashed #e5e7eb !important;

  background: #fafafa !important;

}

.placeholder-content { text-align: center; color: #9ca3af; }

.placeholder-icon { font-size: 32px; margin-bottom: 12px; opacity: 0.4; }

.placeholder-content p { font-size: 13px; line-height: 1.6; margin: 0; }

/* ===== EMPTY STATE ===== */

.empty-state {

  text-align: center;

  padding: 24px 0;

  color: #9ca3af;

  font-size: 13px;

  line-height: 1.7;

}

/* ===== GHOST (DRAG) ===== */

.ghost { opacity: 0.4; background: #eff6ff; border: 1px dashed #3b82f6; }

/* ===== DELETE MODAL ===== */

.modal-backdrop {

  position: fixed;

  inset: 0;

  background: rgba(0,0,0,0.4);

  display: flex;

  justify-content: center;

  align-items: center;

  z-index: 9999;

}

.modal {

  background: white;

  border-radius: 16px;

  width: 400px;

  max-width: 92%;

  overflow: hidden;

  box-shadow: 0 20px 60px rgba(0,0,0,0.2);

}

.modal-header {

  padding: 18px 20px;

  border-bottom: 1px solid #eef2f7;

}

.modal-header h3 { margin: 0; font-size: 15px; font-weight: 600; color: #dc2626; }

.modal-header p { margin: 4px 0 0; font-size: 12px; color: #9ca3af; }

.modal-body {

  padding: 18px 20px;

  font-size: 13px;

  color: #374151;

  line-height: 1.6;

}

.modal-footer {

  display: flex;

  justify-content: flex-end;

  gap: 8px;

  padding: 14px 20px;

  border-top: 1px solid #eef2f7;

  background: #fafafa;

}

.copy-from-wrap {

  margin-bottom: 6px;

}

.copy-from-select {

  width: 100%;

  padding: 5px 8px;

  border: 1px dashed #d1d5db;

  border-radius: 7px;

  font-size: 11px;

  color: #6b7280;

  background: white;

  cursor: pointer;

  outline: none;

  transition: all 0.15s;

}

.copy-from-select:hover {

  border-color: #9ca3af;

  color: #374151;

}

.copy-from-select:focus {

  border-color: #3b82f6;

  color: #111827;

}

.options-actions {

  display: flex;

  align-items: center;

  gap: 6px;

  margin-top: 4px;

  position: relative;

}

.btn-copy-opt {

  font-size: 11px;

  color: #2563eb;

  background: #eff6ff;

  border: 1px solid #bfdbfe;

  border-radius: 6px;

  padding: 4px 10px;

  cursor: pointer;

  transition: all 0.15s;

  white-space: nowrap;

}

.btn-copy-opt:hover {

  background: #dbeafe;

  border-color: #93c5fd;

}

.copy-wrap {

  position: relative;

}

.copy-menu {

  position: absolute;

  bottom: calc(100% + 4px);

  left: 0;

  background: white;

  border: 1px solid #e5e7eb;

  border-radius: 10px;

  box-shadow: 0 8px 24px rgba(0,0,0,0.1);

  z-index: 100;

  min-width: 200px;

  overflow: hidden;

}

.copy-menu-item {

  padding: 8px 12px;

  cursor: pointer;

  display: flex;

  flex-direction: column;

  gap: 2px;

  transition: background 0.15s;

  border-bottom: 1px solid #f1f5f9;

}

.copy-menu-item:last-child {

  border-bottom: none;

}

.copy-menu-item:hover {

  background: #eff6ff;

}

.copy-menu-name {

  font-size: 12px;

  font-weight: 500;

  color: #111827;

}

.copy-menu-preview {

  font-size: 11px;

  color: #9ca3af;

  white-space: nowrap;

  overflow: hidden;

  text-overflow: ellipsis;

}

/* ===== MATURE ACTION BUTTONS ===== */

.action-btn {

  width: 28px;

  height: 28px;

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

/* ===== TEMPLATE ADD/EDIT CHOOSER ===== */

.template-row {

  display: flex;

  align-items: center;

  gap: 8px;

  font-size: 12px;

  padding: 6px 10px;

  border: 1px solid #eef2f7;

  border-radius: 8px;

  background: #fafafa;

}

.template-row-icon { font-size: 13px; flex-shrink: 0; }

.template-choice-btn {

  width: auto;

  flex: 1;

  padding: 10px 14px;

}

.template-add-panel {

  border: 1px solid #eef2f7;

  border-radius: 10px;

  padding: 12px;

  background: #fafafa;

}

.template-add-header {

  display: flex;

  justify-content: space-between;

  align-items: center;

  margin-bottom: 10px;

}


/* ===== UPCOMING ALERT SETTINGS ===== */

.upcoming-section {
  padding: 14px;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  background: #fafafa;
}

.upcoming-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.upcoming-description {
  margin-top: 4px;
  font-size: 11px;
  color: #9ca3af;
  line-height: 1.5;
}

.upcoming-config {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
  margin-top: 14px;
  padding-top: 14px;
  border-top: 1px solid #e5e7eb;
}

.upcoming-field {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.upcoming-field.full-width {
  grid-column: 1 / -1;
}

.upcoming-hint {
  font-size: 10px;
  color: #9ca3af;
}

.lead-time-row {
  display: grid;
  grid-template-columns: 1fr 120px;
  gap: 8px;
}

.upcoming-checkbox {
  grid-column: 1 / -1;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 11px 12px;
  border: 1px solid #e5e7eb;
  border-radius: 9px;
  background: white;
  cursor: pointer;
}

.upcoming-checkbox input {
  width: 16px;
  height: 16px;
  accent-color: #2563eb;
}

.upcoming-checkbox div {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.upcoming-checkbox strong {
  font-size: 12px;
  color: #374151;
}

.upcoming-checkbox span {
  font-size: 10px;
  color: #9ca3af;
}

.upcoming-example {
  grid-column: 1 / -1;
  padding: 11px 12px;
  border: 1px solid #fde68a;
  border-radius: 9px;
  background: #fffbeb;
  font-size: 11px;
  color: #78350f;
}

.switch {
  position: relative;
  display: inline-block;
  width: 40px;
  height: 22px;
  flex-shrink: 0;
}

.switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.switch-slider {
  position: absolute;
  cursor: pointer;
  inset: 0;
  background: #d1d5db;
  border-radius: 99px;
  transition: .2s;
}

.switch-slider::before {
  content: '';
  position: absolute;
  width: 16px;
  height: 16px;
  left: 3px;
  top: 3px;
  background: white;
  border-radius: 50%;
  transition: .2s;
  box-shadow: 0 1px 3px rgba(0,0,0,.2);
}

.switch input:checked + .switch-slider {
  background: #2563eb;
}

.switch input:checked + .switch-slider::before {
  transform: translateX(18px);
}

.monitor-slide-enter-active,
.monitor-slide-leave-active {
  transition: all .2s ease;
}

.monitor-slide-enter-from,
.monitor-slide-leave-to {
  opacity: 0;
  transform: translateY(-5px);
}

/* ===== RESPONSIVE ===== */

@media (max-width: 768px) {

  /* Leave room for hamburger */

  .page {

    padding: 56px 12px 12px;

  }

  /* Topbar stacks */

  .topbar {

    flex-direction: column;

    align-items: flex-start;

    gap: 8px;

  }

  .topbar h1 { font-size: 16px; }

  .topbar p  { font-size: 12px; }

  .topbar > div:last-child {

    width: 100%;

  }

  .btn-primary {

    width: 100% !important;

    max-width: 100% !important;

    justify-content: center;

  }

  /* Two-col stacks to single */

  .two-col {

    grid-template-columns: 1fr;

  }

  /* Editor panel gets full height scroll */

  .editor-panel {

    max-height: unset;

  }

  /* Column row stacks on mobile */

  .col-row {

    grid-template-columns: 20px 1fr 1fr;

    grid-template-rows: auto auto auto;

    gap: 6px;

  }

  /* drag handle stays col 1 row 1 */

  .drag-handle {

    grid-column: 1;

    grid-row: 1;

    padding-top: 8px;

  }

  /* name input takes rest of row 1 */

  .col-input:first-of-type {

    grid-column: 2 / 4;

    grid-row: 1;

  }

  /* type select spans row 2 */

  .col-select {

    grid-column: 2 / 4;

    grid-row: 2;

  }

  /* options/link/empty spans row 3 */

  .options-wrap,

  .col-row > .col-input:not(:first-of-type),

  .col-row > div:empty {

    grid-column: 2 / 4;

    grid-row: 3;

  }

  /* badges and remove on same row */

  .col-badges {

    grid-column: 2;

    grid-row: 4;

    padding-top: 0;

  }

  .btn-remove {

    grid-column: 3;

    grid-row: 4;

    justify-self: end;

  }

  /* Profile chips wrap nicely */

  .profile-chips {

    gap: 6px;

  }

  /* Editor footer */

  .editor-footer {

    flex-direction: row;

    justify-content: flex-end;

  }

  /* Copy menu opens upward with full width */

  .copy-menu {

    left: 0;

    right: 0;

    min-width: unset;

    width: 100%;

  }

  .upcoming-config {
    grid-template-columns: 1fr;
  }

  .upcoming-field.full-width,
  .upcoming-checkbox,
  .upcoming-example {
    grid-column: 1;
  }

  .lead-time-row {
    grid-template-columns: 1fr;
  }

  /* Template chooser buttons stack */

  .template-choice-btn + .template-choice-btn {

    margin-left: 0;

  }

  /* Placeholder shorter on mobile */

  .placeholder-panel {

    min-height: 120px;

  }

  /* Modal slides up from bottom */

  .modal-backdrop {

    align-items: flex-end;

  }

  .modal {

    width: 100%;

    max-width: 100%;

    border-radius: 16px 16px 0 0;

  }

}

.mapping-legend { display: flex; flex-wrap: wrap; gap: 6px; margin: 8px 0; }

.legend-chip { display: inline-flex; align-items: center; gap: 6px; border: 1px solid; border-radius: 99px; padding: 3px 10px; font-size: 11px; background: white; }

.legend-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }

.legend-cell { font-weight: 600; display: inline-flex; align-items: center; gap: 4px; }

.legend-clear { background: none; border: none; cursor: pointer; color: inherit; font-size: 10px; padding: 0; }

.legend-unmapped { color: #9ca3af; font-style: italic; }

.sheet-preview-wrap { overflow: auto; max-height: 420px; border: 1px solid #eef2f7; border-radius: 10px; margin-top: 10px; }

.sheet-preview { border-collapse: collapse; font-size: 11px; }

.preview-cell { border: 1px solid #f1f5f9; padding: 5px 8px; min-width: 60px; max-width: 160px; cursor: pointer; vertical-align: top; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; transition: background 0.1s; }

.preview-cell:hover { background: #f8fafc; }

.preview-cell.mapped { border-width: 1.5px; }

.preview-cell-text { display: block; }

.preview-cell-tag { display: block; font-size: 9px; font-weight: 700; text-transform: uppercase; margin-top: 2px; }

.cell-picker-backdrop { position: fixed; inset: 0; background: rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; z-index: 10000; }

.cell-picker { background: white; border-radius: 12px; padding: 8px; min-width: 220px; box-shadow: 0 20px 60px rgba(0,0,0,0.25); }

.cell-picker-title { font-size: 12px; font-weight: 600; color: #6b7280; padding: 6px 10px; }

.cell-picker-option { padding: 8px 10px; font-size: 13px; border-radius: 8px; cursor: pointer; }

.cell-picker-option:hover { background: #eff6ff; color: #1d4ed8; }

.cell-picker-option.clear { color: #ef4444; margin-top: 4px; border-top: 1px solid #f1f5f9; }



/* ================= MONITORING CONFIG ================= */

.monitoring-section {
  margin-top: 16px;
}

.monitoring-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 18px;
}

.monitoring-description {
  margin-top: 4px;
  font-size: 12px;
  line-height: 1.5;
  color: #6b7280;
}

.monitoring-config {
  margin-top: 14px;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
  padding: 14px;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  background: #f9fafb;
}

.monitoring-field {
  min-width: 0;
}

.monitoring-field.full-width {
  grid-column: 1 / -1;
}

.monitoring-hint {
  display: block;
  margin-top: 5px;
  font-size: 11px;
  color: #9ca3af;
}

.monitoring-checkbox {
  grid-column: 1 / -1;
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 10px 12px;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  background: #ffffff;
  cursor: pointer;
}

.monitoring-checkbox strong,
.monitoring-checkbox span {
  display: block;
}

.monitoring-checkbox strong {
  color: #111827;
  font-size: 13px;
}

.monitoring-checkbox span {
  margin-top: 2px;
  color: #6b7280;
  font-size: 11px;
}

.monitoring-example {
  grid-column: 1 / -1;
  padding: 10px 12px;
  border-radius: 9px;
  background: #eef6ff;
  color: #374151;
  font-size: 12px;
}

@media (max-width: 760px) {
  .monitoring-config {
    grid-template-columns: 1fr;
  }

  .monitoring-field.full-width,
  .monitoring-checkbox,
  .monitoring-example {
    grid-column: 1;
  }
}

</style>