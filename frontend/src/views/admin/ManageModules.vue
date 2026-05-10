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
              <button class="btn-icon-action edit" @click="openEdit(m)" title="Edit">✏</button>
              <button class="btn-icon-action danger" @click="askDelete(m)" title="Delete">🗑</button>
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
                </select>

                <input
                  v-if="element.type === 'select'"
                  v-model="element.optionsInput"
                  class="col-input"
                  placeholder="Yes,No,Pending"
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
              :class="['chip', { active: editModule.allowedProfiles?.includes(p.id) }]"
              @click="toggleProfile(p.id)"
            >
              <span v-if="editModule.allowedProfiles?.includes(p.id)" class="chip-check">✓</span>
              {{ p.name }}
            </div>
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
  activeModule.value = null
  editorMode.value = 'create'
  editModule.value = {
    name: '',
    columns: [{
      uid: Date.now(),
      name: '',
      type: 'varchar',
      optionsInput: '',
      options: [],
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
          optionsInput: Array.isArray(col.options) ? col.options.join(',') : ''
        }))
      : [],
    allowedProfiles: m.allowedProfiles?.map(p => typeof p === 'object' ? p.id : p) || []
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
    optionsInput: '',
    options: [],
    filterable: false,
    required: false
  })
}

const removeEditColumn = (i) => {
  editModule.value.columns.splice(i, 1)
}

/* ================= PROFILES ================= */
const toggleProfile = (id) => {
  const list = editModule.value.allowedProfiles
  const idx = list.indexOf(id)
  if (idx === -1) list.push(id)
  else list.splice(idx, 1)
}

/* ================= FORMAT COLUMNS ================= */
const formatColumns = (columns) =>
  columns.map(col => ({
    name: col.name,
    type: col.type,
    filterable: col.filterable || false,
    required: col.required || false,
    options: col.type === 'select'
      ? col.optionsInput.split(',').map(o => o.trim()).filter(Boolean)
      : []
  }))

/* ================= CREATE ================= */
const createModule = async () => {
  if (!editModule.value.name.trim()) return showToast('Module name required', 'error')
  saving.value = true
  try {
    await api.post('/modules', {
      name: editModule.value.name,
      columns: formatColumns(editModule.value.columns),
      allowedProfiles: editModule.value.allowedProfiles,
      userId: user.id
    })
    await loadModules()
    closeEditor()
    showToast('Module created', 'success')
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
      allowedProfiles: editModule.value.allowedProfiles
    })
    await loadModules()
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
  align-items: center;
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

.col-badges { display: flex; gap: 4px; flex-wrap: wrap; }

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
</style>