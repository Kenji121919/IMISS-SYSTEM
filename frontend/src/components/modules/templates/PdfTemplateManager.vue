<template>
  <div class="pdf-template-manager">

    <div
      v-for="t in pdfTemplates"
      :key="'pdf-' + t.id"
      class="template-library-row pdf-library-row"
    >
      <div class="template-type-icon pdf">PDF</div>

      <div class="template-library-info">
        <div class="template-library-name">
          {{ t.name || 'PDF form' }}
        </div>
        <div class="template-library-meta">
          PDF · {{ t.fileName }}
        </div>
      </div>

      <div class="template-library-controls">
        <select
          :value="t.printMode || 'batch'"
          class="template-mode-select-clean"
          @change="updatePdfPrintMode(t, $event.target.value)"
          title="Choose how this PDF is used"
        >
          <option value="row">Per row</option>
          <option value="batch">Batch / filtered</option>
        </select>

        <button
          type="button"
          class="template-edit-btn"
          @click="editPdfTemplate(t)"
          title="Edit PDF mapping"
        >
          Edit mapping
        </button>

        <button
          type="button"
          class="template-delete-btn"
          @click="deletePdfTemplate(t.id)"
          title="Remove PDF template"
        >
          ✕
        </button>
      </div>
    </div>

    <!-- PENDING PDF — configured in popup, uploaded when module is saved -->
    <div
      v-if="pendingPdfFile && !showPdfModal"
      class="template-library-row pdf-library-row pending-pdf-template-row"
    >
      <div class="template-type-icon pdf">PDF</div>

      <div class="template-library-info">
        <div class="template-library-name">
          {{ newPdfName || 'PDF Form' }}
        </div>
        <div class="template-library-meta">
          PDF · {{ pendingPdfFile.name }}
        </div>
        <div class="pending-template-note">
          Ready — will upload when you save the module.
        </div>
      </div>

      <div class="template-library-controls">
        <span
          :class="[
            'template-mode-static',
            newPdfPrintMode === 'row' ? 'row' : 'batch'
          ]"
        >
          {{
            newPdfPrintMode === 'row'
              ? 'Per row'
              : 'Batch / filtered'
          }}
        </span>

        <button
          type="button"
          class="template-edit-btn"
          @click="reopenPendingPdfMapping"
        >
          Edit mapping
        </button>

        <button
          type="button"
          class="template-delete-btn"
          @click="discardPendingPdfTemplate"
          title="Discard pending PDF"
        >
          ✕
        </button>
      </div>
    </div>

    <template v-if="showPdfModal">
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
                                v-for="col in moduleData.columns.filter(c => c.name)"
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
</template>

<script setup>
import { usePdfTemplateManager } from '@/composables/usePdfTemplateManager'

const props = defineProps({
  moduleData: {
    type: Object,
    required: true
  },

  activeModuleId: {
    type: [Number, String],
    default: null
  }
})

const emit = defineEmits([
  'notify',
  'template-saved',
  'template-deleted',
  'template-uploaded',
  'module-refreshed'
])

const {
  pdfTemplates,
  showPdfModal,
  notify,
  newPdfName,
  newPdfPrintMode,
  pendingPdfFile,
  editingPdfTemplateId,
  editingPdfFileName,
  savingPdfTemplateConfig,
  pdfMapperCanvas,
  pdfPageReady,
  pdfPreviewLoading,
  pdfPreviewError,
  pdfRenderedViewport,
  pdfPreviewBytes,
  pdfMapperZoom,
  selectedPdfMappingId,
  pdfBoxInteraction,
  pdfRecordBlockInteraction,
  pdfSampleRecords,
  pdfSampleIndex,
  pdfSampleLoading,
  defaultPdfBatchConfig,
  pdfBatchConfig,
  onPdfPrintModeChange,
  defaultPdfNewMapping,
  pdfNewMapping,
  pdfMappingArmed,
  resetPdfMapper,
  renderPdfMapperPreview,
  setPdfMapperZoom,
  loadPdfSampleRecords,
  onPdfSelected,
  canvasClickToPdfPoint,
  snapPdfSpacing,
  hasRepeatingPdfFields,
  estimatePdfRecordGap,
  preparePdfRecord2Block,
  normalizePdfRecordGap,
  nudgePdfRecordBlock,
  resetPdfRecordSpacing,
  startPdfRecordBlockDrag,
  movePdfRecordBlock,
  endPdfRecordBlockDrag,
  onPdfRecordBlockKeydown,
  armPdfMapping,
  onPdfCanvasClick,
  removePdfMapping,
  pdfMappingLabel,
  pdfPointStyle,
  pdfMarkerStyle,
  pdfMappingPreviewText,
  selectPdfMapping,
  ensurePdfBoxTopLeft,
  startPdfBoxDrag,
  startPdfBoxResize,
  movePdfBox,
  endPdfBoxInteraction,
  onPdfBoxKeydown,
  pdfRepeatPreviewStyle,
  normalizePdfBatchConfig,
  editPdfTemplate,
  saveExistingPdfTemplateConfig,
  uploadPendingPdfTemplate,
  validatePendingPdfMapping,
  finishNewPdfMapping,
  reopenPendingPdfMapping,
  discardPendingPdfTemplate,
  openNewPdf,
  cancelAddTemplate,
  updatePdfPrintMode,
  deletePdfTemplate,
  resetPdfFeature,
  hasPendingPdf
} = usePdfTemplateManager(
  props,
  emit
)

defineExpose({
  openNewPdf,
  uploadPendingPdfTemplate,
  resetPdfFeature,
  hasPendingPdf
})
</script>

<style scoped src="../../../styles/pdf-template-manager.css"></style>
