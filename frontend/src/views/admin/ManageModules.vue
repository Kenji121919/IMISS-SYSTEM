<template>
  <div class="page">

    <!-- HEADER -->
    <div class="header">
      <h1>Manage Modules</h1>
      <p>Create dynamic modules with columns and access control</p>
    </div>

    <!-- CREATE MODULE CARD -->
    <div class="card">

      <h3>Create Module</h3>

      <div class="form">

        <input v-model="moduleName" placeholder="Module Name" />

        <!-- COLUMNS -->
        <div class="columns">
          <h4>Columns</h4>

          <div
            v-for="(col, i) in columns"
            :key="i"
            class="column-row"
          >

            <!-- COLUMN NAME -->
            <input
              v-model="col.name"
              placeholder="Column name"
            />

            <!-- TYPE -->
            <select v-model="col.type">
              <option value="varchar">Text</option>
              <option value="int">Number</option>
              <option value="date">Date</option>
              <option value="time">Time</option>
              <option value="select">Dropdown</option>
            </select>

            <!-- DROPDOWN OPTIONS -->
            <input
              v-if="col.type === 'select'"
              v-model="col.optionsInput"
              placeholder="Pending,Queue,Done"
            />

            <!-- REMOVE -->
            <button class="btn-red" @click="removeColumn(i)">
              x
            </button>

          </div>

          <button class="btn-blue small" @click="addColumn">
            + Add Column
          </button>
        </div>

        <!-- PROFILES ACCESS -->
        <div class="profiles">
          <h4>Allowed Profiles</h4>

          <label
            v-for="p in profiles"
            :key="p.id"
            class="checkbox"
          >
            <input
              type="checkbox"
              :value="p.id"
              v-model="selectedProfiles"
            />
            {{ p.name }}
          </label>
        </div>

        <!-- CREATE BUTTON -->
        <button class="btn-green full" @click="createModule">
          Create Module
        </button>

      </div>
    </div>

    <!-- MODULE LIST -->
    <div class="card">

      <h3>Modules</h3>

      <div v-if="modules.length">

        <div
          v-for="m in modules"
          :key="m.id"
          class="module-card"
        >

          <div>
            <h4>{{ m.name }}</h4>

            <small>
              Columns: {{ m.columns?.length || 0 }} |
              Profiles: {{ m.allowedProfiles?.length || 0 }}
            </small>
          </div>

          <div class="actions">
            <button class="btn-blue" @click="openEdit(m)">
              Edit
            </button>

            <button class="btn-red" @click="deleteModule(m.id)">
              Delete
            </button>
          </div>

        </div>

      </div>

      <p v-else class="empty">No modules yet</p>

    </div>

    <!-- EDIT MODAL -->
    <div v-if="showModal" class="modal-backdrop">

      <div class="modal">

        <h3>Edit Module</h3>

        <input v-model="editModule.name" />

        <button class="btn-green" @click="updateModule">
          Save
        </button>

        <button class="btn-red" @click="closeModal">
          Cancel
        </button>

      </div>

    </div>

  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import api from '@/api/axios'

/* =========================
   STATE
========================= */
const moduleName = ref('')
const columns = ref([{ name: '', type: 'varchar' }])
const modules = ref([])
const profiles = ref([])
const selectedProfiles = ref([])

/* EDIT */
const showModal = ref(false)
const editModule = ref({})

const user = JSON.parse(localStorage.getItem('user'))

/* =========================
   LOAD DATA
========================= */
onMounted(async () => {
  loadModules()
  loadProfiles()
})

const loadModules = async () => {
  const res = await api.get(`/modules/${user.id}`)
  modules.value = res.data
}

const loadProfiles = async () => {
  const res = await api.get(`/profiles/${user.id}`)
  profiles.value = res.data
}

/* =========================
   COLUMN HANDLERS
========================= */
const addColumn = () => {
  columns.value.push({ name: '', type: 'varchar' })
}

const removeColumn = (i) => {
  columns.value.splice(i, 1)
}

/* =========================
   CREATE MODULE
========================= */
const createModule = async () => {
  if (!moduleName.value) return

  await api.post('/modules', {
    name: moduleName.value,
    columns: columns.value,
    allowedProfiles: selectedProfiles.value,
    userId: user.id
  })

  moduleName.value = ''
  columns.value = [{ name: '', type: 'varchar' }]
  selectedProfiles.value = []

  loadModules()
}

/* =========================
   DELETE MODULE
========================= */
const deleteModule = async (id) => {
  if (!confirm('Delete this module?')) return

  await api.delete(`/modules/${id}`)
  loadModules()
}

/* =========================
   EDIT MODULE
========================= */
const openEdit = (m) => {
  editModule.value = { ...m }
  showModal.value = true
}

const closeModal = () => {
  showModal.value = false
}

const updateModule = async () => {
  await api.put(`/modules/${editModule.value.id}`, editModule.value)
  showModal.value = false
  loadModules()
}



</script>

<style scoped>
.page {
  padding: 25px;
  background: #f5f5f5;
  min-height: 100vh;
}

/* HEADER */
.header {
  margin-bottom: 20px;
}

/* CARD */
.card {
  background: white;
  padding: 20px;
  border-radius: 12px;
  margin-bottom: 20px;
  box-shadow: 0 4px 10px rgba(0,0,0,0.05);
}

/* FORM */
.form input,
.form select {
  padding: 10px;
  margin: 5px;
  border: 1px solid #ddd;
  border-radius: 8px;
}

/* COLUMN ROW */
.column-row {
  display: flex;
  gap: 10px;
  margin-bottom: 8px;
}

/* PROFILES */
.checkbox {
  display: block;
  margin: 5px 0;
}

/* MODULE CARD */
.module-card {
  display: flex;
  justify-content: space-between;
  padding: 12px;
  border-bottom: 1px solid #eee;
}

/* BUTTONS */
button {
  border: none;
  padding: 8px 12px;
  border-radius: 8px;
  cursor: pointer;
}

.btn-blue { background: #1e90ff; color: white; }
.btn-red { background: #ff4d4d; color: white; }
.btn-green { background: #28a745; color: white; }

.small { padding: 5px 10px; font-size: 12px; }
.full { width: 100%; margin-top: 10px; }

/* MODAL */
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.6);
  display: flex;
  justify-content: center;
  align-items: center;
}

.modal {
  background: white;
  padding: 20px;
  border-radius: 12px;
  width: 300px;
}

/* EMPTY */
.empty {
  color: #888;
}
</style>