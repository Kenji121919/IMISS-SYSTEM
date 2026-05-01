import { ref, computed, onMounted } from 'vue'
import api from '@/api/axios'
import { useRoute } from 'vue-router'

export function useDailyLogs() {
  const route = useRoute()

  /* =========================
     STATE
  ========================= */
  const logs = ref([])
  const currentProfile = ref(null)

  const openModal = ref(false)
  const isEditMode = ref(false)
  const selectedId = ref(null)

  /* =========================
     FORM
  ========================= */
  const form = ref({
    concern: '',
    department: '',
    receivedBy: '',
    assignedTo: '',
    team: 'Technical',
    status: 'Queue',
    remarks: '',
    ticketNumber: ''
  })

  const formErrors = ref({
    concern: '',
    department: '',
    receivedBy: ''
  })

  /* =========================
     FILTERS
  ========================= */
  const filters = ref({
    search: '',
    assignedTo: '',
    department: '',
    receivedBy: '',
    team: '',
    status: '',
    date: ''
  })

  /* =========================
     ASSIGNED DROPDOWN
  ========================= */
  const searchPerson = ref('')
  const showDropdown = ref(false)

  const assignedToOptions = ref([
    'Juan Dela Cruz',
    'Maria Santos',
    'Tech Support 1',
    'Tech Support 2'
  ])

  const filteredPeople = computed(() => {
    if (!searchPerson.value) return assignedToOptions.value

    return assignedToOptions.value.filter(p =>
      p.toLowerCase().includes(searchPerson.value.toLowerCase())
    )
  })

  const selectPerson = (person) => {
    form.value.assignedTo = person
    searchPerson.value = person
    showDropdown.value = false
  }

  const clearAssigned = () => {
    form.value.assignedTo = ''
    searchPerson.value = ''
  }

  /* =========================
     PROFILE
  ========================= */
  const loadProfile = () => {
    const saved = localStorage.getItem('activeProfile')

    try {
      currentProfile.value = saved ? JSON.parse(saved) : null
    } catch {
      currentProfile.value = null
    }
  }

  /* =========================
     LOAD LOGS
  ========================= */
  const loadLogs = async () => {
    try {
      const profileTeam = currentProfile.value?.team

      const team =
        profileTeam && !['All', 'Admin'].includes(profileTeam)
          ? profileTeam
          : undefined

      const res = await api.get('/daily-logs', {
        params: { team }
      })

      logs.value = res.data || []
    } catch (err) {
      console.error('Load logs error:', err)
      logs.value = []
    }
  }

  /* =========================
     FILTERED LOGS
  ========================= */
  const filteredLogs = computed(() => {
    const list = logs.value || []

    return list.filter(log => {
      const searchMatch =
        !filters.value.search ||
        (log.concern || '').toLowerCase().includes(filters.value.search.toLowerCase()) ||
        (log.department || '').toLowerCase().includes(filters.value.search.toLowerCase()) ||
        (log.assignedTo || '').toLowerCase().includes(filters.value.search.toLowerCase())

      const assignedMatch =
        !filters.value.assignedTo ||
        log.assignedTo === filters.value.assignedTo

      const departmentMatch =
        !filters.value.department ||
        log.department === filters.value.department

      const receivedMatch =
        !filters.value.receivedBy ||
        log.receivedBy === filters.value.receivedBy

      const statusMatch =
        !filters.value.status ||
        log.status === filters.value.status

      const dateMatch =
        !filters.value.date ||
        (log.date && log.date.startsWith(filters.value.date))

      return searchMatch && assignedMatch && departmentMatch && receivedMatch && statusMatch && dateMatch
    })
  })

  /* =========================
     MODAL FUNCTIONS
  ========================= */
  const openAdd = () => {
    isEditMode.value = false
    selectedId.value = null
    resetForm()
    openModal.value = true
  }

  const openEdit = (log) => {
    isEditMode.value = true
    selectedId.value = log.id

    form.value = {
      concern: log.concern || '',
      department: log.department || '',
      receivedBy: log.receivedBy || '',
      assignedTo: log.assignedTo || '',
      team: log.team || 'Technical',
      status: log.status || 'Queue',
      remarks: log.remarks || '',
      ticketNumber: log.ticketNumber || ''
    }

    searchPerson.value = log.assignedTo || ''
    openModal.value = true
  }

  const closeModal = () => {
    openModal.value = false
    resetForm()
  }

  const resetForm = () => {
    form.value = {
      concern: '',
      department: '',
      receivedBy: '',
      assignedTo: '',
      team: 'Technical',
      status: 'Queue',
      remarks: '',
      ticketNumber: ''
    }

    searchPerson.value = ''

    formErrors.value = {
      concern: '',
      department: '',
      receivedBy: ''
    }
  }

  /* =========================
     SAVE
  ========================= */
  const saveLog = async () => {
    try {
      formErrors.value = {
        concern: '',
        department: '',
        receivedBy: ''
      }

      let hasError = false

      if (!form.value.concern) {
        formErrors.value.concern = 'Concern is required'
        hasError = true
      }

      if (!form.value.department) {
        formErrors.value.department = 'Department is required'
        hasError = true
      }

      if (!form.value.receivedBy) {
        formErrors.value.receivedBy = 'Received by is required'
        hasError = true
      }

      if (hasError) return

      const now = new Date()

      const payload = {
        ...form.value,
        ticketNumber: form.value.ticketNumber
          ? Number(form.value.ticketNumber)
          : null,

        // ✅ FIXED (USER INPUT)
        receivedBy: form.value.receivedBy,

        date: now.toISOString().split('T')[0],
        time: now.toLocaleTimeString()
      }

      if (isEditMode.value) {
        await api.patch(`/daily-logs/${selectedId.value}`, payload)
      } else {
        await api.post('/daily-logs', payload)
      }

      closeModal()
      await loadLogs()

    } catch (err) {
      console.error('Save error:', err)
    }
  }

  /* =========================
     DELETE
  ========================= */
  const showDeleteModal = ref(false)
  const deleteId = ref(null)

  const confirmDelete = (id) => {
    deleteId.value = id
    showDeleteModal.value = true
  }

  const deleteLog = async () => {
    try {
      await api.delete(`/daily-logs/${deleteId.value}`)
      showDeleteModal.value = false
      deleteId.value = null
      await loadLogs()
    } catch (err) {
      console.error('Delete error:', err)
    }
  }

  const cancelDelete = () => {
    showDeleteModal.value = false
    deleteId.value = null
  }

  /* =========================
     INIT
  ========================= */
  onMounted(async () => {
    loadProfile()
    await loadLogs()
  })

  /* =========================
     EXPORT EVERYTHING
  ========================= */
  return {
    logs,
    filteredLogs,
    filters,

    form,
    formErrors,

    openModal,
    isEditMode,
    selectedId,

    searchPerson,
    showDropdown,
    filteredPeople,

    openAdd,
    openEdit,
    closeModal,
    saveLog,

    selectPerson,
    clearAssigned,

    showDeleteModal,
    confirmDelete,
    deleteLog,
    cancelDelete
  }
}