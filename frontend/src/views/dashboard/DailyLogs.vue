<template>
  <div class="container">

    <!-- HEADER -->
    <div class="header">
      <h1>
        <Clipboard class="title-icon" />
        Daily Logs
      </h1>

      <input v-model="search" placeholder="Search logs..." />

      <button class="add-btn" @click="openAdd">
        <Plus /> Add Log
      </button>
    </div>

    <!-- TABLE -->
    <div class="table-wrapper">

      <table class="table">
        <thead>
          <tr>
            <th>Date</th>
            <th>Time</th>
            <th>Concern</th>
            <th>Dept</th>
            <th>Team</th>
            <th>Status</th>
            <th>Assigned</th>
            <th>Remarks</th>
            <th>Actions</th>
          </tr>
        </thead>

        <tbody>
          <tr v-for="log in filteredLogs" :key="log.id">

            <td>{{ log.date }}</td>
            <td>{{ log.time }}</td>
            <td>{{ log.concern }}</td>
            <td>{{ log.department }}</td>
            <td>{{ log.team }}</td>

            <td>
              <span class="badge" :class="log.status">
                {{ log.status }}
              </span>
            </td>

            <td>{{ log.assignedTo }}</td>
            <td>{{ log.remarks }}</td>

            <td class="actions">

              <!-- EDIT -->
              <button class="icon-btn edit" @click="openEdit(log)">
                <Pencil />
              </button>

              <!-- DELETE -->
              <button class="icon-btn delete" @click="deleteLog(log.id)">
                <Trash2 />
              </button>

            </td>

          </tr>
        </tbody>

      </table>
    </div>

    <!-- MODAL -->
    
<!-- MODAL -->
<div v-if="openModal" class="modal-backdrop">
  <div class="modal-card">

    <!-- HEADER -->
    <div class="modal-header">
      <h2>
        <FileText class="modal-icon" />
        {{ isEditMode ? 'Update Log' : 'Add Log' }}
      </h2>

      <button class="close-btn" @click="closeModal">
        <X />
      </button>
    </div>

    <!-- FORM GRID -->
    <div class="modal-body">

      <input v-model="form.concern" placeholder="Concern" />
      <input v-model="form.department" placeholder="Department" />
      <input v-model="form.assignedTo" placeholder="Assigned To" />

      <select v-model="form.team">
        <option>Technical</option>
        <option>Application</option>
        <option>Network</option>
        <option>Programming</option>
      </select>

      <select v-model="form.status">
        <option>Queue</option>
        <option>Pending</option>
        <option>Done</option>
        <option>Tomorrow</option>
      </select>

      <textarea v-model="form.remarks" placeholder="Remarks"></textarea>

    </div>

    <!-- FOOTER -->
    <div class="modal-footer">

      <button class="btn-save" @click="saveLog">
        <Check />
        {{ isEditMode ? 'Update' : 'Save' }}
      </button>

      <button class="btn-cancel" @click="closeModal">
        <X />
        Cancel
      </button>

    </div>

  </div>
</div>

  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import axios from 'axios'

/* ICONS (Lucide Vue) */
import { Plus, Pencil, Trash2, Check, X, Activity, Clipboard } from 'lucide-vue-next'

const logs = ref([])
const search = ref('')
const openModal = ref(false)
const isEditMode = ref(false)
const selectedId = ref(null)

const form = ref({
  concern: '',
  department: '',
  assignedTo: '',
  team: 'Technical',
  status: 'Queue',
  remarks: ''
})

/* LOAD */
const loadLogs = async () => {
  const res = await axios.get('http://localhost:3000/daily-logs')
  logs.value = res.data
}

/* FILTER */
const filteredLogs = computed(() => {
  return logs.value.filter(log =>
    log.concern?.toLowerCase().includes(search.value.toLowerCase()) ||
    log.department?.toLowerCase().includes(search.value.toLowerCase())
  )
})

/* ADD */
const openAdd = () => {
  isEditMode.value = false
  selectedId.value = null
  resetForm()
  openModal.value = true
}

/* EDIT */
const openEdit = (log) => {
  isEditMode.value = true
  selectedId.value = log.id
  form.value = { ...log }
  openModal.value = true
}

/* CLOSE */
const closeModal = () => {
  openModal.value = false
  resetForm()
}

/* RESET */
const resetForm = () => {
  form.value = {
    concern: '',
    department: '',
    assignedTo: '',
    team: 'Technical',
    status: 'Queue',
    remarks: ''
  }
}

/* SAVE */
const saveLog = async () => {
  const now = new Date()

  if (isEditMode.value) {
    await axios.patch(`http://localhost:3000/daily-logs/${selectedId.value}`, form.value)
  } else {
    await axios.post('http://localhost:3000/daily-logs', {
      ...form.value,
      date: now.toISOString().split('T')[0],
      time: now.toLocaleTimeString()
    })
  }

  closeModal()
  await loadLogs()
}

/* DELETE */
const deleteLog = async (id) => {
  await axios.delete(`http://localhost:3000/daily-logs/${id}`)
  await loadLogs()
}

onMounted(loadLogs)
</script>

<style>
/* ===== BASE ===== */
.container {
  background: #fff;
  margin: 10px;
  border-radius: 12px;
  min-height: calc(100vh - 20px);
  padding: 20px;
}

/* ===== HEADER ===== */
.header {
  display: flex;
  gap: 10px;
  justify-content: space-between;
  flex-wrap: wrap;
  align-items: center;
}

.header h1 {
  display: flex;
  align-items: center;
  gap: 8px;
}

.title-icon {
  width: 20px;
}

/* INPUT */
.header input {
  flex: 1;
  min-width: 200px;
  padding: 8px;
}

/* ADD BUTTON */
.add-btn {
  display: flex;
  align-items: center;
  gap: 6px;

  padding: 10px 15px;
  background: black;
  color: white;
  border: none;
  cursor: pointer;

  transition: 0.2s;
}

.add-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 15px rgba(0,0,0,0.3);
}

/* ===== TABLE ===== */
.table-wrapper {
  overflow-x: auto;
  margin-top: 15px;
}

.table {
  width: 100%;
  min-width: 850px;
  border-collapse: collapse;
}

.table th {
  position: sticky;
  top: 0;
  background: #333;
  color: white;
  z-index: 2;
}

.table th,
.table td {
  border: 1px solid #ddd;
  padding: 10px;
}

/* ===== ACTION ICON BUTTONS ===== */
.actions {
  display: flex;
  justify-content: center;
  gap: 12px;
  align-items: center;
}

/* ICON BUTTON BASE */
.icon-btn {
  width: 50px;
  height: 34px;

  display: flex;
  align-items: center;
  justify-content: center;

  border: 1px solid transparent;
  border-radius: 8px;

  background: #f5f5f5;
  cursor: pointer;

  transition: 0.2s ease;
  color: #333;
}

/* FORCE ICON VISIBILITY */
.icon-btn svg {
  width: 18px;
  height: 18px;
  stroke-width: 2.2;
}

/* HOVER EFFECT */
.icon-btn:hover {
  transform: scale(1.1);
  background: white;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
}

/* EDIT */
.edit {
  color: #1e90ff;
}

.edit:hover {
  background: rgba(30,144,255,0.1);
  box-shadow: 0 0 10px rgba(30,144,255,0.4);
}

/* DELETE */
.delete {
  color: #ff4d4d;
}

.delete:hover {
  background: rgba(255,77,77,0.1);
  box-shadow: 0 0 10px rgba(255,77,77,0.4);
}

/* ===== BADGES ===== */
.badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;

  padding: 5px 10px;
  border-radius: 2px;
  color: white;

  font-size: 15px;
  min-width: 100px;
  text-align: center;
}

/* CENTER THE TABLE CELL */
.table td {
  vertical-align: middle;
}

/* specifically center status column */
.table td:nth-child(6) {
  text-align: center;
}

.Queue { background: gray; }
.Pending { background: orange; }
.Done { background: green; }
.Tomorrow { background: blue; }

/* ===== MODAL ===== */
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.75);
  backdrop-filter: blur(4px);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 9999;
}

/* MODAL CARD */
.modal-card {
  width: 100%;
  max-width: 520px;
  background: #fff;
  border-radius: 14px;
  overflow: hidden;
  box-shadow: 0 20px 60px rgba(0,0,0,0.3);
  animation: pop 0.2s ease;
}

/* HEADER */
.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 18px;
  background: #111;
  color: white;
}

.modal-header h2 {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
}

.modal-icon {
  width: 18px;
}

/* CLOSE */
.close-btn {
  background: transparent;
  border: none;
  color: white;
  cursor: pointer;
}

/* BODY */
.modal-body {
  display: grid;
  gap: 10px;
  padding: 15px;
}

.modal-body input,
.modal-body select,
.modal-body textarea {
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 8px;
  outline: none;
  transition: 0.2s;
}

.modal-body input:focus,
.modal-body select:focus,
.modal-body textarea:focus {
  border-color: #1e90ff;
  box-shadow: 0 0 0 2px rgba(30,144,255,0.2);
}

/* FOOTER */
.modal-footer {
  display: flex;
  gap: 10px;
  padding: 15px;
}

/* BUTTONS */
.btn-save,
.btn-cancel {
  flex: 1;
  padding: 10px;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  border-radius: 8px;
  transition: 0.2s;
}

.btn-save {
  background: #1e90ff;
  color: white;
}

.btn-save:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 20px rgba(30,144,255,0.3);
}

.btn-cancel {
  background: #ff4d4d;
  color: white;
}

.btn-cancel:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 20px rgba(255,77,77,0.3);
}

/* ANIMATION */
@keyframes pop {
  from {
    transform: scale(0.95);
    opacity: 0;
  }
  to {
    transform: scale(1);
    opacity: 1;
  }
}
</style>