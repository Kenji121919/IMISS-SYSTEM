<template>
  <div class="page">

    <!-- ================= HEADER ================= -->
    <div class="header">
      <h1>Manage Modules</h1>
      <p>Create dynamic modules with columns and access control</p>
    </div>

    <!-- ================= CREATE MODULE ================= -->
    <div class="card">
      <h3>Create Module</h3>

      <div class="form">

        <!-- MODULE NAME -->
        <input v-model="moduleName" placeholder="Module Name" />

        <!-- ================= COLUMNS ================= -->
        <div class="columns">
          <h4>Columns</h4>

          <div
            v-for="(col, i) in columns"
            :key="i"
            class="column-row"
          >
            <input v-model="col.name" placeholder="Column name" />

            <select v-model="col.type">
              <option value="varchar">Text</option>
              <option value="int">Number</option>
              <option value="date">Date</option>
              <option value="time">Time</option>
              <option value="select">Dropdown</option>
            </select>

            <input
              v-if="col.type === 'select'"
              v-model="col.optionsInput"
              placeholder="Pending,Queue,Done"
            />

              <label class="filter-check">
                <input type="checkbox" v-model="col.filterable" />
                Filter
              </label>

            <button class="btn-red" @click="removeColumn(i)">x</button>
          </div>

          <button class="btn-blue small" @click="addColumn">
            + Add Column
          </button>
        </div>

        <!-- ================= PROFILES ================= -->
        <div class="profiles">
          <h4>Allowed Profiles</h4>

          <label v-for="p in profiles" :key="p.id" class="checkbox">
            <input type="checkbox" :value="p.id" v-model="selectedProfiles" />
            {{ p.name }}
          </label>
        </div>

        <!-- CREATE BUTTON -->
        <button class="btn-green full" @click="createModule">
          Create Module
        </button>

      </div>
    </div>

    <!-- ================= MODULE LIST ================= -->
    <div class="card">
      <h3>Modules</h3>

      <div v-if="modules.length">
        <div v-for="m in modules" :key="m.id" class="module-card">

          <div>
            <h4>{{ m.name }}</h4>
            <small>
              Columns: {{ m.columns?.length || 0 }} |
              Profiles: {{ m.allowedProfiles?.length || 0 }}
            </small>
          </div>

          <div class="actions">
            <button class="btn-blue" @click="openEdit(m)">Edit</button>
            <button class="btn-red" @click="deleteModule(m.id)">Delete</button>
          </div>

        </div>
      </div>

      <p v-else class="empty">No modules yet</p>
    </div>

    <!-- ================= EDIT MODAL ================= -->
    <div v-if="showModal" class="modal-backdrop">
      <div class="modal">

        <h3>Edit Module</h3>
        <input v-model="editModule.name" />

        <button class="btn-green" @click="updateModule">Save</button>
        <button class="btn-red" @click="closeModal">Cancel</button>

      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import api from '@/api/axios'

/* ================= STATE ================= */
const moduleName = ref('')

const columns = ref([
  {
    name: '',
    type: 'varchar',
    optionsInput: '',
    options: [],
    filterable: false
  }
])

const modules = ref([])
const profiles = ref([])
const selectedProfiles = ref([])

/* ================= EDIT MODAL ================= */
const showModal = ref(false)
const editModule = ref({})

const user = JSON.parse(localStorage.getItem('user'))

/* ================= INIT ================= */
onMounted(async () => {
  await loadModules()
  await loadProfiles()
})

/* ================= LOAD DATA ================= */
const loadModules = async () => {
  try {
    const res = await api.get(`/modules/${user.id}`)

    modules.value = res.data.map(m => ({
      ...m,
      columns: typeof m.columns === 'string'
        ? JSON.parse(m.columns)
        : m.columns
    }))
  } catch (err) {
    console.error(err)
  }
}

const loadProfiles = async () => {
  try {
    const res = await api.get(`/profiles/${user.id}`)
    profiles.value = res.data
  } catch (err) {
    console.error(err)
  }
}

/* ================= COLUMNS ================= */
const addColumn = () => {
  columns.value.push({
    name: '',
    type: 'varchar',
    optionsInput: '',
    options: [],
    filterable: false
  })
}

const removeColumn = (i) => {
  columns.value.splice(i, 1)
}

/* ================= CREATE MODULE ================= */
const createModule = async () => {
  try {
    if (!moduleName.value.trim()) return alert('Module name required')

    const formattedColumns = columns.value.map(col => ({
      name: col.name,
      type: col.type,
      filterable: col.filterable || false,
      options:
        col.type === 'select'
          ? col.optionsInput.split(',').map(o => o.trim()).filter(Boolean)
          : []
    }))

    await api.post('/modules', {
      name: moduleName.value,
      columns: formattedColumns,
      allowedProfiles: selectedProfiles.value,
      userId: user.id
    })

    resetForm()
    await loadModules()

  } catch (err) {
    console.error('CREATE MODULE ERROR:', err)
  }
}

/* ================= RESET ================= */
const resetForm = () => {
  moduleName.value = ''
  columns.value = [{ name: '', type: 'varchar', optionsInput: '', options: [] }]
  selectedProfiles.value = []
}

/* ================= DELETE ================= */
const deleteModule = async (id) => {
  try {
    if (!confirm('Delete this module?')) return
    await api.delete(`/modules/${id}`)
    await loadModules()
  } catch (err) {
    console.error(err)
  }
}

/* ================= EDIT ================= */
const openEdit = (m) => {
  editModule.value = {
    ...m,
    columns: m.columns.map(col => ({
      ...col,
      filterable: col.filterable || false
    }))
  }

  showModal.value = true
}

const closeModal = () => {
  showModal.value = false
}

const updateModule = async () => {
  try {
    await api.put(`/modules/${editModule.value.id}`, editModule.value)
    showModal.value = false
    await loadModules()
  } catch (err) {
    console.error(err)
  }
}
</script>

<style scoped>
/* ================= BASE LAYOUT ================= */
.page {
  padding: 25px;
  background: #f5f5f5;
  min-height: 100vh;
}

/* ================= HEADER ================= */
.header {
  margin-bottom: 20px;
}

/* ================= CARD LAYOUT ================= */
.card {
  background: white;
  padding: 20px;
  border-radius: 12px;
  margin-bottom: 20px;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.05);
}

/* ================= FORM ELEMENTS ================= */
.form input,
.form select {
  padding: 10px;
  margin: 5px;
  border: 1px solid #ddd;
  border-radius: 8px;
  outline: none;
}

.form input:focus,
.form select:focus {
  border-color: #1e90ff;
}

/* ================= COLUMNS ================= */
.column-row {
  display: flex;
  gap: 10px;
  margin-bottom: 8px;
  align-items: center;
}

.columns {
  margin-top: 10px;
}

/* ================= PROFILES ================= */
.profiles {
  margin-top: 15px;
}

.checkbox {
  display: block;
  margin: 5px 0;
  cursor: pointer;
}

/* ================= MODULE LIST ================= */
.module-card {
  display: flex;
  justify-content: space-between;
  padding: 12px;
  border-bottom: 1px solid #eee;
  align-items: center;
}

.module-card h4 {
  margin: 0;
}

/* ================= BUTTONS ================= */
button {
  border: none;
  padding: 8px 12px;
  border-radius: 8px;
  cursor: pointer;
  transition: 0.2s ease;
}

button:hover {
  opacity: 0.9;
}

.btn-blue {
  background: #1e90ff;
  color: white;
}

.btn-red {
  background: #ff4d4d;
  color: white;
}

.btn-green {
  background: #28a745;
  color: white;
}

.small {
  padding: 5px 10px;
  font-size: 12px;
}

.full {
  width: 100%;
  margin-top: 10px;
}

/* ================= MODAL ================= */
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  justify-content: center;
  align-items: center;
}

.modal {
  background: white;
  padding: 20px;
  border-radius: 12px;
  width: 320px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
}

/* ================= EMPTY STATE ================= */
.empty {
  color: #888;
  text-align: center;
  padding: 10px;
}
</style>