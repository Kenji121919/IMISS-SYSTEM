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

              <span style="flex:1;">Excel — {{ editModule.templateFile }} <strong class="template-mode-badge batch">Batch / filtered</strong></span>

              <button class="btn-copy-opt" @click="startAddTemplate('excel')" type="button">Edit mapping</button>

              <button class="btn-remove" @click="deleteExcelTemplate()" title="Remove" type="button" > ✕ </button>

            </div>

            <div

              v-for="t in editModule.templates.filter(t => t.kind === 'docx')"

              :key="t.id"

              class="template-row"

            >

              <span class="template-row-icon">📄</span>

              <span style="flex:1;">
                Word — {{ t.name }} ({{ t.fileName }})
                <strong
                  :class="[
                    'template-mode-badge',
                    t.printMode === 'batch'
                      ? 'batch'
                      : 'row'
                  ]"
                >
                  {{
                    t.printMode === 'batch'
                      ? 'Batch / filtered'
                      : 'Per row'
                  }}
                </strong>
              </span>

              <select
                :value="t.printMode || 'row'"
                class="template-mode-inline-select"
                @change="updateTemplatePrintMode(t, $event.target.value)"
              >
                <option value="row">Per row</option>
                <option value="batch">Batch / filtered</option>
              </select>

              <button class="btn-remove" @click="deleteDocxTemplate(t.id)" title="Remove">✕</button>

            </div>

          </div>


            <div
              v-for="t in editModule.templates.filter(t => t.kind === 'pdf')"
              :key="'pdf-' + t.id"
              class="template-row"
            >
              <span class="template-row-icon">📕</span>

              <span style="flex:1;">
                PDF — {{ t.name }} ({{ t.fileName }})
                <strong
                  :class="[
                    'template-mode-badge',
                    String(t.printMode || 'batch').toLowerCase() === 'row'
                      ? 'row'
                      : 'batch'
                  ]"
                >
                  {{
                    String(t.printMode || 'batch').toLowerCase() === 'row'
                      ? 'Fill & Print / per row'
                      : 'Batch / filtered'
                  }}
                </strong>
              </span>

              <select
                :value="t.printMode || 'batch'"
                class="template-mode-inline-select"
                @change="updateTemplatePrintMode(t, $event.target.value)"
                title="Choose how this PDF is used"
              >
                <option value="row">Fill & Print / per row</option>
                <option value="batch">Batch / filtered</option>
              </select>

              <button
                type="button"
                class="btn-template-edit"
                @click="editPdfTemplate(t)"
                title="Edit PDF mapping"
              >
                Edit mapping
              </button>

              <button
                class="btn-remove"
                @click="deleteDocxTemplate(t.id)"
                title="Remove"
              >
                ✕
              </button>
            </div>

          <!-- PENDING PDF — configured in popup, uploaded when module is saved -->
          <div
            v-if="pendingPdfFile && addTemplateType !== 'pdf'"
            class="template-row pending-pdf-template-row"
          >
            <span class="template-row-icon">📕</span>

            <span style="flex:1;">
              PDF — {{ newPdfName || 'PDF Form' }} ({{ pendingPdfFile.name }})
              <strong
                :class="[
                  'template-mode-badge',
                  newPdfPrintMode === 'row'
                    ? 'row'
                    : 'batch'
                ]"
              >
                {{
                  newPdfPrintMode === 'row'
                    ? 'Fill & Print / per row'
                    : 'Batch / filtered'
                }}
              </strong>

              <small class="pending-template-note">
                Ready — will upload when you save the module.
              </small>
            </span>

            <button
              type="button"
              class="btn-template-edit"
              @click="reopenPendingPdfMapping"
            >
              Edit mapping
            </button>

            <button
              type="button"
              class="btn-remove"
              @click="discardPendingPdfTemplate"
              title="Discard pending PDF"
            >
              ✕
            </button>
          </div>

          <!-- CHOOSER: pick which type of template to add -->

          <div v-if="!addTemplateType" style="display:flex;gap:8px;">

            <button class="btn-add-col template-choice-btn" @click="startAddTemplate('excel')" type="button">

              + Add Excel template

            </button>

            <button class="btn-add-col template-choice-btn" @click="startAddTemplate('docx')" type="button">

              + Add Word template

            </button>

            <button class="btn-add-col template-choice-btn" @click="startAddTemplate('pdf')" type="button">

              + Add PDF template

            </button>

          </div>

          <!-- ADD/EDIT PANEL — only one template type shown at a time -->

          <div v-else class="template-add-panel">

            <div class="template-add-header">

              <span class="section-label" style="margin:0;">

                {{
                  addTemplateType === 'excel'
                    ? 'Excel template — Batch / filtered'
                    : addTemplateType === 'docx'
                      ? 'Word template'
                      : 'PDF template — Batch / filtered'
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

            <template v-else-if="addTemplateType === 'pdf'">

              <div
                class="pdf-editor-shell pdf-editor-shell-modal"
              >
                <div
                  class="pdf-editor-surface pdf-editor-surface-modal"
                >
                  <div class="pdf-editor-modal-header">
                    <div>
                      <h3>
                        {{
                          editingPdfTemplateId
                            ? 'Edit PDF Form Mapping'
                            : 'Add PDF Form'
                        }}
                      </h3>

                      <p v-if="editingPdfTemplateId">
                        {{ newPdfName }} · {{ editingPdfFileName }}
                      </p>

                      <p v-else>
                        Upload a PDF, choose Per row or Batch, then visually map the fields.
                      </p>
                    </div>

                    <button
                      type="button"
                      class="pdf-editor-modal-close"
                      @click="cancelAddTemplate"
                      :title="
                        editingPdfTemplateId
                          ? 'Close mapper'
                          : 'Cancel new PDF form'
                      "
                    >
                      ✕
                    </button>
                  </div>

              <div
                :class="[
                  'print-mode-card',
                  newPdfPrintMode === 'row'
                    ? 'row-mode-card'
                    : 'batch-mode-card'
                ]"
              >
                <div class="print-mode-card-title">
                  <span>Print mode</span>

                  <select
                    v-model="newPdfPrintMode"
                    class="template-mode-inline-select"
                    @change="onPdfPrintModeChange"
                  >
                    <option value="row">
                      Fill & Print / per row
                    </option>

                    <option value="batch">
                      Batch / filtered records
                    </option>
                  </select>
                </div>

                <p v-if="newPdfPrintMode === 'row'">
                  Use this PDF as the Fill & Print form for one selected log row.
                  Map every field exactly once. No Record 2 spacing is needed.
                </p>

                <p v-else>
                  Use this PDF for filtered batch printing. Map Record 1, then
                  position the green Record 2 block so all repeating fields keep
                  the same horizontal alignment and spacing.
                </p>
              </div>

              <div class="pdf-template-top-row">
                <input
                  type="text"
                  v-model="newPdfName"
                  placeholder="Template name"
                  class="col-input"
                />

                <template v-if="!editingPdfTemplateId">
                  <input
                    type="file"
                    accept=".pdf"
                    @change="onPdfSelected"
                  />
                </template>

                <template v-else>
                  <div class="pdf-existing-file">
                    Editing existing PDF:
                    <strong>{{ editingPdfFileName }}</strong>
                  </div>
                </template>
              </div>

              <div
                v-if="pendingPdfFile"
                class="pdf-selected-file"
              >
                Selected: {{ pendingPdfFile.name }} — will upload on save
              </div>

              <div class="pdf-generic-config">

                <!-- ================= PAGE / BATCH SETTINGS ================= -->

                <div class="pdf-section-card">
                  <div class="pdf-section-title">
                    1. {{
                      newPdfPrintMode === 'row'
                        ? 'Form settings'
                        : 'Batch settings'
                    }}
                  </div>

                  <div class="batch-config-grid">
                    <div v-if="newPdfPrintMode === 'batch'">
                      <label class="form-label">Records per page</label>

                      <input
                        v-model.number="pdfBatchConfig.recordsPerPage"
                        type="number"
                        min="1"
                        max="100"
                        class="form-input"
                      />
                    </div>

                    <div v-else>
                      <label class="form-label">Records per page</label>

                      <div class="pdf-calculated-field">
                        1 record
                      </div>

                      <span class="batch-config-hint">
                        Per-row Fill & Print always generates one selected record.
                      </span>
                    </div>

                    <div>
                      <label class="form-label">Template page</label>

                      <input
                        v-model.number="pdfBatchConfig.templatePage"
                        type="number"
                        min="1"
                        class="form-input"
                      />

                      <span class="batch-config-hint">
                        Page copied for every generated page. Usually 1.
                      </span>
                    </div>

                    <div v-if="newPdfPrintMode === 'batch'">
                      <label class="form-label">Calculated row spacing</label>

                      <div class="pdf-calculated-field">
                        {{
                          pdfBatchConfig.recordGapY
                            ? Number(pdfBatchConfig.recordGapY).toFixed(2) + ' pt'
                            : 'Not set'
                        }}
                      </div>

                      <span class="batch-config-hint">
                        Controlled by the movable Record 2 block. All repeating fields use this same spacing.
                      </span>
                    </div>
                  </div>
                </div>

                <!-- ================= RECORD BLOCK SPACING ================= -->

                <div
                  v-if="newPdfPrintMode === 'batch'"
                  class="pdf-section-card"
                >
                  <div class="pdf-section-title">
                    2. Position Record 2 block
                  </div>

                  <div class="pdf-anchor-help">
                    First map every repeating field in Record 1. Then create a
                    Record 2 preview. The whole green Record 2 block moves together
                    vertically, while all X positions remain exactly aligned with
                    Record 1.
                  </div>

                  <div class="pdf-record-block-controls">

                    <button
                      type="button"
                      class="btn-add-col"
                      @click="preparePdfRecord2Block"
                      :disabled="!hasRepeatingPdfFields"
                    >
                      {{
                        Number(pdfBatchConfig.recordGapY) > 0
                          ? 'Reset / position Record 2'
                          : 'Create Record 2 preview'
                      }}
                    </button>

                    <div class="pdf-gap-editor">
                      <label class="form-label">
                        Record spacing (pt)
                      </label>

                      <input
                        v-model.number="pdfBatchConfig.recordGapY"
                        type="number"
                        min="0.25"
                        step="0.25"
                        class="form-input"
                        @change="normalizePdfRecordGap"
                      />
                    </div>

                    <div class="pdf-gap-nudges">
                      <button
                        type="button"
                        class="pdf-nudge-btn"
                        @click="nudgePdfRecordBlock(-1)"
                        :disabled="!Number(pdfBatchConfig.recordGapY)"
                        title="Move Record 2 up by 1 point"
                      >
                        ↑ 1 pt
                      </button>

                      <button
                        type="button"
                        class="pdf-nudge-btn"
                        @click="nudgePdfRecordBlock(-0.25)"
                        :disabled="!Number(pdfBatchConfig.recordGapY)"
                        title="Move Record 2 up by 0.25 point"
                      >
                        ↑ 0.25
                      </button>

                      <button
                        type="button"
                        class="pdf-nudge-btn"
                        @click="nudgePdfRecordBlock(0.25)"
                        :disabled="!Number(pdfBatchConfig.recordGapY)"
                        title="Move Record 2 down by 0.25 point"
                      >
                        ↓ 0.25
                      </button>

                      <button
                        type="button"
                        class="pdf-nudge-btn"
                        @click="nudgePdfRecordBlock(1)"
                        :disabled="!Number(pdfBatchConfig.recordGapY)"
                        title="Move Record 2 down by 1 point"
                      >
                        ↓ 1 pt
                      </button>
                    </div>

                    <button
                      v-if="Number(pdfBatchConfig.recordGapY) > 0"
                      type="button"
                      class="btn-remove-anchor"
                      @click="resetPdfRecordSpacing"
                    >
                      Clear spacing
                    </button>

                  </div>

                  <div
                    v-if="Number(pdfBatchConfig.recordGapY) > 0"
                    class="pdf-record-block-status"
                  >
                    <strong>
                      Record 2 is {{ Number(pdfBatchConfig.recordGapY).toFixed(2) }} pt below Record 1.
                    </strong>

                    <span>
                      Drag any green R2 box up/down to move the entire Record 2 block.
                      Record 3 moves automatically so you can check for spacing drift.
                    </span>

                    <span>
                      Keyboard: ↑ / ↓ = 1 pt · Shift = 5 pt · Ctrl = 0.25 pt.
                    </span>
                  </div>

                  <div
                    v-else
                    class="pdf-record-block-empty"
                  >
                    Map the fields for the first record, then click
                    <strong>Create Record 2 preview</strong>.
                  </div>
                </div>

                <!-- ================= FIELD MAPPER ================= -->

                <div class="pdf-section-card">
                  <div class="pdf-section-title">
                    {{
                      newPdfPrintMode === 'row'
                        ? '2. Map fields'
                        : '3. Map fields'
                    }}
                  </div>

                  <div class="pdf-mapper-toolbar">

                    <div class="pdf-mapper-source">
                      <label class="form-label">Value source</label>

                      <select
                        v-model="pdfNewMapping.sourceType"
                        class="form-input"
                      >
                        <option value="column">Log column</option>
                        <option value="fixed">Fixed text</option>
                        <option value="printDate">Print date</option>
                      </select>
                    </div>

                    <div
                      v-if="pdfNewMapping.sourceType === 'column'"
                      class="pdf-mapper-source"
                    >
                      <label class="form-label">Column</label>

                      <select
                        v-model="pdfNewMapping.column"
                        class="form-input"
                      >
                        <option value="">Select column</option>

                        <option
                          v-for="col in editModule.columns.filter(c => c.name)"
                          :key="'pdf-map-col-' + col.uid"
                          :value="col.name"
                        >
                          {{ col.name }}
                        </option>
                      </select>
                    </div>

                    <div
                      v-else-if="pdfNewMapping.sourceType === 'fixed'"
                      class="pdf-mapper-source"
                    >
                      <label class="form-label">Fixed text</label>

                      <input
                        v-model="pdfNewMapping.fixedValue"
                        class="form-input"
                        placeholder="e.g. 1 or unit"
                      />
                    </div>

                    <div class="pdf-mapper-small">
                      <label class="form-label">Prefix</label>

                      <input
                        v-model="pdfNewMapping.prefix"
                        class="form-input"
                        placeholder="e.g. SN: "
                      />
                    </div>

                    <div class="pdf-mapper-small">
                      <label class="form-label">Font size</label>

                      <input
                        v-model.number="pdfNewMapping.fontSize"
                        type="number"
                        min="4"
                        max="30"
                        step="0.5"
                        class="form-input"
                      />
                    </div>

                    <div class="pdf-mapper-small">
                      <label class="form-label">Box width</label>

                      <input
                        v-model.number="pdfNewMapping.width"
                        type="number"
                        min="10"
                        max="1000"
                        step="1"
                        class="form-input"
                      />
                    </div>

                    <div class="pdf-mapper-small">
                      <label class="form-label">Box height</label>

                      <input
                        v-model.number="pdfNewMapping.height"
                        type="number"
                        min="6"
                        max="200"
                        step="1"
                        class="form-input"
                      />
                    </div>

                    <div class="pdf-mapper-small">
                      <label class="form-label">Alignment</label>

                      <select
                        v-model="pdfNewMapping.align"
                        class="form-input"
                      >
                        <option value="left">Left</option>
                        <option value="center">Center</option>
                        <option value="right">Right</option>
                      </select>
                    </div>

                    <label class="pdf-repeat-checkbox">
                      <input
                        type="checkbox"
                        v-model="pdfNewMapping.repeatPerRecord"
                      />
                      Repeat for each record
                    </label>

                    <button
                      type="button"
                      class="btn-add-col pdf-place-btn"
                      :class="{ active: pdfMappingArmed }"
                      @click="armPdfMapping"
                    >
                      {{
                        pdfMappingArmed
                          ? 'Click PDF now…'
                          : 'Place field on PDF'
                      }}
                    </button>

                  </div>

                  <div class="pdf-auto-map-tip">
                    Example:
                    choose <strong>Item Description</strong> → Place field → click the
                    description cell. Choose <strong>Serial Number</strong>, set prefix
                    <strong>SN: </strong> → Place field → click its line.
                  </div>
                </div>

                <!-- ================= PDF PREVIEW / DESIGNER ================= -->

                <div class="pdf-designer-toolbar">

                  <div class="pdf-zoom-group">
                    <span class="pdf-toolbar-label">Zoom</span>

                    <button
                      v-for="zoom in [0.75, 1, 1.25, 1.5, 2]"
                      :key="'pdf-zoom-' + zoom"
                      type="button"
                      :class="[
                        'pdf-zoom-btn',
                        { active: pdfMapperZoom === zoom }
                      ]"
                      @click="setPdfMapperZoom(zoom)"
                    >
                      {{ Math.round(zoom * 100) }}%
                    </button>
                  </div>

                  <div
                    v-if="pdfSampleRecords.length"
                    class="pdf-sample-picker"
                  >
                    <label class="pdf-toolbar-label">
                      Sample data
                    </label>

                    <select
                      v-model.number="pdfSampleIndex"
                      class="form-input"
                    >
                      <option
                        v-for="(record, index) in pdfSampleRecords"
                        :key="'pdf-sample-' + (record.id || index)"
                        :value="index"
                      >
                        Record {{ record.id || (index + 1) }}
                      </option>
                    </select>
                  </div>

                  <div
                    v-else-if="pdfSampleLoading"
                    class="pdf-sample-status"
                  >
                    Loading sample log…
                  </div>

                  <div
                    v-else
                    class="pdf-sample-status"
                  >
                    No saved log available — field names are used as sample text.
                  </div>

                  <div class="pdf-designer-hint">
                    Drag a box to move it · drag the bottom-right handle to resize ·
                    the sample text now starts at the exact saved PDF X position ·
                    Arrow keys = 1pt · Shift + Arrow = 5pt · Ctrl + Arrow = 0.25pt
                  </div>

                </div>

                <div
                  v-if="pdfPreviewLoading"
                  class="pdf-preview-loading"
                >
                  Loading PDF preview…
                </div>

                <div
                  v-if="pdfPreviewError"
                  class="pdf-preview-error"
                >
                  {{ pdfPreviewError }}
                </div>

                <div
                  v-show="pdfPageReady"
                  class="pdf-visual-mapper"
                >
                  <div class="pdf-canvas-stage">

                    <canvas
                      ref="pdfMapperCanvas"
                      class="pdf-mapper-canvas"
                      @click="onPdfCanvasClick"
                    ></canvas>

                    <!-- Editable field boxes -->
                    <template
                      v-for="(mapping, index) in pdfBatchConfig.fields"
                      :key="'pdf-field-group-' + mapping.id"
                    >
                      <div
                        :class="[
                          'pdf-map-box',
                          {
                            selected:
                              selectedPdfMappingId === mapping.id
                          }
                        ]"
                        :style="pdfMarkerStyle(mapping)"
                        :title="pdfMappingLabel(mapping)"
                        tabindex="0"
                        @click.stop="selectPdfMapping(mapping)"
                        @keydown="onPdfBoxKeydown(mapping, $event)"
                        @pointerdown.stop="startPdfBoxDrag(mapping, $event)"
                        @pointermove.stop="movePdfBox(mapping, $event)"
                        @pointerup.stop="endPdfBoxInteraction(mapping, $event)"
                        @pointercancel.stop="endPdfBoxInteraction(mapping, $event)"
                      >
                        <span class="pdf-map-box-number">
                          {{ index + 1 }}
                        </span>

                        <span
                          class="pdf-map-box-text"
                          :style="{
                            textAlign: mapping.align || 'left'
                          }"
                        >
                          {{ pdfMappingPreviewText(mapping, 0) }}
                        </span>

                        <span
                          class="pdf-resize-handle"
                          title="Drag to resize"
                          @pointerdown.stop="startPdfBoxResize(mapping, $event)"
                          @pointermove.stop="movePdfBox(mapping, $event)"
                          @pointerup.stop="endPdfBoxInteraction(mapping, $event)"
                          @pointercancel.stop="endPdfBoxInteraction(mapping, $event)"
                        ></span>
                      </div>

                      <!-- Record 2: draggable whole-block preview -->
                      <div
                        v-if="
                          mapping.repeatPerRecord &&
                          Number(pdfBatchConfig.recordGapY) > 0
                        "
                        class="pdf-map-box pdf-map-box-ghost pdf-map-box-ghost-r2"
                        :style="pdfRepeatPreviewStyle(mapping, 1)"
                        tabindex="0"
                        title="Drag vertically to position the entire Record 2 block"
                        @click.stop
                        @keydown="onPdfRecordBlockKeydown"
                        @pointerdown.stop="startPdfRecordBlockDrag($event)"
                        @pointermove.stop="movePdfRecordBlock($event)"
                        @pointerup.stop="endPdfRecordBlockDrag($event)"
                        @pointercancel.stop="endPdfRecordBlockDrag($event)"
                      >
                        <span class="pdf-map-box-number ghost">
                          R2
                        </span>

                        <span
                          class="pdf-map-box-text"
                          :style="{
                            textAlign: mapping.align || 'left'
                          }"
                        >
                          {{ pdfMappingPreviewText(mapping, 1) }}
                        </span>
                      </div>

                      <!-- Record 3: non-interactive drift preview -->
                      <div
                        v-if="
                          mapping.repeatPerRecord &&
                          Number(pdfBatchConfig.recordGapY) > 0 &&
                          Number(pdfBatchConfig.recordsPerPage) > 2
                        "
                        class="pdf-map-box pdf-map-box-ghost pdf-map-box-ghost-r3"
                        :style="pdfRepeatPreviewStyle(mapping, 2)"
                        aria-hidden="true"
                      >
                        <span class="pdf-map-box-number ghost ghost-r3">
                          R3
                        </span>

                        <span
                          class="pdf-map-box-text"
                          :style="{
                            textAlign: mapping.align || 'left'
                          }"
                        >
                          {{ pdfMappingPreviewText(mapping, 2) }}
                        </span>
                      </div>
                    </template>

                  </div>
                </div>

                <!-- ================= MAPPING LIST ================= -->

                <div
                  v-if="pdfBatchConfig.fields.length"
                  class="pdf-mapping-list"
                >
                  <div class="pdf-mapping-list-title">
                    Generated field mappings
                  </div>

                  <div
                    v-for="(mapping, index) in pdfBatchConfig.fields"
                    :key="mapping.id"
                    :class="[
                      'pdf-mapping-row',
                      {
                        selected:
                          selectedPdfMappingId === mapping.id
                      }
                    ]"
                    @click="selectPdfMapping(mapping)"
                  >
                    <span class="pdf-map-number">
                      {{ index + 1 }}
                    </span>

                    <div class="pdf-map-summary">
                      <strong>{{ pdfMappingLabel(mapping) }}</strong>

                      <span>
                        x={{ Math.round(mapping.x) }},
                        y={{ Math.round(mapping.y) }},
                        {{
                          mapping.repeatPerRecord
                            ? 'repeats each record'
                            : 'static each page'
                        }}
                      </span>
                    </div>

                    <input
                      v-model="mapping.prefix"
                      class="form-input pdf-inline-input"
                      placeholder="Prefix"
                    />

                    <input
                      v-model.number="mapping.fontSize"
                      type="number"
                      min="4"
                      max="30"
                      step="0.5"
                      class="form-input pdf-inline-number"
                      title="Font size"
                    />

                    <input
                      v-model.number="mapping.width"
                      type="number"
                      min="10"
                      step="1"
                      class="form-input pdf-inline-number"
                      title="Box width"
                    />

                    <input
                      v-model.number="mapping.height"
                      type="number"
                      min="6"
                      step="1"
                      class="form-input pdf-inline-number"
                      title="Box height"
                    />

                    <select
                      v-model="mapping.align"
                      class="form-input pdf-inline-select"
                      title="Text alignment"
                    >
                      <option value="left">Left</option>
                      <option value="center">Center</option>
                      <option value="right">Right</option>
                    </select>

                    <button
                      type="button"
                      class="btn-remove"
                      @click="removePdfMapping(index)"
                    >
                      ✕
                    </button>
                  </div>
                </div>

                <div class="pdf-edit-actions">
                  <button
                    type="button"
                    class="btn-primary"
                    @click="
                      editingPdfTemplateId
                        ? saveExistingPdfTemplateConfig()
                        : finishNewPdfMapping()
                    "
                    :disabled="savingPdfTemplateConfig"
                  >
                    {{
                      savingPdfTemplateConfig
                        ? 'Saving…'
                        : editingPdfTemplateId
                          ? 'Save PDF mapping'
                          : 'Use this PDF form'
                    }}
                  </button>

                  <button
                    type="button"
                    class="btn-ghost"
                    @click="cancelAddTemplate"
                  >
                    Cancel
                  </button>
                </div>

                <div class="pdf-generic-help">
                  <strong>Visual designer:</strong>
                  place each field once, then drag and resize its rectangle directly
                  over the PDF. The rectangle dimensions and position are saved
                  automatically.
                  <span v-if="newPdfPrintMode === 'batch'">
                    Record 2 and Record 3 previews help verify repeating alignment.
                  </span>
                  <span v-else>
                    This mapping is used by the row Fill & Print button.
                  </span>
                </div>

              </div>

                </div>
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

import { ref, computed, onMounted, nextTick } from 'vue'

import draggable from 'vuedraggable'

import api from '@/api/axios'

import * as XLSX from 'xlsx'

import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs'
import pdfWorker from 'pdfjs-dist/legacy/build/pdf.worker.min.mjs?url'

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker


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

/* ================= TEMPLATE ADD/EDIT CHOOSER =================

   Controls which single template flow (Excel or Word) is shown at a time,

   instead of always rendering both upload UIs together. */

const addTemplateType = ref(null) // null | 'excel' | 'docx' | 'pdf'

const startAddTemplate = (type) => {

  if (type === 'pdf') {
    editingPdfTemplateId.value = null
    editingPdfFileName.value = ''

    /*
     * If there is already a staged PDF, reopen it instead of wiping it.
     */
    if (!pendingPdfFile.value) {
      newPdfName.value = 'PDF Form'
      newPdfPrintMode.value = 'batch'
      pdfBatchConfig.value =
        defaultPdfBatchConfig()

      resetPdfMapper()
    }
  }

  addTemplateType.value = type

  if (type === 'excel' && editModule.value.templateFile && !previewGrid.value.length) {

    // Pull the existing workbook in so the mapping grid is ready to edit

    loadExistingTemplateForMapping()

  }

}

const cancelAddTemplate = () => {

  addTemplateType.value = null

  editingPdfTemplateId.value = null
  editingPdfFileName.value = ''
  savingPdfTemplateConfig.value = false

  pendingPdfFile.value = null
  newPdfName.value = 'PDF Form'
  newPdfPrintMode.value = 'batch'

  pdfBatchConfig.value =
    defaultPdfBatchConfig()

  resetPdfMapper()

}


const validatePendingPdfMapping = () => {

  if (
    !pendingPdfFile.value
  ) {
    showToast(
      'Choose a PDF file first',
      'error'
    )

    return false
  }

  if (
    !String(
      newPdfName.value ||
      ''
    ).trim()
  ) {
    showToast(
      'Enter a template name',
      'error'
    )

    return false
  }

  if (
    !pdfBatchConfig.value.fields.length
  ) {
    showToast(
      'Add at least one PDF field mapping',
      'error'
    )

    return false
  }

  const hasRepeatingFields =
    pdfBatchConfig.value.fields.some(
      field =>
        field.repeatPerRecord !==
        false
    )

  if (
    newPdfPrintMode.value ===
      'batch' &&
    hasRepeatingFields &&
    Number(
      pdfBatchConfig.value.recordsPerPage
    ) > 1 &&
    !Number(
      pdfBatchConfig.value.recordGapY
    )
  ) {
    showToast(
      'Create and position the Record 2 preview first',
      'error'
    )

    return false
  }

  return true

}


const finishNewPdfMapping = () => {

  if (
    !validatePendingPdfMapping()
  ) {
    return
  }

  /*
   * Hide the mapper WITHOUT clearing pendingPdfFile / batchConfig.
   * The configured PDF is uploaded when the user saves the module.
   */
  addTemplateType.value =
    null

  editingPdfTemplateId.value =
    null

  editingPdfFileName.value =
    ''

  showToast(
    'PDF form is ready. Save the module to upload it.',
    'success'
  )

}


const reopenPendingPdfMapping = async () => {

  if (
    !pendingPdfFile.value
  ) {
    return
  }

  editingPdfTemplateId.value =
    null

  editingPdfFileName.value =
    ''

  addTemplateType.value =
    'pdf'

  await nextTick()

  try {

    await renderPdfMapperPreview(
      pendingPdfFile.value
    )

    await loadPdfSampleRecords(
      editModule.value?.id ||
      activeModule.value?.id
    )

  } catch (err) {

    console.error(
      'Failed to reopen pending PDF mapper:',
      err
    )

    showToast(
      'Failed to reopen the PDF mapping',
      'error'
    )

  }

}


const discardPendingPdfTemplate = () => {

  pendingPdfFile.value =
    null

  newPdfName.value =
    'PDF Form'

  newPdfPrintMode.value =
    'batch'

  pdfBatchConfig.value =
    defaultPdfBatchConfig()

  resetPdfMapper()

  showToast(
    'Pending PDF form discarded',
    'success'
  )

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

const newPdfName = ref('PDF Form')
const newPdfPrintMode = ref('batch')
const pendingPdfFile = ref(null)

const editingPdfTemplateId = ref(null)
const editingPdfFileName = ref('')
const savingPdfTemplateConfig = ref(false)

const pdfMapperCanvas = ref(null)
const pdfPageReady = ref(false)
const pdfPreviewLoading = ref(false)
const pdfPreviewError = ref('')
const pdfRenderedViewport = ref(null)

const pdfPreviewBytes = ref(null)
const pdfMapperZoom = ref(1)
const selectedPdfMappingId = ref(null)
const pdfBoxInteraction = ref(null)
const pdfRecordBlockInteraction = ref(null)

const pdfSampleRecords = ref([])
const pdfSampleIndex = ref(0)
const pdfSampleLoading = ref(false)

const defaultPdfBatchConfig = () => ({
  source: 'filtered',
  recordsPerPage: 9,
  recordGapY: 0,
  templatePage: 1,
  firstAnchor: null,
  secondAnchor: null,
  fields: []
})

const pdfBatchConfig = ref(
  defaultPdfBatchConfig()
)

const onPdfPrintModeChange = () => {
  if (
    newPdfPrintMode.value ===
    'row'
  ) {
    pdfBatchConfig.value.recordsPerPage = 1
    pdfBatchConfig.value.recordGapY = 0
    pdfBatchConfig.value.firstAnchor = null
    pdfBatchConfig.value.secondAnchor = null
  } else if (
    Number(
      pdfBatchConfig.value.recordsPerPage
    ) <= 1
  ) {
    pdfBatchConfig.value.recordsPerPage = 9
  }
}

const defaultPdfNewMapping = () => ({
  sourceType: 'column',
  column: '',
  fixedValue: '',
  prefix: '',
  fontSize: 8.5,
  width: 120,
  height: 16,
  align: 'left',
  repeatPerRecord: true
})

const pdfNewMapping = ref(
  defaultPdfNewMapping()
)

const pdfMappingArmed = ref(false)

const resetPdfMapper = () => {
  pdfPageReady.value = false
  pdfPreviewLoading.value = false
  pdfPreviewError.value = ''
  pdfRenderedViewport.value = null
  pdfPreviewBytes.value = null
  pdfMapperZoom.value = 1
  selectedPdfMappingId.value = null
  pdfBoxInteraction.value = null
  pdfRecordBlockInteraction.value = null
  pdfMappingArmed.value = false
  pdfSampleRecords.value = []
  pdfSampleIndex.value = 0
  pdfSampleLoading.value = false
  pdfNewMapping.value =
    defaultPdfNewMapping()
}

const renderPdfMapperPreview = async (
  source = null
) => {
  pdfPreviewLoading.value = true
  pdfPreviewError.value = ''
  pdfPageReady.value = false

  try {
    let data

    if (source) {

      if (
        source instanceof Uint8Array
      ) {
        data =
          source.slice()

      } else if (
        source instanceof ArrayBuffer
      ) {
        data =
          new Uint8Array(
            source.slice(0)
          )

      } else if (
        ArrayBuffer.isView(
          source
        )
      ) {
        data =
          new Uint8Array(
            source.buffer.slice(
              source.byteOffset,
              source.byteOffset +
              source.byteLength
            )
          )

      } else if (
        typeof source.arrayBuffer ===
        'function'
      ) {
        const buffer =
          await source.arrayBuffer()

        data =
          new Uint8Array(
            buffer
          )

      } else {
        throw new Error(
          `Unsupported PDF response type: ${
            Object.prototype.toString.call(
              source
            )
          }`
        )
      }

      pdfPreviewBytes.value =
        data.slice()

    } else if (
      pdfPreviewBytes.value
    ) {

      data =
        pdfPreviewBytes.value.slice()

    } else {

      throw new Error(
        'No PDF data was received.'
      )

    }

    if (
      !data ||
      !data.byteLength
    ) {
      throw new Error(
        'The saved PDF file is empty.'
      )
    }

    const isPdf =
      data.byteLength >= 4 &&
      data[0] === 0x25 &&
      data[1] === 0x50 &&
      data[2] === 0x44 &&
      data[3] === 0x46

    if (!isPdf) {
      throw new Error(
        'The server response is not a valid PDF file.'
      )
    }

    /*
     * Give PDF.js a disposable copy. Some worker builds may transfer
     * the typed array internally, so keep our stored preview bytes intact.
     */
    const loadingTask =
      pdfjsLib.getDocument({
        data:
          data.slice()
      })

    const pdf =
      await loadingTask.promise

    const requestedPage =
      Math.max(
        1,
        Number(
          pdfBatchConfig.value.templatePage
        ) || 1
      )

    const pageNumber =
      Math.min(
        requestedPage,
        pdf.numPages
      )

    const page =
      await pdf.getPage(
        pageNumber
      )

    const unscaled =
      page.getViewport({
        scale: 1
      })

    /*
     * Base scale fits a normal editor width.
     * pdfMapperZoom then magnifies it for precise placement.
     */
    const maxWidth =
      980

    const baseScale =
      Math.min(
        1.6,
        Math.max(
          0.7,
          maxWidth /
            unscaled.width
        )
      )

    const scale =
      Math.min(
        3.5,
        Math.max(
          0.45,
          baseScale *
          Number(
            pdfMapperZoom.value ||
            1
          )
        )
      )

    const viewport =
      page.getViewport({
        scale
      })

    await nextTick()

    await new Promise(
      resolve =>
        requestAnimationFrame(
          resolve
        )
    )

    const canvas =
      pdfMapperCanvas.value

    if (!canvas) {
      throw new Error(
        'PDF mapping canvas was not created.'
      )
    }

    const ctx =
      canvas.getContext(
        '2d',
        {
          alpha: false
        }
      )

    if (!ctx) {
      throw new Error(
        'Could not get the PDF preview canvas context.'
      )
    }

    const outputScale =
      window.devicePixelRatio ||
      1

    canvas.width =
      Math.floor(
        viewport.width *
        outputScale
      )

    canvas.height =
      Math.floor(
        viewport.height *
        outputScale
      )

    canvas.style.width =
      `${viewport.width}px`

    canvas.style.height =
      `${viewport.height}px`

    const transform =
      outputScale !== 1
        ? [
            outputScale,
            0,
            0,
            outputScale,
            0,
            0
          ]
        : undefined

    await page.render({
      canvasContext:
        ctx,

      transform,

      viewport
    }).promise

    pdfRenderedViewport.value = {
      width:
        viewport.width,

      height:
        viewport.height,

      scale,

      pdfWidth:
        unscaled.width,

      pdfHeight:
        unscaled.height
    }

    pdfPageReady.value =
      true

    try {
      await pdf.cleanup()
    } catch {
      // Ignore cleanup errors.
    }

  } catch (err) {
    console.error(
      'PDF mapper preview failed:',
      err
    )

    const message =
      err?.message ||
      String(err) ||
      'Unknown PDF preview error'

    pdfPreviewError.value =
      `Could not render this PDF for mapping: ${message}`

    throw err
  } finally {
    pdfPreviewLoading.value =
      false
  }
}


const setPdfMapperZoom = async (
  zoom
) => {
  const nextZoom =
    Number(
      zoom
    ) || 1

  if (
    pdfMapperZoom.value ===
    nextZoom
  ) {
    return
  }

  pdfMapperZoom.value =
    nextZoom

  if (
    pdfPreviewBytes.value
  ) {
    await renderPdfMapperPreview()
  }
}


const loadPdfSampleRecords = async (
  moduleId
) => {
  pdfSampleRecords.value = []
  pdfSampleIndex.value = 0

  if (!moduleId) {
    return
  }

  pdfSampleLoading.value =
    true

  try {
    const res =
      await api.get(
        `/logs/module/${moduleId}`
      )

    const rows =
      Array.isArray(
        res.data
      )
        ? res.data
        : []

    pdfSampleRecords.value =
      rows.slice(
        0,
        50
      )

  } catch (err) {
    console.warn(
      'Could not load PDF mapper sample logs:',
      err
    )
  } finally {
    pdfSampleLoading.value =
      false
  }
}


const onPdfSelected = async (e) => {
  editingPdfTemplateId.value = null
  editingPdfFileName.value = ''

  pendingPdfFile.value =
    e.target.files[0] || null

  pdfBatchConfig.value =
    defaultPdfBatchConfig()

  resetPdfMapper()

  if (
    pendingPdfFile.value
  ) {
    await renderPdfMapperPreview(
      pendingPdfFile.value
    )

    await loadPdfSampleRecords(
      editModule.value?.id ||
      activeModule.value?.id
    )
  }
}

const canvasClickToPdfPoint = (
  event
) => {
  if (
    !pdfRenderedViewport.value ||
    !pdfMapperCanvas.value
  ) {
    return null
  }

  const rect =
    pdfMapperCanvas.value
      .getBoundingClientRect()

  const view =
    pdfRenderedViewport.value

  const clickX =
    event.clientX -
    rect.left

  const clickY =
    event.clientY -
    rect.top

  return {
    x:
      clickX /
      view.scale,

    y:
      view.pdfHeight -
      (
        clickY /
        view.scale
      )
  }
}

const snapPdfSpacing = (
  value
) => {
  const numeric =
    Number(
      value
    )

  if (
    !Number.isFinite(
      numeric
    )
  ) {
    return 0
  }

  /*
   * Quarter-point precision is fine enough for PDF placement
   * while still preventing ugly floating point values.
   */
  return Math.max(
    0.25,
    Math.round(
      numeric * 4
    ) / 4
  )
}


const hasRepeatingPdfFields = computed(() =>
  pdfBatchConfig.value.fields.some(
    field =>
      field.repeatPerRecord !==
      false
  )
)


const estimatePdfRecordGap = () => {
  const repeating =
    pdfBatchConfig.value.fields.filter(
      field =>
        field.repeatPerRecord !==
        false
    )

  if (!repeating.length) {
    return 24
  }

  repeating.forEach(
    field =>
      ensurePdfBoxTopLeft(
        field
      )
  )

  /*
   * PDF Y grows upward.
   * "y" is the top edge for new visual mappings.
   */
  const highestTop =
    Math.max(
      ...repeating.map(
        field =>
          Number(
            field.y
          ) || 0
      )
    )

  const lowestBottom =
    Math.min(
      ...repeating.map(
        field =>
          (
            Number(
              field.y
            ) || 0
          ) -
          Math.max(
            6,
            Number(
              field.height
            ) || 16
          )
      )
    )

  const blockHeight =
    Math.max(
      8,
      highestTop -
      lowestBottom
    )

  /*
   * Give the next record a small visual clearance.
   * The user then drags R2 onto the exact form row.
   */
  return snapPdfSpacing(
    blockHeight + 3
  )
}


const preparePdfRecord2Block = () => {
  if (
    !pdfPageReady.value
  ) {
    showToast(
      'Upload or open the PDF first',
      'error'
    )
    return
  }

  if (
    !hasRepeatingPdfFields.value
  ) {
    showToast(
      'Map at least one repeating field first',
      'error'
    )
    return
  }

  pdfBatchConfig.value.recordGapY =
    estimatePdfRecordGap()

  /*
   * Old point anchors are no longer needed.
   * Keep them cleared so saved configs only rely on recordGapY.
   */
  pdfBatchConfig.value.firstAnchor =
    null

  pdfBatchConfig.value.secondAnchor =
    null

  showToast(
    'Record 2 preview created. Drag any green R2 box vertically to align it.',
    'success'
  )
}


const normalizePdfRecordGap = () => {
  const value =
    Number(
      pdfBatchConfig.value.recordGapY
    )

  if (
    !Number.isFinite(value) ||
    value <= 0
  ) {
    pdfBatchConfig.value.recordGapY =
      0
    return
  }

  pdfBatchConfig.value.recordGapY =
    snapPdfSpacing(
      value
    )
}


const nudgePdfRecordBlock = (
  delta
) => {
  const current =
    Number(
      pdfBatchConfig.value.recordGapY
    )

  if (
    !Number.isFinite(current) ||
    current <= 0
  ) {
    return
  }

  pdfBatchConfig.value.recordGapY =
    snapPdfSpacing(
      current +
      Number(
        delta
      )
    )
}


const resetPdfRecordSpacing = () => {
  pdfBatchConfig.value.recordGapY =
    0

  pdfBatchConfig.value.firstAnchor =
    null

  pdfBatchConfig.value.secondAnchor =
    null

  pdfRecordBlockInteraction.value =
    null
}


const startPdfRecordBlockDrag = (
  event
) => {
  if (
    event.button !== undefined &&
    event.button !== 0
  ) {
    return
  }

  const view =
    pdfRenderedViewport.value

  const currentGap =
    Number(
      pdfBatchConfig.value.recordGapY
    )

  if (
    !view ||
    !Number.isFinite(currentGap) ||
    currentGap <= 0
  ) {
    return
  }

  pdfMappingArmed.value =
    false

  pdfRecordBlockInteraction.value = {
    pointerId:
      event.pointerId,

    startClientY:
      event.clientY,

    startGap:
      currentGap
  }

  try {
    event.currentTarget
      ?.setPointerCapture(
        event.pointerId
      )
  } catch {
    // Pointer capture is optional.
  }
}


const movePdfRecordBlock = (
  event
) => {
  const interaction =
    pdfRecordBlockInteraction.value

  const view =
    pdfRenderedViewport.value

  if (
    !interaction ||
    !view ||
    interaction.pointerId !==
      event.pointerId
  ) {
    return
  }

  const scale =
    Number(
      view.scale
    ) || 1

  /*
   * Screen Y grows downward.
   * Increasing recordGapY also moves R2 downward.
   */
  const delta =
    (
      event.clientY -
      interaction.startClientY
    ) /
    scale

  pdfBatchConfig.value.recordGapY =
    snapPdfSpacing(
      interaction.startGap +
      delta
    )
}


const endPdfRecordBlockDrag = (
  event
) => {
  const interaction =
    pdfRecordBlockInteraction.value

  if (!interaction) {
    return
  }

  try {
    event.currentTarget
      ?.releasePointerCapture(
        event.pointerId
      )
  } catch {
    // Ignore.
  }

  pdfRecordBlockInteraction.value =
    null
}


const onPdfRecordBlockKeydown = (
  event
) => {
  if (
    ![
      'ArrowUp',
      'ArrowDown'
    ].includes(
      event.key
    )
  ) {
    return
  }

  event.preventDefault()

  const step =
    event.ctrlKey ||
    event.metaKey
      ? 0.25
      : event.shiftKey
        ? 5
        : 1

  nudgePdfRecordBlock(
    event.key ===
    'ArrowUp'
      ? -step
      : step
  )
}


const armPdfMapping = () => {
  if (
    !pdfPageReady.value
  ) {
    showToast(
      'Upload a PDF first',
      'error'
    )
    return
  }

  if (
    pdfNewMapping.value.sourceType === 'column' &&
    !pdfNewMapping.value.column
  ) {
    showToast(
      'Select a log column first',
      'error'
    )
    return
  }

  if (
    pdfNewMapping.value.sourceType === 'fixed' &&
    !pdfNewMapping.value.fixedValue
  ) {
    showToast(
      'Enter the fixed text first',
      'error'
    )
    return
  }

  pdfMappingArmed.value =
    true

  showToast(
    'Click the desired position on the PDF',
    'success'
  )
}

const onPdfCanvasClick = (
  event
) => {
  const point =
    canvasClickToPdfPoint(
      event
    )

  if (!point) {
    return
  }

  if (
    !pdfMappingArmed.value
  ) {
    return
  }

  const mapping = {
    id:
      `${Date.now()}-${Math.random()
        .toString(36)
        .slice(2)}`,

    sourceType:
      pdfNewMapping.value.sourceType,

    column:
      pdfNewMapping.value.column,

    fixedValue:
      pdfNewMapping.value.fixedValue,

    prefix:
      pdfNewMapping.value.prefix || '',

    fontSize:
      Number(
        pdfNewMapping.value.fontSize
      ) || 8.5,

    width:
      Math.max(
        10,
        Number(
          pdfNewMapping.value.width
        ) || 120
      ),

    height:
      Math.max(
        6,
        Number(
          pdfNewMapping.value.height
        ) || 16
      ),

    align:
      pdfNewMapping.value.align ||
      'left',

    repeatPerRecord:
      !!pdfNewMapping.value.repeatPerRecord,

    /*
     * New mappings store the clicked point as the TOP-LEFT
     * corner of the visual text box.
     */
    boxMode:
      'topLeft',

    x:
      point.x,

    y:
      point.y
  }

  pdfBatchConfig.value.fields.push(
    mapping
  )

  selectedPdfMappingId.value =
    mapping.id

  pdfMappingArmed.value =
    false

  pdfNewMapping.value =
    defaultPdfNewMapping()
}

const removePdfMapping = (
  index
) => {
  const removed =
    pdfBatchConfig.value.fields[
      index
    ]

  pdfBatchConfig.value.fields.splice(
    index,
    1
  )

  if (
    removed?.id &&
    selectedPdfMappingId.value ===
    removed.id
  ) {
    selectedPdfMappingId.value =
      null
  }
}

const pdfMappingLabel = (
  mapping
) => {
  if (
    mapping.sourceType ===
    'column'
  ) {
    return mapping.column ||
      'Column'
  }

  if (
    mapping.sourceType ===
    'fixed'
  ) {
    return `Fixed: ${
      mapping.fixedValue ||
      ''
    }`
  }

  if (
    mapping.sourceType ===
    'printDate'
  ) {
    return 'Print Date'
  }

  return 'Field'
}

const pdfPointStyle = (
  point
) => {
  const view =
    pdfRenderedViewport.value

  if (
    !view ||
    !point
  ) {
    return {
      display:
        'none'
    }
  }

  return {
    left:
      `${
        point.x *
        view.scale
      }px`,

    top:
      `${
        (
          view.pdfHeight -
          point.y
        ) *
        view.scale
      }px`
  }
}

const pdfMarkerStyle = (
  mapping
) => {
  const view =
    pdfRenderedViewport.value

  if (
    !view ||
    !mapping
  ) {
    return {
      display: 'none'
    }
  }

  const scale =
    view.scale

  const width =
    Math.max(
      10,
      Number(
        mapping.width
      ) || 120
    )

  const height =
    Math.max(
      6,
      Number(
        mapping.height
      ) || 16
    )

  /*
   * Old mappings were point/baseline mappings.
   * New mappings are top-left boxes.
   */
  const top =
    mapping.boxMode === 'topLeft'
      ? (
          view.pdfHeight -
          mapping.y
        ) *
        scale
      : (
          view.pdfHeight -
          mapping.y
        ) *
        scale -
        height *
        scale

  return {
    left:
      `${mapping.x * scale}px`,

    top:
      `${top}px`,

    width:
      `${width * scale}px`,

    height:
      `${height * scale}px`,

    fontSize:
      `${Math.max(
        8,
        Number(
          mapping.fontSize
        ) * scale
      )}px`
  }
}

const pdfMappingPreviewText = (
  mapping,
  recordOffset = 0
) => {
  const prefix =
    mapping?.prefix ||
    ''

  if (
    mapping?.sourceType ===
    'fixed'
  ) {
    return `${prefix}${
      mapping.fixedValue ||
      ''
    }`
  }

  if (
    mapping?.sourceType ===
    'printDate'
  ) {
    return `${prefix}${
      new Date()
        .toLocaleDateString(
          'en-PH'
        )
    }`
  }

  const records =
    pdfSampleRecords.value

  const baseIndex =
    Math.max(
      0,
      Number(
        pdfSampleIndex.value
      ) || 0
    )

  const record =
    records[
      Math.min(
        Math.max(
          0,
          baseIndex +
          Number(
            recordOffset ||
            0
          )
        ),
        Math.max(
          0,
          records.length -
          1
        )
      )
    ]

  const sample =
    record?.data?.[
      mapping?.column
    ]

  const displayValue =
    sample !== null &&
    sample !== undefined &&
    String(sample) !== ''
      ? String(sample)
      : (
          mapping?.column ||
          'Field'
        )

  return `${prefix}${displayValue}`
}


const selectPdfMapping = (
  mapping
) => {
  selectedPdfMappingId.value =
    mapping?.id ||
    null
}


const ensurePdfBoxTopLeft = (
  mapping
) => {
  if (
    !mapping ||
    mapping.boxMode ===
    'topLeft'
  ) {
    return
  }

  const height =
    Math.max(
      6,
      Number(
        mapping.height
      ) || 16
    )

  /*
   * Old mappings stored y as a baseline. Convert once to the
   * top edge used by the visual designer without moving the box.
   */
  mapping.y =
    Number(
      mapping.y
    ) +
    height

  mapping.boxMode =
    'topLeft'
}


const startPdfBoxDrag = (
  mapping,
  event
) => {
  if (
    event.button !== undefined &&
    event.button !== 0
  ) {
    return
  }

  ensurePdfBoxTopLeft(
    mapping
  )

  selectPdfMapping(
    mapping
  )

  pdfMappingArmed.value =
    false

  pdfBoxInteraction.value = {
    id:
      mapping.id,

    mode:
      'drag',

    pointerId:
      event.pointerId,

    startClientX:
      event.clientX,

    startClientY:
      event.clientY,

    startX:
      Number(
        mapping.x
      ) || 0,

    startY:
      Number(
        mapping.y
      ) || 0,

    startWidth:
      Math.max(
        10,
        Number(
          mapping.width
        ) || 120
      ),

    startHeight:
      Math.max(
        6,
        Number(
          mapping.height
        ) || 16
      )
  }

  try {
    event.currentTarget
      ?.setPointerCapture(
        event.pointerId
      )
  } catch {
    // Pointer capture is optional.
  }
}


const startPdfBoxResize = (
  mapping,
  event
) => {
  ensurePdfBoxTopLeft(
    mapping
  )

  selectPdfMapping(
    mapping
  )

  pdfBoxInteraction.value = {
    id:
      mapping.id,

    mode:
      'resize',

    pointerId:
      event.pointerId,

    startClientX:
      event.clientX,

    startClientY:
      event.clientY,

    startX:
      Number(
        mapping.x
      ) || 0,

    startY:
      Number(
        mapping.y
      ) || 0,

    startWidth:
      Math.max(
        10,
        Number(
          mapping.width
        ) || 120
      ),

    startHeight:
      Math.max(
        6,
        Number(
          mapping.height
        ) || 16
      )
  }

  try {
    event.currentTarget
      ?.setPointerCapture(
        event.pointerId
      )
  } catch {
    // Pointer capture is optional.
  }
}


const movePdfBox = (
  mapping,
  event
) => {
  const interaction =
    pdfBoxInteraction.value

  const view =
    pdfRenderedViewport.value

  if (
    !interaction ||
    !view ||
    interaction.id !==
      mapping.id ||
    interaction.pointerId !==
      event.pointerId
  ) {
    return
  }

  const scale =
    Number(
      view.scale
    ) || 1

  const dx =
    (
      event.clientX -
      interaction.startClientX
    ) /
    scale

  const dy =
    (
      event.clientY -
      interaction.startClientY
    ) /
    scale

  if (
    interaction.mode ===
    'drag'
  ) {
    mapping.x =
      interaction.startX +
      dx

    /*
     * Screen Y grows downward, PDF Y grows upward.
     */
    mapping.y =
      interaction.startY -
      dy

  } else if (
    interaction.mode ===
    'resize'
  ) {
    mapping.width =
      Math.max(
        10,
        interaction.startWidth +
        dx
      )

    mapping.height =
      Math.max(
        6,
        interaction.startHeight +
        dy
      )
  }
}


const endPdfBoxInteraction = (
  mapping,
  event
) => {
  const interaction =
    pdfBoxInteraction.value

  if (
    !interaction ||
    interaction.id !==
      mapping.id
  ) {
    return
  }

  try {
    event.currentTarget
      ?.releasePointerCapture(
        event.pointerId
      )
  } catch {
    // Ignore.
  }

  pdfBoxInteraction.value =
    null
}


const onPdfBoxKeydown = (
  mapping,
  event
) => {
  const arrows = [
    'ArrowLeft',
    'ArrowRight',
    'ArrowUp',
    'ArrowDown'
  ]

  if (
    !arrows.includes(
      event.key
    )
  ) {
    return
  }

  event.preventDefault()

  ensurePdfBoxTopLeft(
    mapping
  )

  selectPdfMapping(
    mapping
  )

  const step =
    event.ctrlKey ||
    event.metaKey
      ? 0.25
      : event.shiftKey
        ? 5
        : 1

  if (
    event.key ===
    'ArrowLeft'
  ) {
    mapping.x -= step
  }

  if (
    event.key ===
    'ArrowRight'
  ) {
    mapping.x += step
  }

  if (
    event.key ===
    'ArrowUp'
  ) {
    mapping.y += step
  }

  if (
    event.key ===
    'ArrowDown'
  ) {
    mapping.y -= step
  }
}


const pdfRepeatPreviewStyle = (
  mapping,
  repeatIndex = 1
) => {
  const cloned = {
    ...mapping,

    y:
      Number(
        mapping.y
      ) -
      (
        Number(
          pdfBatchConfig.value.recordGapY
        ) || 0
      ) *
      Number(
        repeatIndex ||
        0
      )
  }

  return pdfMarkerStyle(
    cloned
  )
}


const normalizePdfBatchConfig = (
  value
) => {
  let raw = value

  /*
   * Depending on the DB driver / older saved records,
   * batchConfig may arrive as a JSON string instead of
   * an already-parsed object.
   */
  if (
    typeof raw === 'string'
  ) {
    try {
      raw =
        JSON.parse(
          raw
        )
    } catch {
      raw = {}
    }
  }

  if (
    !raw ||
    typeof raw !== 'object' ||
    Array.isArray(raw)
  ) {
    raw = {}
  }

  const fields =
    Array.isArray(
      raw.fields
    )
      ? raw.fields.map(
          field => ({
            ...field,

            id:
              field.id ||
              `${Date.now()}-${Math.random()
                .toString(36)
                .slice(2)}`,

            fontSize:
              Number(
                field.fontSize
              ) || 8.5,

            width:
              Math.max(
                10,
                Number(
                  field.width
                ) || 120
              ),

            height:
              Math.max(
                6,
                Number(
                  field.height
                ) || 16
              ),

            align:
              field.align ||
              'left',

            repeatPerRecord:
              field.repeatPerRecord !==
              false
          })
        )
      : []

  let recordGapY =
    Number(
      raw.recordGapY
    ) || 0

  /*
   * Backward compatibility:
   * old mappings used R1/R2 point anchors.
   * If they have a valid spacing, migrate that spacing once.
   */
  if (
    recordGapY <= 0 &&
    raw.firstAnchor &&
    raw.secondAnchor
  ) {
    recordGapY =
      Math.abs(
        Number(
          raw.firstAnchor.y
        ) -
        Number(
          raw.secondAnchor.y
        )
      )
  }

  return {
    ...defaultPdfBatchConfig(),
    ...raw,

    recordGapY:
      recordGapY > 0
        ? snapPdfSpacing(recordGapY)
        : 0,

    /*
     * Point anchors are intentionally cleared.
     * New UI uses the draggable Record 2 block instead.
     */
    firstAnchor:
      null,

    secondAnchor:
      null,

    fields
  }
}


const editPdfTemplate = async (
  template
) => {
  try {
    if (
      !template?.id
    ) {
      throw new Error(
        'Saved PDF template has no ID.'
      )
    }

    addTemplateType.value =
      'pdf'

    editingPdfTemplateId.value =
      template.id

    editingPdfFileName.value =
      template.fileName ||
      template.name ||
      'PDF template'

    newPdfName.value =
      template.name ||
      'PDF Form'

    newPdfPrintMode.value =
      String(
        template.printMode ||
        'batch'
      ).toLowerCase() === 'row'
        ? 'row'
        : 'batch'

    pendingPdfFile.value =
      null

    pdfBatchConfig.value =
      normalizePdfBatchConfig(
        template.batchConfig
      )

    if (
      newPdfPrintMode.value ===
      'row'
    ) {
      pdfBatchConfig.value.recordsPerPage = 1
      pdfBatchConfig.value.recordGapY = 0
      pdfBatchConfig.value.firstAnchor = null
      pdfBatchConfig.value.secondAnchor = null
    }

    resetPdfMapper()

    /*
     * ArrayBuffer is more predictable here than Blob and
     * works directly with PDF.js.
     */
    const res =
      await api.get(
        `/modules/templates/${template.id}/file`,
        {
          responseType:
            'arraybuffer',

          params: {
            _ts:
              Date.now()
          }
        }
      )

    await renderPdfMapperPreview(
      res.data
    )

    await loadPdfSampleRecords(
      editModule.value?.id ||
      activeModule.value?.id ||
      template.moduleId
    )

    showToast(
      'Saved PDF mapping loaded',
      'success'
    )

  } catch (err) {
    console.error(
      'Failed to open PDF template mapping:',
      err
    )

    const status =
      err?.response?.status

    const detail =
      err?.message ||
      'Unknown error'

    showToast(
      status
        ? `Failed to open the saved PDF mapping (${status})`
        : `Failed to open the saved PDF mapping: ${detail}`,
      'error'
    )
  }
}


const saveExistingPdfTemplateConfig = async () => {
  if (
    !editingPdfTemplateId.value
  ) {
    return
  }

  if (
    !pdfBatchConfig.value.fields.length
  ) {
    showToast(
      'Add at least one PDF field mapping',
      'error'
    )
    return
  }

  const hasRepeatingFields =
    pdfBatchConfig.value.fields.some(
      field =>
        field.repeatPerRecord !==
        false
    )

  if (
    newPdfPrintMode.value === 'batch' &&
    hasRepeatingFields &&
    Number(
      pdfBatchConfig.value.recordsPerPage
    ) > 1 &&
    !Number(
      pdfBatchConfig.value.recordGapY
    )
  ) {
    showToast(
      'Create and position the Record 2 preview first',
      'error'
    )
    return
  }

  savingPdfTemplateConfig.value =
    true

  try {

    /*
     * Strip Vue reactive/proxy wrappers before sending the JSON config.
     */
    const configToSave =
      JSON.parse(
        JSON.stringify(
          pdfBatchConfig.value
        )
      )


    const templateId =
      Number(
        editingPdfTemplateId.value
      )


    /*
     * 1. Persist the mapping.
     */
    const saveRes =
      await api.put(
        `/modules/templates/${templateId}/config`,
        {
          name:
            newPdfName.value ||
            'PDF Form',

          printMode:
            newPdfPrintMode.value,

          batchConfig:
            configToSave
        }
      )


    if (
      !saveRes?.data
    ) {
      throw new Error(
        'The backend did not return the saved PDF template.'
      )
    }


    /*
     * 2. Read the template back from the database.
     *
     * Do not trust local state as proof that it saved.
     */
    const verifyRes =
      await api.get(
        `/modules/templates/${templateId}/config`,
        {
          params: {
            _ts:
              Date.now()
          }
        }
      )


    if (
      !verifyRes?.data
    ) {
      throw new Error(
        'Could not verify the saved PDF mapping.'
      )
    }


    const persistedConfig =
      normalizePdfBatchConfig(
        verifyRes.data.batchConfig
      )


    /*
     * Basic persistence verification.
     */
    if (
      persistedConfig.fields.length !==
      configToSave.fields.length
    ) {
      throw new Error(
        'The saved PDF mapping did not match the mapping sent to the server.'
      )
    }


    /*
     * 3. Replace the current editor template with the DB copy.
     */
    const index =
      editModule.value.templates
        .findIndex(
          t =>
            Number(t.id) ===
            templateId
        )


    if (
      index >= 0
    ) {

      editModule.value.templates[index] = {
        ...editModule.value.templates[index],
        ...verifyRes.data,

        batchConfig:
          persistedConfig
      }

    }


    /*
     * 4. Refresh the parent module too so reopening Manage Modules
     *    cannot resurrect an older in-memory config.
     */
    if (
      editModule.value?.id
    ) {

      const moduleRes =
        await api.get(
          `/modules/single/${editModule.value.id}`,
          {
            params: {
              _ts:
                Date.now()
            }
          }
        )


      const freshModule =
        moduleRes?.data


      if (freshModule) {

        const freshIndex =
          modules.value.findIndex(
            item =>
              Number(item.id) ===
              Number(freshModule.id)
          )


        if (
          freshIndex >= 0
        ) {

          modules.value[freshIndex] = {
            ...freshModule,

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

      }

    }


    /*
     * Keep the verified config in the mapper until we close it.
     */
    pdfBatchConfig.value =
      persistedConfig


    console.log(
      'PDF MAPPING SAVED AND VERIFIED:',
      {
        templateId,
        fields:
          persistedConfig.fields.length,

        config:
          persistedConfig
      }
    )


    showToast(
      'PDF mapping saved and verified',
      'success'
    )


    editingPdfTemplateId.value =
      null

    editingPdfFileName.value =
      ''

    addTemplateType.value =
      null

    resetPdfMapper()

  } catch (err) {

    console.error(
      'Failed to save PDF mapping:',
      err
    )


    const status =
      err?.response?.status


    showToast(
      status
        ? `Failed to save PDF mapping (${status})`
        : (
            err?.message ||
            'Failed to save PDF mapping'
          ),
      'error'
    )

  } finally {

    savingPdfTemplateConfig.value =
      false

  }
}


const uploadPendingPdfTemplate = async (
  moduleId
) => {
  if (!pendingPdfFile.value) return

  if (
    !pdfBatchConfig.value.fields.length
  ) {
    showToast(
      'Add at least one PDF field mapping before saving',
      'error'
    )

    throw new Error(
      'PDF field mappings are required'
    )
  }

  const hasRepeatingFields =
    pdfBatchConfig.value.fields.some(
      field =>
        field.repeatPerRecord !==
        false
    )

  if (
    newPdfPrintMode.value === 'batch' &&
    hasRepeatingFields &&
    Number(
      pdfBatchConfig.value.recordsPerPage
    ) > 1 &&
    !Number(
      pdfBatchConfig.value.recordGapY
    )
  ) {
    showToast(
      'Create and position the Record 2 preview so row spacing can be saved',
      'error'
    )

    throw new Error(
      'PDF row spacing is required'
    )
  }

  try {
    const formData =
      new FormData()

    formData.append(
      'file',
      pendingPdfFile.value
    )

    formData.append(
      'name',
      newPdfName.value ||
      'PDF Form'
    )

    formData.append(
      'kind',
      'pdf'
    )

    formData.append(
      'printMode',
      newPdfPrintMode.value
    )

    const configToUpload =
      JSON.parse(
        JSON.stringify(
          pdfBatchConfig.value
        )
      )

    if (
      newPdfPrintMode.value ===
      'row'
    ) {
      configToUpload.recordsPerPage = 1
      configToUpload.recordGapY = 0
      configToUpload.firstAnchor = null
      configToUpload.secondAnchor = null
    }

    formData.append(
      'batchConfig',
      JSON.stringify(
        configToUpload
      )
    )

    await api.post(
      `/modules/${moduleId}/templates`,
      formData,
      {
        headers: {
          'Content-Type':
            'multipart/form-data'
        }
      }
    )
  } catch (err) {
    console.error(err)

    showToast(
      'Module saved, but the PDF template failed to upload',
      'error'
    )

    throw err
  } finally {
    pendingPdfFile.value =
      null

    newPdfName.value =
      'PDF Form'

    newPdfPrintMode.value =
      'batch'

    pdfBatchConfig.value =
      defaultPdfBatchConfig()

    resetPdfMapper()
  }
}


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

  pendingPdfFile.value = null

  newDocxName.value = ''

  newPdfName.value = 'PDF Form'

  newPdfPrintMode.value = 'batch'

  pdfBatchConfig.value = defaultPdfBatchConfig()

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

    templateRowsPerRecord: 1,

    templateRowsPerPage: 9,

    templateMappings: [],

    templates: [],

  }

}

const openEdit = async (m) => {

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

  pendingPdfFile.value =
    null

  newDocxName.value =
    ''

  newPdfName.value =
    'PDF Batch Form'

  pdfBatchConfig.value =
    defaultPdfBatchConfig()

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

    await uploadPendingPdfTemplate(res.data.id)

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

    await uploadPendingPdfTemplate(editModule.value.id)

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
  grid-template-columns: repeat(3, minmax(0, 1fr));
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



/* ================= PRINT MODE CONFIG ================= */

.template-mode-badge {
  display: inline-flex;
  align-items: center;
  margin-left: 7px;
  padding: 2px 7px;
  border-radius: 999px;
  font-size: 10px;
  font-weight: 700;
  vertical-align: middle;
}

.template-mode-badge.row {
  color: #1d4ed8;
  background: #eff6ff;
  border: 1px solid #bfdbfe;
}

.template-mode-badge.batch {
  color: #92400e;
  background: #fffbeb;
  border: 1px solid #fde68a;
}

.print-mode-card {
  margin-bottom: 12px;
  padding: 12px 14px;
  border-radius: 12px;
  border: 1px solid #e5e7eb;
  background: #ffffff;
}

.print-mode-card-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 6px;
  color: #6b7280;
  font-size: 12px;
}

.print-mode-card-title strong {
  color: #111827;
  font-size: 12px;
}

.print-mode-card p {
  margin: 0;
  color: #6b7280;
  font-size: 11px;
  line-height: 1.6;
}

.batch-mode-card {
  background: #fffdf7;
  border-color: #fde68a;
}

.row-mode-card {
  background: #f8fbff;
  border-color: #bfdbfe;
}

.batch-config-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
  margin-top: 12px;
}

.batch-config-hint {
  display: block;
  margin-top: 4px;
  color: #9ca3af;
  font-size: 10px;
  line-height: 1.4;
}

.batch-config-note {
  margin-top: 10px;
  padding: 9px 10px;
  border-radius: 9px;
  background: rgba(255, 255, 255, 0.85);
  color: #6b7280;
  font-size: 10.5px;
  line-height: 1.55;
}

.batch-config-note code {
  padding: 1px 4px;
  border-radius: 4px;
  background: #f3f4f6;
  color: #374151;
}

@media (max-width: 760px) {
  .batch-config-grid {
    grid-template-columns: 1fr;
  }
}



.print-mode-select {
  width: 220px;
  max-width: 100%;
}

.docx-batch-loop {
  margin-top: 12px;
}

.docx-loop-example {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 7px;
  color: #6b7280;
  font-size: 10.5px;
}

.docx-loop-example code {
  padding: 3px 6px;
  border-radius: 5px;
  background: #eff6ff;
  border: 1px solid #bfdbfe;
  color: #1d4ed8;
}

.template-mode-inline-select {
  min-width: 145px;
  padding: 5px 8px;
  border: 1px solid #d1d5db;
  border-radius: 7px;
  background: #ffffff;
  color: #374151;
  font-size: 11px;
}



/* ================= EXCEL MAPPING PREVIEW FIDELITY ================= */

.sheet-preview {
  table-layout: fixed;
  width: max-content;
  min-width: 100%;
}

.sheet-preview-wrap {
  overflow: auto;
  max-width: 100%;
}

.preview-cell {
  box-sizing: border-box;
  position: relative;
  min-width: 0;
  padding: 3px 6px;
  border: 1px solid #e5e7eb;
  background: #ffffff;
}

.preview-cell-text {
  display: block;
  width: 100%;
  min-width: 0;
  line-height: 1.2;
  overflow: inherit;
  white-space: inherit;
  text-overflow: clip;
}

.sheet-preview tr {
  min-height: 0;
}



/* ================= PDF BATCH CONFIG ================= */

.pdf-batch-config {
  margin-top: 12px;
}

.pdf-advanced-config {
  margin-top: 12px;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  background: #ffffff;
  padding: 10px 12px;
}

.pdf-advanced-config summary {
  cursor: pointer;
  font-size: 11px;
  font-weight: 700;
  color: #475569;
}

.pdf-preset-note {
  margin-top: 9px;
  font-size: 10px;
  color: #64748b;
}



/* ================= GENERIC PDF VISUAL MAPPER ================= */

.pdf-generic-config {
  margin-top: 14px;
}

.pdf-mapper-toolbar {
  margin-top: 14px;
  display: flex;
  align-items: flex-end;
  flex-wrap: wrap;
  gap: 9px;
  padding: 12px;
  border: 1px solid #dbe3ed;
  border-radius: 11px;
  background: #f8fafc;
}

.pdf-mapper-source {
  min-width: 180px;
  flex: 1 1 180px;
}

.pdf-mapper-small {
  width: 120px;
}

.pdf-repeat-checkbox {
  min-height: 38px;
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 0 8px;
  color: #475569;
  font-size: 11px;
  white-space: nowrap;
}

.pdf-preview-loading,
.pdf-preview-error {
  margin-top: 12px;
  padding: 12px 14px;
  border-radius: 9px;
  font-size: 11px;
}

.pdf-preview-loading {
  background: #f8fafc;
  color: #64748b;
  border: 1px solid #e2e8f0;
}

.pdf-preview-error {
  background: #fef2f2;
  color: #b91c1c;
  border: 1px solid #fecaca;
}

.pdf-visual-mapper {
  margin-top: 14px;
  overflow: auto;
  max-height: 720px;
  padding: 16px;
  border: 1px solid #dbe3ed;
  border-radius: 12px;
  background: #dfe4ea;
}

.pdf-canvas-stage {
  position: relative;
  width: max-content;
  margin: 0 auto;
  background: #ffffff;
  box-shadow: 0 10px 28px rgba(15, 23, 42, 0.16);
}

.pdf-mapper-canvas {
  display: block;
  cursor: crosshair;
}

.pdf-map-marker {
  position: absolute;
  z-index: 3;
  width: 22px;
  height: 22px;
  transform: translate(-50%, -50%);
  border: 2px solid #ffffff;
  border-radius: 999px;
  background: #2563eb;
  color: #ffffff;
  box-shadow: 0 3px 8px rgba(15, 23, 42, 0.26);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  font-weight: 800;
  pointer-events: none;
}

.pdf-mapping-list {
  margin-top: 12px;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  overflow: hidden;
  background: #ffffff;
}

.pdf-mapping-list-title {
  padding: 9px 12px;
  background: #f8fafc;
  color: #334155;
  font-size: 11px;
  font-weight: 800;
  border-bottom: 1px solid #e2e8f0;
}

.pdf-mapping-row {
  display: flex;
  align-items: center;
  gap: 9px;
  padding: 8px 10px;
  border-bottom: 1px solid #eef2f7;
}

.pdf-mapping-row:last-child {
  border-bottom: 0;
}

.pdf-map-number {
  flex: 0 0 auto;
  width: 22px;
  height: 22px;
  border-radius: 999px;
  background: #2563eb;
  color: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  font-weight: 800;
}

.pdf-map-summary {
  flex: 1 1 auto;
  min-width: 150px;
}

.pdf-map-summary strong,
.pdf-map-summary span {
  display: block;
}

.pdf-map-summary strong {
  color: #0f172a;
  font-size: 11px;
}

.pdf-map-summary span {
  margin-top: 2px;
  color: #94a3b8;
  font-size: 9.5px;
}

.pdf-inline-input {
  width: 125px;
}

.pdf-inline-number {
  width: 78px;
}

.pdf-generic-help {
  margin-top: 11px;
  padding: 10px 12px;
  border-radius: 9px;
  background: #eff6ff;
  color: #475569;
  font-size: 10.5px;
  line-height: 1.55;
}

@media (max-width: 760px) {
  .pdf-mapping-row {
    align-items: stretch;
    flex-wrap: wrap;
  }

  .pdf-inline-input,
  .pdf-inline-number {
    width: 100%;
  }
}



.pdf-preview-error {
  white-space: pre-wrap;
  word-break: break-word;
}



/* ================= EXCEL-LIKE PDF MAPPER ================= */

.pdf-template-top-row {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.pdf-template-top-row .col-input {
  width: 320px;
  max-width: 100%;
}

.pdf-selected-file {
  margin-top: 7px;
  color: #16a34a;
  font-size: 11px;
}

.pdf-section-card {
  margin-top: 12px;
  padding: 12px;
  border: 1px solid #dbe3ed;
  border-radius: 11px;
  background: #ffffff;
}

.pdf-section-title {
  margin-bottom: 9px;
  color: #0f172a;
  font-size: 11px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.pdf-calculated-field {
  height: 38px;
  padding: 0 11px;
  border: 1px solid #dbe3ed;
  border-radius: 8px;
  background: #f8fafc;
  color: #0f172a;
  display: flex;
  align-items: center;
  font-size: 12px;
  font-weight: 700;
}

.pdf-anchor-help {
  color: #64748b;
  font-size: 10.5px;
  line-height: 1.5;
}

.pdf-anchor-actions {
  margin-top: 10px;
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.pdf-anchor-actions .btn-add-col.active,
.pdf-place-btn.active {
  background: #2563eb;
  border-color: #2563eb;
  color: #ffffff;
}

.btn-remove-anchor {
  padding: 7px 10px;
  border: 1px solid #fecaca;
  border-radius: 8px;
  background: #ffffff;
  color: #dc2626;
  font-size: 11px;
  cursor: pointer;
}

.pdf-click-instruction {
  margin-top: 8px;
  padding: 8px 10px;
  border-radius: 8px;
  background: #eff6ff;
  border: 1px solid #bfdbfe;
  color: #1d4ed8;
  font-size: 10.5px;
  font-weight: 700;
}

.pdf-auto-map-tip {
  margin-top: 8px;
  color: #64748b;
  font-size: 10px;
  line-height: 1.5;
}

.pdf-anchor-marker {
  position: absolute;
  z-index: 4;
  width: 28px;
  height: 28px;
  transform: translate(-50%, -50%);
  border-radius: 999px;
  color: #ffffff;
  box-shadow: 0 3px 9px rgba(15, 23, 42, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 9px;
  font-weight: 900;
  pointer-events: none;
}

.pdf-anchor-marker.first {
  background: #059669;
  border: 2px solid #d1fae5;
}

.pdf-anchor-marker.second {
  background: #ea580c;
  border: 2px solid #ffedd5;
}



/* ================= PDF BOX MAPPING + EDITING ================= */

.btn-template-edit {
  padding: 5px 9px;
  border: 1px solid #bfdbfe;
  border-radius: 7px;
  background: #eff6ff;
  color: #1d4ed8;
  font-size: 10.5px;
  font-weight: 700;
  cursor: pointer;
}

.btn-template-edit:hover {
  background: #dbeafe;
}

.pdf-existing-file {
  padding: 7px 10px;
  border: 1px solid #dbe3ed;
  border-radius: 8px;
  background: #f8fafc;
  color: #475569;
  font-size: 10.5px;
}

.pdf-map-box {
  position: absolute;
  z-index: 3;
  box-sizing: border-box;
  border: 2px solid #2563eb;
  border-radius: 4px;
  background: rgba(37, 99, 235, 0.10);
  color: #1e3a8a;

  /*
   * IMPORTANT:
   * The mapping label and resize handle live outside the box.
   * The text itself clips inside .pdf-map-box-text.
   */
  overflow: visible;

  pointer-events: auto;
  cursor: move;
  touch-action: none;
  user-select: none;
  outline: none;
}

.pdf-map-box:hover {
  border-color: #1d4ed8;
  background: rgba(37, 99, 235, 0.14);
}

.pdf-map-box.selected {
  border-color: #f59e0b;
  background: rgba(245, 158, 11, 0.12);
  box-shadow:
    0 0 0 2px rgba(245, 158, 11, 0.18),
    0 3px 10px rgba(15, 23, 42, 0.16);
}

.pdf-map-box-ghost {
  pointer-events: none;
  border-style: dashed;
  border-color: #10b981;
  background: rgba(16, 185, 129, 0.07);
  opacity: 0.72;
}

.pdf-map-box-ghost-r2 {
  pointer-events: auto;
  cursor: ns-resize;
  border-color: #10b981;
  background: rgba(16, 185, 129, 0.10);
  opacity: 0.82;
  touch-action: none;
  z-index: 4;
}

.pdf-map-box-ghost-r2:hover,
.pdf-map-box-ghost-r2:focus {
  border-color: #059669;
  background: rgba(16, 185, 129, 0.17);
  box-shadow: 0 0 0 2px rgba(16, 185, 129, 0.14);
  outline: none;
}

.pdf-map-box-ghost-r3 {
  pointer-events: none;
  border-color: #8b5cf6;
  background: rgba(139, 92, 246, 0.06);
  opacity: 0.52;
  z-index: 2;
}

.pdf-map-box-number {
  /*
   * Keep the mapper badge OUTSIDE the actual text rectangle.
   * Previously this badge consumed ~20 px inside the field, so the
   * preview looked aligned while the generated PDF started farther left.
   */
  position: absolute;
  top: 0;
  left: 0;
  transform: translate(-45%, -105%);
  min-width: 18px;
  height: 18px;
  padding: 0 5px;
  border-radius: 999px;
  background: #2563eb;
  color: #ffffff;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 9px;
  font-weight: 800;
  line-height: 1;
  box-shadow: 0 2px 6px rgba(15, 23, 42, 0.22);
  pointer-events: none;
}

.pdf-map-box-text {
  /*
   * WYSIWYG positioning:
   * text starts at the exact X coordinate of the saved PDF box.
   * No hidden 20 px mapper-only offset.
   */
  position: absolute;
  left: 0;
  right: 0;
  top: 50%;
  transform: translateY(-50%);
  box-sizing: border-box;
  padding: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: clip;
  line-height: 1;
  pointer-events: none;
}

.pdf-inline-select {
  width: 92px;
}

.pdf-edit-actions {
  margin-top: 12px;
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}



/* ================= PDF DRAG / RESIZE DESIGNER ================= */

.pdf-designer-toolbar {
  margin-top: 12px;
  margin-bottom: 10px;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
  padding: 10px 12px;
  border: 1px solid #dbe3ed;
  border-radius: 10px;
  background: #f8fafc;
}

.pdf-toolbar-label {
  color: #475569;
  font-size: 10px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.pdf-zoom-group {
  display: flex;
  align-items: center;
  gap: 5px;
  flex-wrap: wrap;
}

.pdf-zoom-btn {
  padding: 5px 8px;
  border: 1px solid #dbe3ed;
  border-radius: 7px;
  background: #ffffff;
  color: #475569;
  font-size: 10px;
  cursor: pointer;
}

.pdf-zoom-btn:hover {
  background: #f1f5f9;
}

.pdf-zoom-btn.active {
  border-color: #2563eb;
  background: #eff6ff;
  color: #1d4ed8;
  font-weight: 800;
}

.pdf-sample-picker {
  display: flex;
  align-items: center;
  gap: 7px;
}

.pdf-sample-picker .form-input {
  min-width: 130px;
  width: auto;
}

.pdf-sample-status {
  color: #64748b;
  font-size: 10px;
}

.pdf-designer-hint {
  flex: 1 1 320px;
  color: #64748b;
  font-size: 10px;
  line-height: 1.4;
}

.pdf-resize-handle {
  position: absolute;
  right: -5px;
  bottom: -5px;
  z-index: 5;
  width: 11px;
  height: 11px;
  border: 2px solid #ffffff;
  border-radius: 3px;
  background: #2563eb;
  box-shadow: 0 1px 5px rgba(15, 23, 42, 0.28);
  cursor: nwse-resize;
  touch-action: none;
}

.pdf-map-box.selected .pdf-resize-handle {
  background: #f59e0b;
}

.pdf-map-box-number.ghost {
  background: #059669;
}

.pdf-map-box-number.ghost-r3 {
  background: #7c3aed;
}

.pdf-mapping-row {
  cursor: pointer;
}

.pdf-mapping-row.selected {
  background: #fffbeb;
  box-shadow: inset 3px 0 0 #f59e0b;
}

.pdf-mapping-row.selected .pdf-map-number {
  background: #f59e0b;
}

.pdf-visual-mapper {
  scroll-behavior: smooth;
}

.pdf-canvas-stage {
  isolation: isolate;
}



/* ================= PDF RECORD BLOCK POSITIONING ================= */

.pdf-record-block-controls {
  margin-top: 11px;
  display: flex;
  align-items: flex-end;
  gap: 9px;
  flex-wrap: wrap;
}

.pdf-record-block-controls .btn-add-col:disabled,
.pdf-nudge-btn:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.pdf-gap-editor {
  width: 150px;
}

.pdf-gap-nudges {
  display: flex;
  align-items: center;
  gap: 5px;
  flex-wrap: wrap;
}

.pdf-nudge-btn {
  min-height: 36px;
  padding: 0 9px;
  border: 1px solid #dbe3ed;
  border-radius: 8px;
  background: #ffffff;
  color: #334155;
  font-size: 10.5px;
  font-weight: 700;
  cursor: pointer;
}

.pdf-nudge-btn:hover:not(:disabled) {
  background: #f8fafc;
  border-color: #94a3b8;
}

.pdf-record-block-status,
.pdf-record-block-empty {
  margin-top: 10px;
  padding: 10px 12px;
  border-radius: 9px;
  font-size: 10.5px;
  line-height: 1.5;
}

.pdf-record-block-status {
  border: 1px solid #a7f3d0;
  background: #ecfdf5;
  color: #065f46;
}

.pdf-record-block-status strong,
.pdf-record-block-status span {
  display: block;
}

.pdf-record-block-status span {
  margin-top: 3px;
  color: #047857;
}

.pdf-record-block-empty {
  border: 1px dashed #cbd5e1;
  background: #f8fafc;
  color: #64748b;
}

@media (max-width: 760px) {
  .pdf-gap-editor {
    width: 100%;
  }

  .pdf-gap-nudges {
    width: 100%;
  }

  .pdf-nudge-btn {
    flex: 1 1 auto;
  }
}



/* ================= PDF FULL-SCREEN MAPPING MODAL ================= */

.pdf-editor-shell {
  width: 100%;
}

.pdf-editor-surface {
  width: 100%;
}

.pdf-editor-shell-modal {
  position: fixed;
  inset: 0;
  z-index: 30000;
  padding: 18px;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(15, 23, 42, 0.72);
  backdrop-filter: blur(5px);
}

.pdf-editor-surface-modal {
  width: min(96vw, 1680px);
  height: 94vh;
  overflow: auto;
  box-sizing: border-box;
  padding: 0 18px 22px;
  border-radius: 16px;
  background: #f8fafc;
  box-shadow:
    0 28px 90px rgba(15, 23, 42, 0.35);
}

.pdf-editor-modal-header {
  position: sticky;
  top: 0;
  z-index: 30;
  margin: 0 -18px 14px;
  padding: 15px 18px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  border-bottom: 1px solid #e2e8f0;
  background: rgba(255, 255, 255, 0.97);
  backdrop-filter: blur(8px);
}

.pdf-editor-modal-header h3 {
  margin: 0;
  color: #0f172a;
  font-size: 16px;
  font-weight: 800;
}

.pdf-editor-modal-header p {
  margin: 3px 0 0;
  color: #64748b;
  font-size: 11px;
}

.pdf-editor-modal-close {
  flex: 0 0 auto;
  width: 36px;
  height: 36px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px solid #dbe3ed;
  border-radius: 9px;
  background: #ffffff;
  color: #64748b;
  cursor: pointer;
}

.pdf-editor-modal-close:hover {
  background: #f8fafc;
  color: #0f172a;
}

.pdf-editor-surface-modal .pdf-visual-mapper {
  max-height: 68vh;
}

.pdf-editor-surface-modal .pdf-edit-actions {
  position: sticky;
  bottom: 0;
  z-index: 25;
  margin: 14px -18px -22px;
  padding: 12px 18px;
  border-top: 1px solid #e2e8f0;
  background: rgba(255, 255, 255, 0.97);
  backdrop-filter: blur(8px);
}

@media (max-width: 760px) {
  .pdf-editor-shell-modal {
    padding: 0;
  }

  .pdf-editor-surface-modal {
    width: 100vw;
    height: 100vh;
    border-radius: 0;
  }
}



/* ================= PENDING PDF FORM ================= */

.pending-pdf-template-row {
  margin-bottom: 10px;
  border-color: #bfdbfe;
  background: #f8fbff;
}

.pending-template-note {
  display: block;
  margin-top: 3px;
  color: #16a34a;
  font-size: 10px;
  font-weight: 600;
}

</style>