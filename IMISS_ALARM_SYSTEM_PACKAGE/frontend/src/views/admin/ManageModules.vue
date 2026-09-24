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

        <!-- ================= LOG ALARMS ================= -->
        <div class="section" style="margin-top:16px;">
          <AlarmModuleConfig
            ref="alarmConfigRef"
            v-model="editModule.alarmConfig"
            :module-id="editModule.id || null"
            @toast="({ message, type }) => showToast(message, type)"
          />
        </div>

        <!-- ================= PRINT / EXPORT TEMPLATES ================= -->

        <div class="section" style="margin-top:16px;">

          <div class="section-label">Print / export templates</div>

          <!-- ================= TEMPLATE LIBRARY ================= -->

          <div class="template-library-card">

            <div class="template-library-header">
              <div>
                <div class="template-library-title">Template library</div>
                <div class="template-library-subtitle">
                  Forms used for row printing and filtered batch exports.
                </div>
              </div>

              <div class="template-library-count">
                {{
                  (editModule.templateFile ? 1 : 0) +
                  (editModule.templates || []).filter(t =>
                    ['docx', 'pdf'].includes(String(t.kind || '').toLowerCase())
                  ).length
                }}
                template(s)
              </div>
            </div>

            <div class="template-library-list">

              <!-- EXCEL TEMPLATE -->
              <div
                v-if="editModule.templateFile"
                class="template-library-row"
              >
                <div class="template-type-icon excel">X</div>

                <div class="template-library-info">
                  <div class="template-library-name">Excel batch form</div>
                  <div class="template-library-meta">
                    Excel · {{ editModule.templateFile }}
                  </div>
                </div>

                <div class="template-library-controls">
                  <span class="template-mode-static batch">
                    Batch / filtered
                  </span>

                  <button
                    type="button"
                    class="template-edit-btn"
                    @click="startAddTemplate('excel')"
                  >
                    Edit mapping
                  </button>

                  <button
                    type="button"
                    class="template-delete-btn"
                    @click="deleteExcelTemplate()"
                    title="Remove Excel template"
                  >
                    ✕
                  </button>
                </div>
              </div>

              <!-- WORD TEMPLATES -->
              <div
                v-for="t in editModule.templates.filter(t => String(t.kind || '').toLowerCase() === 'docx')"
                :key="'docx-' + t.id"
                class="template-library-row"
              >
                <div class="template-type-icon word">W</div>

                <div class="template-library-info">
                  <div class="template-library-name">
                    {{ t.name || 'Word form' }}
                  </div>
                  <div class="template-library-meta">
                    Word · {{ t.fileName }}
                  </div>
                </div>

                <div class="template-library-controls">
                  <select
                    :value="t.printMode || 'row'"
                    class="template-mode-select-clean"
                    @change="updateTemplatePrintMode(t, $event.target.value)"
                    title="Choose how this form is used"
                  >
                    <option value="row">Per row</option>
                    <option value="batch">Batch / filtered</option>
                  </select>

                  <button
                    type="button"
                    class="template-delete-btn"
                    @click="deleteDocxTemplate(t.id)"
                    title="Remove Word template"
                  >
                    ✕
                  </button>
                </div>
              </div>

              <!-- PDF TEMPLATES / PENDING PDF -->
              <PdfTemplateManager
                ref="pdfTemplateManagerRef"
                :module-data="editModule"
                :active-module-id="activeModule?.id"
                @notify="handlePdfNotify"
                @template-saved="handlePdfTemplateSaved"
                @template-deleted="handlePdfTemplateDeleted"
                @template-uploaded="handlePdfTemplateUploaded"
                @module-refreshed="handlePdfModuleRefreshed"
              />

            </div>

            <!-- ONE CONSISTENT ADD BAR -->
            <div
              v-if="!addTemplateType"
              class="template-library-addbar"
            >
              <button
                type="button"
                class="template-add-btn excel"
                @click="startAddTemplate('excel')"
              >
                <span class="template-add-icon">X</span>
                <span>Excel template</span>
              </button>

              <button
                type="button"
                class="template-add-btn word"
                @click="startAddTemplate('docx')"
              >
                <span class="template-add-icon">W</span>
                <span>Word template</span>
              </button>

              <button
                type="button"
                class="template-add-btn pdf"
                @click="openPdfTemplateManager"
              >
                <span class="template-add-icon">PDF</span>
                <span>PDF template</span>
              </button>
            </div>

          </div>

          <!-- ADD/EDIT PANEL — only one template type shown at a time -->

          <div v-if="addTemplateType" class="template-add-panel">

            <div class="template-add-header">

              <span class="section-label" style="margin:0;">

                {{
                  addTemplateType === 'excel'
                    ? 'Excel template — Batch / filtered'
                    : 'Word template'
                }}

              </span>

              <button class="btn-ghost-sm" @click="cancelAddTemplate" type="button">✕</button>

            </div>

            <!-- ===== EXCEL FLOW (legacy single-Excel-template) ===== -->

            <template v-if="addTemplateType === 'excel'">

              <div class="print-mode-card batch-mode-card">
                <div class="print-mode-card-title">
                  <span>Print mode</span>
                  <strong>Batch / filtered records</strong>
                </div>

                <p>
                  This Excel template is filled from the records currently matching
                  the module filters. When the configured number of records is reached,
                  another complete copy of the Excel form is created as the next sheet/page.
                </p>

                <div class="batch-config-grid">
                  <div>
                    <label class="form-label">First record row</label>
                    <input
                      v-model.number="editModule.templateStartRow"
                      type="number"
                      min="1"
                      class="form-input"
                    />
                    <span class="batch-config-hint">
                      For your condemnation letter: 16
                    </span>
                  </div>

                  <div>
                    <label class="form-label">Rows per record</label>
                    <input
                      v-model.number="editModule.templateRowsPerRecord"
                      type="number"
                      min="1"
                      class="form-input"
                    />
                    <span class="batch-config-hint">
                      Condemnation example: 2 (row 16 item + row 17 SN)
                    </span>
                  </div>

                  <div>
                    <label class="form-label">Records per page</label>
                    <input
                      v-model.number="editModule.templateRowsPerPage"
                      type="number"
                      min="1"
                      class="form-input"
                    />
                    <span class="batch-config-hint">
                      Example: 10 equipment records per letter page
                    </span>
                  </div>
                </div>

                <div class="batch-config-note">
                  <strong>How rows per record are detected:</strong>
                  map all cells used by one item. For example, map
                  <code>Item Description</code> to the description cell on row 16 and
                  <code>Serial Number</code> to the SN cell on row 17.
                  The system automatically treats that as a 2-row record.
                  Fixed template values such as <code>1</code>, <code>unit</code>,
                  borders and labels are copied with the record block.
                </div>
              </div>

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

                  <colgroup>
                    <col
                      v-for="(width, c) in previewColumnWidths"
                      :key="'preview-col-' + c"
                      :style="{ width: width + 'px', minWidth: width + 'px' }"
                    />
                  </colgroup>

                  <tbody>

                    <tr
                      v-for="(row, r) in previewGrid"
                      :key="r"
                      :style="{
                        height: (previewRowHeights[r] || 22) + 'px'
                      }"
                    >

                      <template v-for="(cell, c) in row" :key="c">

                        <td

                          v-if="!cell.hidden"

                          :rowspan="cell.rowspan"

                          :colspan="cell.colspan"

                          :class="['preview-cell', { mapped: mappingForCell(cell.address) }]"

                          :style="[
                            cell.excelStyle || {},
                            mappingForCell(cell.address)
                              ? cellMappedStyle(cell.address)
                              : {}
                          ]"

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

            <template v-else-if="addTemplateType === 'docx'">

              <div
                :class="[
                  'print-mode-card',
                  newDocxPrintMode === 'batch'
                    ? 'batch-mode-card'
                    : 'row-mode-card'
                ]"
              >
                <div class="print-mode-card-title">
                  <span>Print mode</span>

                  <select
                    v-model="newDocxPrintMode"
                    class="form-input print-mode-select"
                  >
                    <option value="row">Per row</option>
                    <option value="batch">Batch / filtered records</option>
                  </select>
                </div>

                <p v-if="newDocxPrintMode === 'row'">
                  One selected log record fills this Word template.
                  The Fill &amp; Print icon remains available on each row.
                </p>

                <template v-else>
                  <p>
                    The current filtered logs fill one Word document.
                    Use a Docxtemplater loop in the Word file.
                  </p>

                  <div class="docx-batch-loop">
                    <label class="form-label">Loop name</label>

                    <input
                      v-model="newDocxBatchLoopName"
                      class="form-input"
                      placeholder="items"
                    />

                    <div class="docx-loop-example">
                      Example in Word:
                      <code>{#{{ newDocxBatchLoopName || 'items' }}}</code>
                      <code>{{ tagFor('Item Description') }}</code>
                      <code>{{ tagFor('Serial Number') }}</code>
                      <code>{/{{ newDocxBatchLoopName || 'items' }}}</code>
                    </div>
                  </div>
                </template>
              </div>

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

            <!-- ===== PDF FLOW — EXCEL-LIKE VISUAL BATCH MAPPER ===== -->

            

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

import { ref, onMounted, nextTick } from 'vue'

import draggable from 'vuedraggable'

import api from '@/api/axios'

import PdfTemplateManager from '@/components/modules/templates/PdfTemplateManager.vue'

import AlarmModuleConfig from '@/components/alarms/AlarmModuleConfig.vue'

import * as XLSX from 'xlsx'

/* ================= STATE ================= */

const modules = ref([])

const profiles = ref([])

const activeModule = ref(null)

const editorMode = ref(null) // 'create' | 'edit' | null

const saving = ref(false)

const selectedTemplate = ref(null)

const pdfTemplateManagerRef = ref(null)

const alarmConfigRef = ref(null)

const openPdfTemplateManager = () => {
  pdfTemplateManagerRef.value?.openNewPdf?.()
}


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


const defaultAlarmConfig = () => ({
  enabled: false,
  mode: 'both',
  defaultLeadValue: 1,
  defaultLeadUnit: 'hours',
  defaultMessage: '',
  mediaFile: null,
  mediaFileName: null,
  mediaMime: null,
  mediaStartSeconds: 0,
  mediaEndSeconds: 10,
  repeatMode: 'untilDismissed',
  repeatCount: 5,
  repeatDelaySeconds: 3,
  maxAudibleSeconds: 120,
  inAppPopup: true,
  browserNotification: true,
  allowSnooze: true,
})


const editModule = ref({

  name: '',

  columns: [],

  allowedProfiles: [],

  monitoringConfig: defaultMonitoringConfig(),

  upcomingConfig: defaultUpcomingConfig(),

  alarmConfig: defaultAlarmConfig(),

  templateStartRow: 8,

  templateRowsPerRecord: 1,

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

const handlePdfNotify = ({
  message,
  type = 'success'
}) => {

  showToast(
    message,
    type
  )

}


const mergePdfTemplateIntoEditor = (
  template
) => {

  if (
    !template?.id
  ) {
    return
  }

  const templates =
    Array.isArray(
      editModule.value.templates
    )
      ? editModule.value.templates
      : []

  const index =
    templates.findIndex(
      item =>
        Number(item.id) ===
        Number(template.id)
    )

  if (
    index >= 0
  ) {

    templates[index] = {
      ...templates[index],
      ...template
    }

  } else {

    templates.push(
      template
    )

  }

  editModule.value.templates =
    templates

}


const handlePdfTemplateSaved = (
  template
) => {

  mergePdfTemplateIntoEditor(
    template
  )

}


const handlePdfTemplateUploaded = (
  template
) => {

  mergePdfTemplateIntoEditor(
    template
  )

}


const handlePdfTemplateDeleted = (
  templateId
) => {

  editModule.value.templates =
    (
      editModule.value.templates ||
      []
    ).filter(
      template =>
        Number(template.id) !==
        Number(templateId)
    )

}


const handlePdfModuleRefreshed = (
  freshModule
) => {

  if (
    !freshModule?.id
  ) {
    return
  }

  const index =
    modules.value.findIndex(
      item =>
        Number(item.id) ===
        Number(freshModule.id)
    )

  if (
    index < 0
  ) {
    return
  }

  modules.value[index] = {
    ...freshModule,

    columns:
      typeof freshModule.columns ===
      'string'
        ? JSON.parse(
            freshModule.columns
          )
        : freshModule.columns,

    monitoringConfig:
      parseMonitoringConfig(
        freshModule.monitoringConfig
      ),

    upcomingConfig:
      parseUpcomingConfig(
        freshModule.upcomingConfig
      )
  }

}

/* ================= TEMPLATE ADD/EDIT CHOOSER =================

   Controls which single template flow (Excel or Word) is shown at a time,

   instead of always rendering both upload UIs together. */

const addTemplateType = ref(null) // null | 'excel' | 'docx'

const startAddTemplate = (type) => {

  addTemplateType.value = type

  if (
    type === 'excel' &&
    editModule.value.templateFile &&
    !previewGrid.value.length
  ) {

    /*
     * Pull the existing workbook in so the mapping grid is ready to edit.
     */
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

const previewColumnWidths = ref([])
const previewRowHeights = ref([])

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

  const sheetRef =
    worksheet['!ref']

  if (!sheetRef) {
    previewGrid.value = []
    previewColumnWidths.value = []
    previewRowHeights.value = []
    return
  }

  const range =
    XLSX.utils.decode_range(
      sheetRef
    )

  const merges =
    worksheet['!merges'] ||
    []

  const excelCols =
    worksheet['!cols'] ||
    []

  const excelRows =
    worksheet['!rows'] ||
    []

  const anchorInfo = {}
  const hiddenSet =
    new Set()

  merges.forEach(m => {

    const rowspan =
      m.e.r -
      m.s.r +
      1

    const colspan =
      m.e.c -
      m.s.c +
      1

    anchorInfo[
      `${m.s.r},${m.s.c}`
    ] = {
      rowspan,
      colspan
    }

    for (
      let r = m.s.r;
      r <= m.e.r;
      r++
    ) {
      for (
        let c = m.s.c;
        c <= m.e.c;
        c++
      ) {
        if (
          r === m.s.r &&
          c === m.s.c
        ) {
          continue
        }

        hiddenSet.add(
          `${r},${c}`
        )
      }
    }

  })

  /*
   * Excel column widths are not ordinary CSS pixels.
   * Convert them to practical browser widths while keeping
   * the proportions from the uploaded spreadsheet.
   */
  const widths = []

  for (
    let c = range.s.c;
    c <= range.e.c;
    c++
  ) {

    const colInfo =
      excelCols[c] ||
      {}

    let widthPx

    if (
      Number.isFinite(
        colInfo.wpx
      )
    ) {
      widthPx =
        colInfo.wpx
    } else if (
      Number.isFinite(
        colInfo.wch
      )
    ) {
      widthPx =
        colInfo.wch * 7 + 8
    } else {
      widthPx = 64
    }

    if (
      colInfo.hidden
    ) {
      widthPx = 0
    }

    widths.push(
      Math.max(
        0,
        Math.min(
          420,
          Math.round(
            widthPx
          )
        )
      )
    )

  }

  previewColumnWidths.value =
    widths

  const maxRow =
    Math.min(
      range.e.r,
      80
    )

  const rowHeights = []
  const grid = []

  for (
    let r = range.s.r;
    r <= maxRow;
    r++
  ) {

    const excelRow =
      excelRows[r] ||
      {}

    let rowHeight =
      22

    if (
      Number.isFinite(
        excelRow.hpx
      )
    ) {
      rowHeight =
        excelRow.hpx
    } else if (
      Number.isFinite(
        excelRow.hpt
      )
    ) {
      rowHeight =
        excelRow.hpt *
        (96 / 72)
    }

    if (
      excelRow.hidden
    ) {
      rowHeight = 0
    }

    rowHeights.push(
      Math.max(
        0,
        Math.min(
          180,
          Math.round(
            rowHeight
          )
        )
      )
    )

    const row = []

    for (
      let c = range.s.c;
      c <= range.e.c;
      c++
    ) {

      const address =
        XLSX.utils.encode_cell({
          r,
          c
        })

      const key =
        `${r},${c}`

      if (
        hiddenSet.has(
          key
        )
      ) {
        row.push({
          hidden: true
        })

        continue
      }

      const cellObj =
        worksheet[address]

      const info =
        anchorInfo[key]

      const alignment =
        cellObj?.s?.alignment ||
        {}

      const excelStyle = {
        textAlign:
          alignment.horizontal === 'center'
            ? 'center'
            : alignment.horizontal === 'right'
              ? 'right'
              : 'left',

        verticalAlign:
          alignment.vertical === 'center'
            ? 'middle'
            : alignment.vertical === 'bottom'
              ? 'bottom'
              : 'top',

        whiteSpace:
          alignment.wrapText
            ? 'pre-wrap'
            : 'nowrap',

        overflow:
          alignment.wrapText
            ? 'visible'
            : 'hidden',

        fontWeight:
          cellObj?.s?.font?.bold
            ? '700'
            : '400',

        fontStyle:
          cellObj?.s?.font?.italic
            ? 'italic'
            : 'normal',

        fontSize:
          cellObj?.s?.font?.sz
            ? `${Math.max(
                9,
                Math.min(
                  22,
                  cellObj.s.font.sz
                )
              )}px`
            : undefined
      }

      row.push({
        address,

        value:
          cellObj
            ? String(
                cellObj.w ??
                cellObj.v ??
                ''
              )
            : '',

        rowspan:
          info?.rowspan ||
          1,

        colspan:
          info?.colspan ||
          1,

        hidden:
          false,

        excelStyle
      })

    }

    grid.push(
      row
    )

  }

  previewRowHeights.value =
    rowHeights

  previewGrid.value =
    grid

}

const parseWorkbookFile = (file) => {

  const reader = new FileReader()

  reader.onload = (e) => {

    const wb = XLSX.read(
      e.target.result,
      {
        type: 'array',
        cellStyles: true,
        cellText: true,
        cellDates: true
      }
    )

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

    const wb = XLSX.read(
      res.data,
      {
        type: 'array',
        cellStyles: true,
        cellText: true,
        cellDates: true
      }
    )

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

const newDocxPrintMode = ref('row')

const newDocxBatchLoopName = ref('items')

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

    formData.append(
      'printMode',
      newDocxPrintMode.value
    )

    formData.append(
      'batchConfig',
      JSON.stringify({
        source: 'filtered',
        loopName:
          newDocxBatchLoopName.value ||
          'items'
      })
    )

    await api.post(`/modules/${moduleId}/templates`, formData, {

      headers: { 'Content-Type': 'multipart/form-data' },

    })

  } catch (err) {

    console.error(err)

    showToast('Module saved, but the Word template failed to upload', 'error')

  } finally {

    pendingDocxFile.value = null

    newDocxName.value = ''

    newDocxPrintMode.value = 'row'

    newDocxBatchLoopName.value = 'items'

  }

}

// Builds the display tag (e.g. "{{DateStarted}}") for a column.

// Kept as a function rather than inline template string concatenation,

// since Vue's compiler misparses a literal '{{' inside a mustache expression.


/* ================= EXCEL-LIKE GENERIC PDF MAPPER ================= */

const tagFor = (name) => '{{' + name.replace(/[^a-zA-Z0-9]/g, '') + '}}'

const updateTemplatePrintMode = async (
  template,
  printMode
) => {
  try {
    const batchConfig =
      template.batchConfig || {
        source: 'filtered',
        loopName: 'items'
      }

    await api.put(
      `/modules/templates/${template.id}/config`,
      {
        printMode,
        batchConfig
      }
    )

    template.printMode =
      printMode

    showToast(
      'Template print mode updated',
      'success'
    )
  } catch (err) {
    console.error(err)

    showToast(
      'Failed to update template print mode',
      'error'
    )
  }
}


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

    alarmConfig: defaultAlarmConfig(),

    templateStartRow: 8,

    templateRowsPerRecord: 1,

    templateRowsPerPage: 9,

    templateMappings: [],

    templates: [],

  }

  nextTick(() => {
    alarmConfigRef.value?.reset?.()
  })

}

const openEdit = async (m) => {

  pdfTemplateManagerRef.value
    ?.resetPdfFeature()

  /*
   * IMPORTANT:
   * Always reload the module from the backend before opening.
   *
   * Vite HMR can preserve an old in-memory module object. That can leave
   * deleted template IDs (for example template 12) visible in the editor
   * even though they no longer exist in module_template.
   */
  let fresh = m

  try {

    const res =
      await api.get(
        `/modules/single/${m.id}`
      )

    if (res?.data) {
      fresh = res.data

      /*
       * Replace the stale module in the local module list too.
       */
      const moduleIndex =
        modules.value.findIndex(
          item =>
            Number(item.id) ===
            Number(m.id)
        )

      if (moduleIndex >= 0) {
        modules.value[moduleIndex] = {
          ...fresh,
          columns:
            typeof fresh.columns === 'string'
              ? JSON.parse(fresh.columns)
              : fresh.columns,

          monitoringConfig:
            parseMonitoringConfig(
              fresh.monitoringConfig
            ),

          upcomingConfig:
            parseUpcomingConfig(
              fresh.upcomingConfig
            )
        }
      }
    }

  } catch (err) {

    console.error(
      'Failed to refresh module before editing:',
      err
    )

    showToast(
      'Could not refresh module data. Using the currently loaded copy.',
      'error'
    )

  }


  activeModule.value =
    fresh

  editorMode.value =
    'edit'

  selectedTemplate.value =
    null

  previewGrid.value =
    []

  workbookRef.value =
    null

  pendingDocxFile.value =
    null
  newDocxName.value =
    ''
  addTemplateType.value =
    null


  let parsedColumns =
    fresh.columns

  if (
    typeof parsedColumns ===
    'string'
  ) {
    parsedColumns =
      JSON.parse(
        parsedColumns
      )
  }


  editModule.value = {

    ...fresh,

    columns:
      Array.isArray(
        parsedColumns
      )
        ? parsedColumns.map(
            col => ({

              uid:
                Date.now() +
                Math.random(),

              ...col,

              parsedOptions: (() => {

                const raw =
                  typeof col.options ===
                  'string'
                    ? JSON.parse(
                        col.options
                      )
                    : (
                        col.options ||
                        []
                      )

                return raw.map(
                  o =>
                    typeof o ===
                    'object'
                      ? o
                      : {
                          label:
                            o,

                          color:
                            '#6b7280'
                        }
                )

              })(),

              baseUrl:
                col.baseUrl ||
                ''

            })
          )
        : [],

    allowedProfiles:
      fresh.allowedProfiles
        ?.map(
          p =>
            Number(
              typeof p ===
              'object'
                ? p.id
                : p
            )
        ) ||
      [],

    monitoringConfig:
      parseMonitoringConfig(
        fresh.monitoringConfig
      ),

    upcomingConfig:
      parseUpcomingConfig(
        fresh.upcomingConfig
      ),

    alarmConfig:
      defaultAlarmConfig(),

    /*
     * Preserve the actual saved Excel batch settings.
     * The old code reset these to 8 / 1 / 9 every time Edit was opened.
     */
    templateStartRow:
      fresh.templateStartRow ??
      8,

    templateRowsPerRecord:
      fresh.templateRowsPerRecord ??
      1,

    templateRowsPerPage:
      fresh.templateRowsPerPage ??
      9,

    templateMappings:
      fresh.templateMappings
        ? (
            typeof fresh.templateMappings ===
            'string'
              ? JSON.parse(
                  fresh.templateMappings
                )
              : fresh.templateMappings
          )
        : [],

    /*
     * This is now always the fresh database relation returned by
     * GET /modules/single/:id, so deleted template IDs disappear.
     */
    templates:
      Array.isArray(
        fresh.templates
      )
        ? fresh.templates
        : [],

  }

  await nextTick()
  await alarmConfigRef.value?.loadForModule?.(fresh.id)

}


const closeEditor = () => {

  pdfTemplateManagerRef.value
    ?.resetPdfFeature()

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

      templateRowsPerRecord: editModule.value.templateRowsPerRecord,

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

    await pdfTemplateManagerRef.value
      ?.uploadPendingPdfTemplate(
        res.data.id
      )

    await alarmConfigRef.value
      ?.saveToModule?.(res.data.id)

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


const deleteExcelTemplate = async () => {
  if (!editModule.value.id) return

  if (
    !window.confirm(
      'Remove this batch Excel template?'
    )
  ) {
    return
  }

  try {
    await api.delete(
      `/modules/${editModule.value.id}/template`
    )

    editModule.value.templateFile = null
    editModule.value.templateFileName = null
    editModule.value.templateFileMime = null
    editModule.value.templateMappings = []

    selectedTemplate.value = null
    previewGrid.value = []
    workbookRef.value = null
    pickerCell.value = null

    showToast(
      'Excel template removed successfully',
      'success'
    )

    await loadModules()
  } catch (err) {
    console.error(err)

    showToast(
      'Failed to remove Excel template',
      'error'
    )
  }
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

      templateRowsPerRecord: editModule.value.templateRowsPerRecord,

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

    await pdfTemplateManagerRef.value
      ?.uploadPendingPdfTemplate(
        editModule.value.id
      )

    await alarmConfigRef.value
      ?.saveToModule?.(editModule.value.id)

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

<style scoped src="../../styles/manage-modules.css"></style>
