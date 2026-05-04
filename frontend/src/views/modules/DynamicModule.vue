<template>
  <div class="container">

    <!-- HEADER -->
    <div class="header">
      <h1>{{ module?.name || 'Module' }}</h1>

      <button class="add-btn" @click="openAdd">
        + Add Log
      </button>
    </div>

    <!-- TABLE -->
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
          <tr v-for="log in logs" :key="log.id">

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

    <!-- MODAL -->
    <div v-if="showModal" class="modal-backdrop">

      <div class="modal-card">

        <div class="modal-header">
          <h3>{{ isEdit ? 'Update Log' : 'Add Log' }}</h3>
        </div>

        <div class="modal-body">
          <div v-for="col in columns" :key="col.name">

            <label>{{ col.name }}</label>

            <!--  DROPDOWN -->
            <select
              v-if="col.type === 'select'"
              v-model="form[col.name]"
            >
              <option disabled value="">Select</option>

              <option
                v-for="opt in col.options"
                :key="opt"
                :value="opt"
              >
                {{ opt }}
              </option>
            </select>

    <!--  OTHER INPUTS -->
    <input
      v-else
      v-model="form[col.name]"
      :type="inputType(col.type)"
    />

  </div>
</div>

        <div class="modal-footer">
          <button class="btn-save" @click="saveLog">Save</button>
          <button class="btn-cancel" @click="closeModal">Cancel</button>
        </div>

      </div>

    </div>

    <!-- DELETE -->
    <div v-if="showDelete" class="modal-backdrop">

      <div class="modal-card">

        <h3>Delete log?</h3>

        <div class="modal-footer">
          <button class="btn-cancel" @click="showDelete = false">Cancel</button>
          <button class="btn-danger" @click="deleteLog">Delete</button>
        </div>

      </div>

    </div>

  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
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
  columns.value = safeParse(res.data.columns)
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
.container {
  padding: 20px;
  background: #f4f6f9;
  min-height: 100vh;
  font-family: Arial, sans-serif;
}

/* ================= HEADER ================= */
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.header h1 {
  font-size: 22px;
  color: #222;
}

.add-btn {
  background: #1e90ff;
  color: white;
  border: none;
  padding: 10px 14px;
  border-radius: 8px;
  cursor: pointer;
  transition: 0.2s;
}

.add-btn:hover {
  background: #187bcd;
}

/* ================= TABLE ================= */
.table-wrapper {
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0,0,0,0.05);
}

.table {
  width: 100%;
  border-collapse: collapse;
}

.table thead {
  background: #1e1e2f;
  color: white;
}

.table th,
.table td {
  padding: 12px;
  text-align: left;
  border-bottom: 1px solid #eee;
  font-size: 14px;
}

.table tbody tr:hover {
  background: #f8f9fb;
}

/* ACTIONS */
.actions {
  display: flex;
  gap: 8px;
}

.icon-btn {
  border: none;
  padding: 6px 10px;
  border-radius: 6px;
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
  background: rgba(0,0,0,0.6);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 999;
}

.modal-card {
  background: white;
  width: 450px;
  border-radius: 14px;
  padding: 20px;
  box-shadow: 0 10px 30px rgba(0,0,0,0.2);
}

/* MODAL HEADER */
.modal-header {
  margin-bottom: 15px;
}

.modal-header h3 {
  margin: 0;
  font-size: 18px;
}

/* MODAL BODY */
.modal-body {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.modal-body label {
  font-size: 13px;
  color: #555;
  margin-bottom: 4px;
  display: block;
}

/* INPUTS */
.modal-body input,
.modal-body select {
  width: 90%;
  padding: 10px;
  border-radius: 8px;
  border: 1px solid #ddd;
  outline: none;
  transition: 0.2s;
  justify-content: center;
}

.modal-body input:focus,
.modal-body select:focus {
  border-color: #1e90ff;
  box-shadow: 0 0 5px rgba(30,144,255,0.3);
}

/* MODAL FOOTER */
.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 20px;
}

/* BUTTONS */
.btn-save {
  background: #28a745;
  color: white;
  border: none;
  padding: 10px 14px;
  border-radius: 8px;
  cursor: pointer;
}

.btn-cancel {
  background: #aaa;
  color: white;
  border: none;
  padding: 10px 14px;
  border-radius: 8px;
  cursor: pointer;
}

.btn-danger {
  background: #ff4d4d;
  color: white;
  border: none;
  padding: 10px 14px;
  border-radius: 8px;
  cursor: pointer;
}

/* ================= EMPTY STATE ================= */
p {
  color: #777;
  text-align: center;
  margin-top: 20px;
}
</style>