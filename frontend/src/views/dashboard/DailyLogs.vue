<script setup>
import { useDailyLogs } from './script/useDailyLogs'
import './css/useDailyLogs.css'

import {
  Plus,
  Pencil,
  Trash2,
  Clipboard,
  FileText,
  X,
  Check
} from 'lucide-vue-next'

const {
  logs,
  filteredLogs,
  filters,
  form,
  formErrors,
  openModal,
  isEditMode,
  saveLog,
  openAdd,
  openEdit,
  closeModal,
  searchPerson,
  showDropdown,
  filteredPeople,
  selectPerson,
  clearAssigned,
  showDeleteModal,
  confirmDelete,
  deleteLog,
  cancelDelete
} = useDailyLogs()
</script>


<template>
  <div class="container">

    <!-- HEADER -->
    <div class="header">
      <h1>
        <Clipboard class="title-icon" />
        Daily Logs
      </h1>

      <!-- SEARCH (FIXED BINDING) -->
      <input v-model="filters.search" placeholder="Search logs..." />

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
            <th>Ticket no.</th>
            <th>Received by</th>
            <th>Status</th>
            <th>Assigned</th>
            <th>Team</th>
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
            <td>{{ log.ticketNumber }}</td>
            <td>{{ log.receivedBy }}</td>
            <td>
              <span class="badge" :class="log.status">
                {{ log.status }}
              </span>
            </td>
            
            <td>{{ log.assignedTo }}</td>
            <td>{{ log.team }}</td>
            <td>{{ log.remarks }}</td>

            <td class="actions">

              <!-- EDIT (FIXED) -->
              <button class="icon-btn edit" @click="openEdit(log)">
                <Pencil />
              </button>

              <!-- DELETE (USES CONFIRM MODAL) -->
              <button class="icon-btn delete" @click="confirmDelete(log.id)">
                <Trash2 />
              </button>

            </td>

          </tr>
        </tbody>

      </table>
    </div>

    <!-- =========================
         ADD / EDIT MODAL
    ========================== -->
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

        <!-- BODY -->
        <div class="modal-body">

          <div class="input-wrapper">
            <input
              v-model="form.concern"
              placeholder="Concern"
              :class="{ error: formErrors.concern }"
            />

            <span v-if="formErrors.concern" class="input-error-text">
              {{ formErrors.concern }}
            </span>
          </div>

          <div class="input-wrapper">
            <input
              v-model="form.department"
              placeholder="Department"
              :class="{ error: formErrors.department }"
            />
            <span v-if="formErrors.department" class="input-error-text">
              {{ formErrors.department }}
            </span>
          </div>

          <div class="input-wrapper">
              <input
                v-model="form.receivedBy"
                placeholder="Received by"
                :class="{ error: formErrors.receivedBy }"
              />

              <span v-if="formErrors.receivedBy" class="input-error-text">
                {{ formErrors.receivedBy }}
              </span>
          </div>
          <!-- TICKET NUMBER -->
          <input
            v-model="form.ticketNumber"
            maxlength="6"
            inputmode="numeric"
            @input="form.ticketNumber = form.ticketNumber.replace(/[^0-9]/g, '').slice(0, 6)"
            placeholder="Ticket Number"
          />

          <!-- ASSIGNED TO -->
          <div class="assigned-wrapper">

            <div class="input-container">
              <input
                v-model="searchPerson"
                @focus="showDropdown = true"
                placeholder="Assign to..."
                
              />

              <button
                v-if="searchPerson"
                class="clear-btn"
                @click="clearAssigned"
              >
                ✕
              </button>
            </div>

            <ul v-if="showDropdown && filteredPeople.length" class="dropdown">
              <li
                v-for="person in filteredPeople"
                :key="person"
                @click="selectPerson(person)"
              >
                {{ person }}
              </li>
            </ul>

          </div>

          <!-- TEAM -->
          <select v-model="form.team">
            <option>Technical</option>
            <option>Application</option>
            <option>Network</option>
            <option>Programming</option>
          </select>

          <!-- STATUS -->
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

    <!-- =========================
         DELETE CONFIRM MODAL
    ========================== -->
    <div v-if="showDeleteModal" class="modal-overlay">
      <div class="modal-box">

        <h3>Are you sure you want to delete this log?</h3>
        <p>This action cannot be undone.</p>

        <div class="modal-actions">

          <button @click="cancelDelete" class="btn-cancel">
            <X />
            Cancel
          </button>

          <button @click="deleteLog" class="btn-delete">
            Yes, Delete
          </button>

        </div>

      </div>
    </div>

  </div>
</template>


