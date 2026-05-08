<template>
  <div class="container">

    <!-- ================= TOOLBAR ================= -->
<div class="toolbar">

  <!-- LEFT: TITLE -->
  <div class="toolbar-left">
    <h1>{{ module?.name || 'Module' }}</h1>
  </div>

  <!-- RIGHT: CONTROLS -->
  <div class="toolbar-right">

    <!-- SEARCH -->
    <input
      v-model="searchQuery"
      type="text"
      placeholder="Search logs..."
      class="search-input"
    />

    <!-- FILTERS -->
    <div class="filter-bar">

      <div
        v-for="col in columns.filter(c => c.filterable)"
        :key="col.name"
        class="filter-item"
      >

        <!-- SELECT FILTER -->
          <select
              v-if="col.type === 'select'"
              v-model="activeFilters[col.name]"
              class="filter-select"
            >
              <option value="" disabled selected>
                Select {{ col.name }}
              </option>

              <option
                v-for="opt in col.options"
                :key="opt"
                :value="opt"
              >
                {{ opt }}
              </option>
        </select>
        <!-- TEXT FILTER -->
        <input
          v-else
          v-model="activeFilters[col.name]"
          :placeholder="`Filter ${col.name}`"
        />

      </div>

    </div>

    <!-- ADD BUTTON -->
    <button class="add-btn" @click="openAdd">
      + Add Log
    </button>

  </div>

</div>

    <!-- ================= TABLE ================= -->
    <div class="table-wrapper" v-if="columns.length">

      <table class="table">

        <thead>
          <tr>
            <th v-for="col in columns" :key="col.name">
              {{ col.name }}
            </th>
            <th>Actions</th>
          </tr>
        </thead>

        <tbody>
          <tr v-for="log in filteredLogs" :key="log.id">

            <td v-for="col in columns" :key="col.name">
              {{ getValue(log, col.name) }}
            </td>

            <td class="actions">
              <button class="icon-btn edit" @click="openEdit(log)">Edit</button>
              <button class="icon-btn delete" @click="askDelete(log)">Delete</button>
            </td>

          </tr>
        </tbody>

      </table>

    </div>

    <p v-else>Loading module...</p>

    <!-- ================= MODAL ================= -->
    <div v-if="showModal" class="modal-backdrop">

      <div class="modal-card">

        <!-- HEADER -->
        <div class="modal-header">
          <h3>{{ isEdit ? 'Update Log' : 'Add Log' }}</h3>
        </div>

        <!-- BODY -->
        <div class="modal-body">

          <div v-for="col in columns" :key="col.name">

            <label>{{ col.name }}</label>

            <select
              v-if="col.type === 'select'"
              v-model="form[col.name]"
            >
              <option value="">Select option</option>

              <option
                v-for="opt in col.options"
                :key="opt"
                :value="opt"
              >
                {{ opt }}
              </option>
            </select>

            <input
              v-else
              v-model="form[col.name]"
              :type="inputType(col.type)"
            />

          </div>

        </div>

        <!-- FOOTER -->
        <div class="modal-footer">
          <button class="btn-save" @click="saveLog">Save</button>
          <button class="btn-cancel" @click="closeModal">Cancel</button>
        </div>

      </div>

    </div>

    <!-- ================= DELETE MODAL ================= -->
    <div v-if="showDelete" class="modal-backdrop">

      <div class="modal-card">

        <div class="modal-header">
          <h3>Delete log?</h3>
        </div>

        <div class="modal-footer">
          <button class="btn-cancel" @click="showDelete = false">Cancel</button>
          <button class="btn-danger" @click="deleteLog">Delete</button>
        </div>

      </div>

    </div>

  </div>
</template>

<script setup>
import { ref, onMounted, watch, computed } from 'vue'
import { useRoute } from 'vue-router'
import api from '@/api/axios'

const route = useRoute()

const module = ref(null)
const columns = ref([])
const logs = ref([])
const showModal = ref(false)
const showDelete = ref(false)
const isEdit = ref(false)
const selectedId = ref(null)
const form = ref({})
const searchQuery = ref('')
const activeFilters = ref({})



/* ================= SAFE PARSE ================= */
const safeParse = (val) => {
  if (!val) return []
  if (typeof val === 'object') return val
  try {
    return JSON.parse(val)
  } catch {
    return []
  }
}
/* ================= LOAD MODULE ================= */
const loadModule = async () => {
  const res = await api.get(`/modules/single/${route.params.id}`)

  module.value = res.data

  const parsedColumns = safeParse(res.data.columns)

  columns.value = parsedColumns.map(col => ({
    ...col,
    options:
      typeof col.options === 'string'
        ? safeParse(col.options)
        : col.options || []
  }))
  activeFilters.value = {}

columns.value.forEach(col => {
  if (col.filterable) {
    activeFilters.value[col.name] = ''
  }
})
}
/* ================= NORMALIZE LOG VALUES ================= */
const normalizeLog = (log) => {
  const data = {}

  if (log.values && Array.isArray(log.values)) {
    log.values.forEach(v => {
      const colName = v.column?.name || v.column
      data[colName] = v.value
    })
  }

  if (log.data && typeof log.data === 'object') {
    Object.assign(data, log.data)
  }

  return {
    ...log,
    data
  }
}

/* ================= LOAD LOGS ================= */
const loadLogs = async () => {
  const res = await api.get(`/logs/module/${route.params.id}`)
  logs.value = res.data.map(normalizeLog)
}

/* ================= MASTER LOADER ================= */
const loadAll = async () => {
  await loadModule()
  await loadLogs()
}

/* ================= GET VALUE ================= */
const getValue = (log, columnName) => {
  return log.data?.[columnName] ?? '-'
}
/* ================= FILTERED LOGS ================= */
const filteredLogs = computed(() => {
  return logs.value.filter(log => {

    // ================= GLOBAL SEARCH =================
    const matchesSearch = !searchQuery.value || Object.values(log.data || {})
      .join(' ')
      .toLowerCase()
      .includes(searchQuery.value.toLowerCase())

    // ================= COLUMN FILTERS =================
    const matchesFilters = Object.entries(activeFilters.value).every(([key, value]) => {
      if (!value) return true

      const logValue = getValue(log, key)

      return String(logValue)
        .toLowerCase()
        .includes(String(value).toLowerCase())
    })

    return matchesSearch && matchesFilters
  })
})
/* ================= INPUT TYPE ================= */
const inputType = (type) => {
  if (type === 'date') return 'date'
  if (type === 'time') return 'time'
  if (type === 'int') return 'number'
  return 'text'
}

/* ================= ADD ================= */
const openAdd = () => {
  isEdit.value = false
  selectedId.value = null

  form.value = {}

  columns.value.forEach(c => {
    form.value[c.name] = ''
  })

  showModal.value = true
}

/* ================= EDIT ================= */
const openEdit = (log) => {
  isEdit.value = true
  selectedId.value = log.id

  form.value = { ...log.data }

  showModal.value = true
}

/* ================= SAVE ================= */
const saveLog = async () => {
  if (isEdit.value) {
    await api.put(`/logs/${selectedId.value}`, {
      data: form.value
    })
  } else {
    await api.post(`/logs`, {
      moduleId: route.params.id,
      data: form.value
    })
  }

  showModal.value = false
  await loadLogs()
}

/* ================= DELETE ================= */
const askDelete = (log) => {
  selectedId.value = log.id
  showDelete.value = true
}

const deleteLog = async () => {
  await api.delete(`/logs/${selectedId.value}`)
  showDelete.value = false
  await loadLogs()
}

/* ================= CLOSE MODAL ================= */
const closeModal = () => {
  showModal.value = false
}

/* ================= INIT ================= */
onMounted(async () => {
  await loadAll()
})

/* ================= AUTO REFRESH ON MODULE SWITCH ================= */
watch(
  () => route.params.id,
  async (newId, oldId) => {
    if (newId && newId !== oldId) {
      await loadAll()
    }
  }
)
</script>

<style>
/* ================= BASE ================= */
.container {
  padding: 24px;
  background: #f6f8fb;
  min-height: 100vh;
  font-family: Arial, sans-serif;
  color: #333;
}

/* ================= TOOLBAR ================= */
/* ================= TOOLBAR ================= */
.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  margin-bottom: 16px;
}

.toolbar-left h1 {
  font-size: 22px;
  font-weight: 700;
  margin: 0;
  color: #1e1e2f;
}

/* RIGHT SIDE ROW */
.toolbar-right {
  display: flex;
  align-items: center; /* KEY FIX */
  gap: 10px;
  flex-wrap: wrap;
}

/* ================= SEARCH ================= */
.search-input {
  width: 220px;
  height: 38px;
  padding: 0 12px;
  border-radius: 10px;
  border: 1px solid #ddd;
  font-size: 13px;
  outline: none;
  background: white;
  box-sizing: border-box;
}

.search-input:focus {
  border-color: #1e90ff;
  box-shadow: 0 0 0 3px rgba(30,144,255,0.12);
}

/* ================= FILTER BAR ================= */
.filter-bar {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  align-items: center;
}

/* EACH FILTER */
.filter-item {
  display: flex;
}

/* default select style */
.filter-select {
  color: #333;
}

.filter-select:invalid {
  color: #999;
}
/* INPUTS + SELECTS SAME HEIGHT */
.filter-item select,
.filter-item input {
  height: 38px;
  padding: 0 10px;
  border-radius: 10px;
  border: 1px solid #ddd;
  font-size: 13px;
  background: white;
  box-sizing: border-box;
  min-width: 140px;
}

/* FOCUS STYLE */
.filter-item select:focus,
.filter-item input:focus {
  border-color: #1e90ff;
  outline: none;
  box-shadow: 0 0 0 3px rgba(30,144,255,0.12);
}

/* ================= ADD BUTTON ================= */
.add-btn {
  height: 38px;
  padding: 0 14px;
  border-radius: 10px;
  background: linear-gradient(135deg, #1e90ff, #187bcd);
  color: white;
  border: none;
  font-size: 13px;
  cursor: pointer;
  white-space: nowrap;
}

/* ================= TABLE ================= */
.table-wrapper {
  background: white;
  border-radius: 14px;
  overflow: hidden;
  box-shadow: 0 6px 18px rgba(0,0,0,0.05);
}

.table {
  width: 100%;
  border-collapse: collapse;
}

.table thead {
  background: #1e1e2f;
  color: white;
}

.table th {
  padding: 14px;
  text-align: left;
  font-size: 13px;
}

.table td {
  padding: 12px 14px;
  border-bottom: 1px solid #f0f0f0;
  font-size: 13px;
}

.table tbody tr:hover {
  background: #f7faff;
}

/* ================= ACTIONS ================= */
.actions {
  display: flex;
  gap: 8px;
}

.icon-btn {
  border: none;
  padding: 6px 10px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 12px;
}

.icon-btn.edit {
  background: #1e90ff;
  color: white;
}

.icon-btn.delete {
  background: #ff4d4d;
  color: white;
}

/* ================= MODAL ================= */
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.55);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 999;
}

.modal-card {
  background: white;
  width: 480px;
  max-width: 95%;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 15px 40px rgba(0,0,0,0.25);
}

/* MODAL HEADER */
.modal-header {
  padding: 16px 18px;
  border-bottom: 1px solid #eee;
  background: #f9fafc;
}

.modal-header h3 {
  margin: 0;
  font-size: 18px;
}

/* MODAL BODY */
.modal-body {
  padding: 18px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.modal-body label {
  font-size: 12px;
  color: #666;
  margin-bottom: 4px;
  display: block;
}

/* INPUTS */
.modal-body input,
.modal-body select {
  width: 90%;
  padding: 10px 12px;
  border-radius: 10px;
  border: 1px solid #ddd;
  font-size: 13px;
  outline: none;
}

/* MODAL FOOTER */
.modal-footer {
  padding: 14px 18px;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  border-top: 1px solid #eee;
  background: #fafafa;
}

/* BUTTONS */
.btn-save {
  background: #28a745;
  color: white;
  border: none;
  padding: 10px 14px;
  border-radius: 10px;
}

.btn-cancel {
  background: #aaa;
  color: white;
  border: none;
  padding: 10px 14px;
  border-radius: 10px;
}

.btn-danger {
  background: #ff4d4d;
  color: white;
  border: none;
  padding: 10px 14px;
  border-radius: 10px;
}
</style>