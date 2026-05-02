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

            <input
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
import { ref, onMounted } from 'vue'
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
  await loadModule()
  await loadLogs()
})
</script>