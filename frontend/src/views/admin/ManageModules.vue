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
          <div class="section">
  <div class="section-label">Excel Template</div>

  <input
    type="file"
    accept=".xlsx,.xls"
    @change="onTemplateSelected"
  />

  <div
    v-if="selectedTemplate"
    style="margin-top:8px;font-size:13px;color:#16a34a;"
  >
    Selected:
    {{ selectedTemplate.name }}
  </div>

  <div
    v-else-if="editModule.templateFile"
    style="margin-top:8px;font-size:13px;color:#64748b;"
  >
    Current:
    {{ editModule.templateFile }}
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

/* ================= STATE ================= */
const modules = ref([])
const profiles = ref([])
const activeModule = ref(null)
const editorMode = ref(null) // 'create' | 'edit' | null
const saving = ref(false)
const selectedTemplate = ref(null)

const editModule = ref({
  name: '',
  columns: [],
  allowedProfiles: []
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
      columns: typeof m.columns === 'string' ? JSON.parse(m.columns) : m.columns
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
    allowedProfiles: []
  }
}

const openEdit = (m) => {
  activeModule.value = m
  editorMode.value = 'edit'

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
    allowedProfiles: m.allowedProfiles?.map(p => Number(typeof p === 'object' ? p.id : p)) || []
  }
}

const closeEditor = () => {
  editorMode.value = null
  activeModule.value = null
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
  // Deep copy — editing one won't affect the other
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

/* ================================== */

  const onTemplateSelected = (event) => {
  const file = event.target.files[0]

  if (!file) {
    selectedTemplate.value = null
    return
  }

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
}
/* ================= CREATE ================= */
const createModule = async () => {
  if (!editModule.value.name.trim()) {
    return showToast('Module name required', 'error')
  }

  saving.value = true

  try {
    const res = await api.post('/modules', {
      name: editModule.value.name,
      columns: formatColumns(editModule.value.columns),
      allowedProfiles: editModule.value.allowedProfiles,
      userId: user.id,
    })

    if (selectedTemplate.value) {
      const formData = new FormData()

      formData.append('file', selectedTemplate.value)

      await api.post(
        `/modules/${res.data.id}/template`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        },
      )
    }

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
const updateModule = async () => {
  if (!editModule.value.name.trim()) return showToast('Module name required', 'error')
  saving.value = true
  try {
    await api.put(`/modules/${editModule.value.id}`, {
      name: editModule.value.name,
      columns: formatColumns(editModule.value.columns),
      allowedProfiles: editModule.value.allowedProfiles.map(Number)
    })
        if (selectedTemplate.value) {
  const formData = new FormData()

  formData.append('file', selectedTemplate.value)

  await api.post(
    `/modules/${editModule.value.id}/template`,
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    },
  )
}
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
</style>