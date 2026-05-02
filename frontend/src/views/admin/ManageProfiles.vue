<template>
  <div class="page">

    <h1 class="title">Manage Profiles</h1>

    <!-- ADD PROFILE -->
    <div class="card">
      <h3>Create Profile</h3>

      <div class="form">
        <input v-model="newName" placeholder="Profile Name" />

        <input
          v-model="newPin"
          placeholder="4-digit PIN"
          maxlength="4"
          @input="newPin = newPin.replace(/[^0-9]/g, '').slice(0,4)"
        />

        <button @click="addProfile">+ Add Profile</button>
      </div>
    </div>

    <!-- TABLE -->
    <div class="card">
      <h3>Profiles</h3>

      <div class="table-wrapper">

        <table v-if="profiles.length">
          <thead>
            <tr>
              <th>Name</th>
              <th>PIN</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            <tr v-for="p in profiles" :key="p.id">

              <td>{{ p.name }}</td>

              <td>
                <span v-if="visiblePin === p.id">{{ p.pin }}</span>
                <span v-else>••••</span>

                <button class="mini-btn" @click="togglePin(p.id)">
                  {{ visiblePin === p.id ? 'Hide' : 'Show' }}
                </button>
              </td>

              <td class="actions">

                <button class="btn-blue" @click="openEdit(p)">
                  Change PIN
                </button>

                <!-- 🚨 ADMIN PROTECTION -->
                <button
                  class="btn-red"
                  v-if="p.name.toLowerCase() !== 'admin'"
                 @click="openDelete(p)"
                >
                  Delete
                </button>

              </td>

            </tr>
          </tbody>

        </table>

        <p v-else class="empty">No profiles yet</p>

      </div>

    </div>

    <!-- MODAL -->
    <div v-if="showModal" class="modal-backdrop">
      <div class="modal">

        <h3>Change PIN</h3>
        <p>{{ selected?.name }}</p>

        <input
          v-model="editPin"
          placeholder="New PIN"
          maxlength="4"
          @input="editPin = editPin.replace(/[^0-9]/g, '').slice(0,4)"
        />

        <div class="modal-actions">
          <button class="btn-blue" @click="updatePin">Save</button>
          <button class="btn-red" @click="closeModal">Cancel</button>
        </div>

      </div>
    </div>

    <!-- DELETE CONFIRM MODAL -->
<div v-if="showDeleteModal" class="modal-backdrop">

  <div class="modal danger">

    <h3>Delete Profile</h3>

    <p>
      Are you sure you want to delete
      <strong>{{ deleteTarget?.name }}</strong>?
    </p>

    <small>This action cannot be undone.</small>

    <div class="modal-actions">

      <button class="btn-red" @click="confirmDelete">
        Yes, Delete
      </button>

      <button class="btn-blue" @click="closeDelete">
        Cancel
      </button>

    </div>

  </div>

</div>

  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import api from '@/api/axios'

const profiles = ref([])

const newName = ref('')
const newPin = ref('')

const showModal = ref(false)
const selected = ref(null)
const editPin = ref('')

const visiblePin = ref(null)

const activeUser = JSON.parse(localStorage.getItem('user'))

/* LOAD */
const loadProfiles = async () => {
  const res = await api.get(`/profiles/${activeUser.id}`)
  profiles.value = res.data
}

onMounted(loadProfiles)

/* ADD */
const addProfile = async () => {
  if (!newName.value || newPin.value.length !== 4) return

  await api.post('/profiles', {
    name: newName.value,
    pin: newPin.value,
    userId: activeUser.id
  })

  newName.value = ''
  newPin.value = ''

  loadProfiles()
}

/* DELETE (ADMIN PROTECTED) */
const deleteProfile = async (id) => {
  const profile = profiles.value.find(p => p.id === id)

  if (profile?.name.toLowerCase() === 'admin') return

  await api.delete(`/profiles/${id}`)
  loadProfiles()
}

/* PIN VISIBILITY */
const togglePin = (id) => {
  visiblePin.value = visiblePin.value === id ? null : id
}

/* EDIT PIN */
const openEdit = (p) => {
  selected.value = p
  editPin.value = ''
  showModal.value = true
}

const closeModal = () => showModal.value = false

const updatePin = async () => {
  if (editPin.value.length !== 4) return

  await api.put(`/profiles/${selected.value.id}/pin`, {
    pin: editPin.value
  })

  closeModal()
  loadProfiles()
}

const showDeleteModal = ref(false)
const deleteTarget = ref(null)

const openDelete = (profile) => {
  deleteTarget.value = profile
  showDeleteModal.value = true
}

const closeDelete = () => {
  deleteTarget.value = null
  showDeleteModal.value = false
}

const confirmDelete = async () => {
  if (!deleteTarget.value) return

  // 🚨 extra safety: block admin deletion
  if (deleteTarget.value.name.toLowerCase() === 'admin') {
    closeDelete()
    return
  }

  try {
    await api.delete(`/profiles/${deleteTarget.value.id}`)
    loadProfiles()
  } catch (err) {
    console.error('Delete error:', err)
  }

  closeDelete()
}
</script>

<style>
.page {
  padding: 28px;
  background: #f4f6f9;
  min-height: 100%;
  font-family: Arial, sans-serif;
}

/* TITLE */
.title {
  margin-bottom: 20px;
  font-size: 22px;
  font-weight: 700;
  color: #111;
}

/* CARD */
.card {
  background: #ffffff;
  padding: 22px;
  border-radius: 14px;
  margin-bottom: 20px;
  box-shadow: 0 8px 20px rgba(0,0,0,0.06);
  border: 1px solid #eee;
  transition: 0.2s ease;
}

.card:hover {
  transform: translateY(-2px);
}

/* FORM */
.form {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  margin-top: 10px;
}

input {
  padding: 11px 12px;
  border: 1px solid #ddd;
  border-radius: 10px;
  outline: none;
  transition: 0.2s;
  min-width: 180px;
  font-size: 14px;
}

input:focus {
  border-color: #1e90ff;
  box-shadow: 0 0 0 3px rgba(30,144,255,0.15);
}

/* BUTTONS */
button {
  padding: 10px 14px;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  font-weight: 600;
  transition: 0.2s;
  font-size: 13px;
}

button:hover {
  transform: translateY(-1px);
}

.btn-blue {
  background: linear-gradient(135deg, #1e90ff, #0077ff);
  color: white;
}

.btn-blue:hover {
  box-shadow: 0 6px 15px rgba(30,144,255,0.3);
}

.btn-red {
  background: linear-gradient(135deg, #ff4d4d, #e60000);
  color: white;
}

.btn-red:hover {
  box-shadow: 0 6px 15px rgba(255,77,77,0.3);
}

/* TABLE WRAPPER */
.table-wrapper {
  width: 100%;
  overflow-x: auto;
  margin-top: 10px;
  border-radius: 12px;
}

/* TABLE */
table {
  width: 100%;
  border-collapse: collapse;
  min-width: 600px;
  background: white;
}

/* HEADER */
th {
  background: #111827;
  color: white;
  padding: 14px;
  text-align: left;
  font-size: 13px;
  letter-spacing: 0.5px;
}

/* CELLS */
td {
  padding: 14px;
  border-bottom: 1px solid #eee;
  font-size: 14px;
  color: #333;
}

/* ROW HOVER */
tr:hover {
  background: #f8fafc;
  transition: 0.2s;
}

/* ACTIONS */
.actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  align-items: center;
}

/* MINI BUTTON (SHOW PIN) */
.mini-btn {
  margin-left: 8px;
  font-size: 11px;
  padding: 5px 8px;
  border-radius: 6px;
  background: #e5e7eb;
  color: #333;
}

.mini-btn:hover {
  background: #d1d5db;
}

/* EMPTY STATE */
.empty {
  color: #888;
  padding: 10px;
}

/* MODAL BACKDROP */
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.6);
  display: flex;
  justify-content: center;
  align-items: center;
  backdrop-filter: blur(4px);
}

/* MODAL */
.modal {
  background: white;
  padding: 24px;
  border-radius: 14px;
  width: 320px;
  box-shadow: 0 20px 40px rgba(0,0,0,0.2);
}

/* MODAL ACTIONS */
.modal-actions {
  display: flex;
  gap: 10px;
  margin-top: 15px;
  
}

/* RESPONSIVE */
@media (max-width: 768px) {
  .page {
    padding: 16px;
  }

  .form {
    flex-direction: column;
  }

  input {
    width: 100%;
  }

  table {
    min-width: 100%;
  }

  th, td {
    padding: 10px;
    font-size: 13px;
  }

  .actions {
    flex-direction: column;
    align-items: flex-start;
  }
}

.modal.danger {
  border-top: 5px solid #ff4d4d;
}

.modal small {
  display: block;
  margin-top: 5px;
  color: #888;
}
</style>