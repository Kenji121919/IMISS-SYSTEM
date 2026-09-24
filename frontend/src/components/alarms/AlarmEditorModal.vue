<template>
  <div
    v-if="visible"
    class="alarm-editor-backdrop"
    @click.self="close"
  >
    <div class="alarm-editor-modal">
      <div class="alarm-editor-header">
        <div>
          <h3>{{ isBatch ? `Set alarm for ${logs.length} logs` : 'Set log alarm' }}</h3>
          <p v-if="!isBatch">{{ logLabel }}</p>
          <p v-else>One alarm schedule will be copied to every selected log.</p>
        </div>
        <button type="button" class="alarm-close" @click="close">✕</button>
      </div>

      <div class="alarm-editor-body">
        <div v-if="isBatch" class="alarm-selected-preview">
          <strong>{{ logs.length }} selected</strong>
          <span>{{ selectedPreview }}</span>
        </div>

        <div class="alarm-editor-grid two">
          <div class="alarm-editor-field">
            <label>Due date</label>
            <input v-model="dueDate" type="date" />
          </div>

          <div class="alarm-editor-field">
            <label>Due time</label>
            <input v-model="dueTime" type="time" />
          </div>
        </div>

        <div class="alarm-editor-field">
          <label>Remind before</label>
          <div class="alarm-lead-row">
            <input
              v-model.number="leadValue"
              type="number"
              min="0"
              max="999"
            />
            <select v-model="leadUnit">
              <option value="minutes">Minutes</option>
              <option value="hours">Hours</option>
              <option value="days">Days</option>
            </select>
          </div>
          <small>
            Alarm will trigger {{ triggerPreview }}.
          </small>
        </div>

        <div class="alarm-editor-field">
          <label>Alarm message</label>
          <textarea
            v-model="message"
            rows="3"
            placeholder="Enter the message shown when the alarm triggers"
          ></textarea>
        </div>

        <div class="alarm-editor-grid two">
          <div class="alarm-editor-field">
            <label>Repeat</label>
            <select v-model="repeatChoice">
              <option value="default">Use module default</option>
              <option value="5">5 times</option>
              <option value="10">10 times</option>
              <option value="untilDismissed">Until dismissed</option>
            </select>
          </div>

          <div class="alarm-editor-field">
            <label>Alarm media</label>
            <div class="alarm-media-summary">
              <span v-if="config?.mediaFile">▶</span>
              <span v-else>🔔</span>
              <div>
                <strong>
                  {{ config?.mediaFileName || 'No custom media' }}
                </strong>
                <small>
                  {{ config?.mediaFile ? 'Uses module alarm clip' : 'Popup/notification only' }}
                </small>
              </div>
            </div>
          </div>
        </div>

        <div v-if="errorMessage" class="alarm-editor-error">
          {{ errorMessage }}
        </div>

        <div v-if="existingAlarm && !isBatch" class="alarm-existing-note">
          Existing alarm: <strong>{{ existingStatus }}</strong>
        </div>
      </div>

      <div class="alarm-editor-footer">
        <button
          v-if="existingAlarm && !isBatch"
          type="button"
          class="alarm-remove"
          :disabled="saving"
          @click="removeExisting"
        >
          Remove alarm
        </button>

        <div class="alarm-editor-footer-right">
          <button type="button" class="alarm-btn ghost" @click="close">
            Cancel
          </button>
          <button
            type="button"
            class="alarm-btn primary"
            :disabled="saving"
            @click="save"
          >
            {{ saving ? 'Saving…' : (isBatch ? `Set for ${logs.length} logs` : 'Set alarm') }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import {
  computed,
  ref,
  watch,
} from 'vue'
import api from '@/api/axios'

const props = defineProps({
  visible: Boolean,
  moduleId: {
    type: [Number, String],
    required: true,
  },
  logs: {
    type: Array,
    default: () => [],
  },
  config: {
    type: Object,
    default: () => ({}),
  },
})

const emit = defineEmits([
  'close',
  'saved',
  'toast',
])

const dueDate = ref('')
const dueTime = ref('09:00')
const leadValue = ref(1)
const leadUnit = ref('hours')
const message = ref('')
const repeatChoice = ref('default')
const saving = ref(false)
const errorMessage = ref('')
const existingAlarm = ref(null)

const isBatch = computed(() => props.logs.length > 1)

const firstLog = computed(() => props.logs[0] || null)

const firstUsefulValue = log => {
  const data = log?.data || {}
  const values = Object.values(data)
    .map(value => String(value ?? '').trim())
    .filter(Boolean)
  return values[0] || `Log #${log?.id || ''}`
}

const logLabel = computed(() =>
  firstUsefulValue(firstLog.value),
)

const selectedPreview = computed(() =>
  props.logs
    .slice(0, 4)
    .map(firstUsefulValue)
    .join(' · ') +
  (props.logs.length > 4 ? ' · …' : ''),
)

const existingStatus = computed(() => {
  const status = existingAlarm.value?.status || 'ACTIVE'
  return status.charAt(0) + status.slice(1).toLowerCase()
})

const pad2 = value => String(value).padStart(2, '0')

const toLocalParts = value => {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null
  return {
    date: `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`,
    time: `${pad2(date.getHours())}:${pad2(date.getMinutes())}`,
  }
}

const defaultDue = () => {
  const date = new Date(Date.now() + 60 * 60 * 1000)
  return {
    date: `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`,
    time: `${pad2(date.getHours())}:${pad2(date.getMinutes())}`,
  }
}

const resolveDefaultMessage = () => {
  const configured = String(props.config?.defaultMessage || '').trim()
  if (configured) return configured

  if (isBatch.value) {
    return 'Selected log record is due.'
  }

  return `${logLabel.value} is due.`
}

const resetForm = () => {
  const initial = defaultDue()
  dueDate.value = initial.date
  dueTime.value = initial.time
  leadValue.value = Number(props.config?.defaultLeadValue ?? 1)
  leadUnit.value = props.config?.defaultLeadUnit || 'hours'
  message.value = resolveDefaultMessage()
  repeatChoice.value = 'default'
  errorMessage.value = ''
  existingAlarm.value = null
}

const loadExisting = async () => {
  if (isBatch.value || !firstLog.value?.id) return

  try {
    const res = await api.get(
      `/alarms/log/${firstLog.value.id}`,
    )

    if (!res.data) return

    existingAlarm.value = res.data

    const parts = toLocalParts(res.data.dueAt)
    if (parts) {
      dueDate.value = parts.date
      dueTime.value = parts.time
    }

    leadValue.value = Number(res.data.leadValue ?? props.config?.defaultLeadValue ?? 1)
    leadUnit.value = res.data.leadUnit || props.config?.defaultLeadUnit || 'hours'
    message.value = res.data.message || resolveDefaultMessage()

    if (res.data.repeatMode === 'untilDismissed') {
      repeatChoice.value = 'untilDismissed'
    } else if (res.data.repeatMode === 'count') {
      repeatChoice.value = String(res.data.repeatCount || 5)
    }
  } catch (err) {
    // 404 / no row should simply behave like a new alarm.
    console.debug('No existing alarm for log', err)
  }
}

watch(
  () => props.visible,
  async visible => {
    if (!visible) return
    resetForm()
    await loadExisting()
  },
)

const dueDateTime = computed(() => {
  if (!dueDate.value || !dueTime.value) return null
  const date = new Date(`${dueDate.value}T${dueTime.value}:00`)
  return Number.isNaN(date.getTime()) ? null : date
})

const triggerDateTime = computed(() => {
  if (!dueDateTime.value) return null

  const multiplier =
    leadUnit.value === 'days'
      ? 24 * 60 * 60 * 1000
      : leadUnit.value === 'hours'
        ? 60 * 60 * 1000
        : 60 * 1000

  return new Date(
    dueDateTime.value.getTime() -
      Math.max(0, Number(leadValue.value || 0)) * multiplier,
  )
})

const triggerPreview = computed(() => {
  const value = triggerDateTime.value
  if (!value) return 'after you choose a date and time'

  return value.toLocaleString('en-PH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
})

const repeatPayload = () => {
  if (repeatChoice.value === 'default') {
    return {
      repeatMode: null,
      repeatCount: null,
    }
  }

  if (repeatChoice.value === 'untilDismissed') {
    return {
      repeatMode: 'untilDismissed',
      repeatCount: null,
    }
  }

  return {
    repeatMode: 'count',
    repeatCount: Number(repeatChoice.value || 5),
  }
}

const validate = () => {
  errorMessage.value = ''

  if (!dueDateTime.value) {
    errorMessage.value = 'Choose a valid due date and time.'
    return false
  }

  if (dueDateTime.value.getTime() <= Date.now()) {
    errorMessage.value = 'Due date and time must be in the future.'
    return false
  }

  if (Number(leadValue.value) < 0) {
    errorMessage.value = 'Reminder lead time cannot be negative.'
    return false
  }

  return true
}

const save = async () => {
  if (!validate()) return

  saving.value = true
  errorMessage.value = ''

  try {
    const repeat = repeatPayload()

    const payload = {
      moduleId: Number(props.moduleId),
      dueAt: dueDateTime.value.toISOString(),
      leadValue: Math.max(0, Number(leadValue.value || 0)),
      leadUnit: leadUnit.value,
      message: message.value.trim(),
      ...repeat,
    }

    if (isBatch.value) {
      await api.post('/alarms/batch', {
        ...payload,
        logIds: props.logs.map(log => Number(log.id)),
      })
    } else {
      await api.post('/alarms', {
        ...payload,
        logId: Number(firstLog.value.id),
      })
    }

    emit('saved')
  } catch (err) {
    console.error(err)
    errorMessage.value =
      err?.response?.data?.message ||
      'Failed to save alarm.'
  } finally {
    saving.value = false
  }
}

const removeExisting = async () => {
  if (!existingAlarm.value?.id) return

  saving.value = true

  try {
    await api.delete(
      `/alarms/${existingAlarm.value.id}`,
    )
    emit('toast', {
      message: 'Alarm removed.',
      type: 'success',
    })
    emit('saved')
  } catch (err) {
    console.error(err)
    errorMessage.value = 'Failed to remove alarm.'
  } finally {
    saving.value = false
  }
}

const close = () => {
  if (!saving.value) emit('close')
}
</script>

<style scoped>
.alarm-editor-backdrop {
  position: fixed;
  inset: 0;
  z-index: 30000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  background: rgba(15, 23, 42, .62);
  backdrop-filter: blur(4px);
}
.alarm-editor-modal {
  width: min(560px, 96vw);
  max-height: 92vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  border-radius: 16px;
  background: #fff;
  box-shadow: 0 28px 90px rgba(15, 23, 42, .35);
}
.alarm-editor-header {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  padding: 17px 19px;
  border-bottom: 1px solid #e5e7eb;
}
.alarm-editor-header h3 {
  margin: 0;
  color: #111827;
  font-size: 16px;
}
.alarm-editor-header p {
  margin: 4px 0 0;
  color: #6b7280;
  font-size: 11px;
}
.alarm-close {
  width: 34px;
  height: 34px;
  border: 1px solid #e5e7eb;
  border-radius: 9px;
  background: #fff;
  color: #64748b;
  cursor: pointer;
}
.alarm-editor-body {
  overflow-y: auto;
  padding: 18px 19px;
}
.alarm-selected-preview {
  display: flex;
  flex-direction: column;
  gap: 3px;
  padding: 10px 12px;
  margin-bottom: 14px;
  border: 1px solid #dbeafe;
  border-radius: 10px;
  background: #eff6ff;
}
.alarm-selected-preview strong {
  color: #1d4ed8;
  font-size: 11px;
}
.alarm-selected-preview span {
  color: #475569;
  font-size: 10px;
  line-height: 1.4;
}
.alarm-editor-grid {
  display: grid;
  gap: 12px;
}
.alarm-editor-grid.two {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}
.alarm-editor-field {
  margin-bottom: 14px;
}
.alarm-editor-field > label {
  display: block;
  margin-bottom: 6px;
  color: #374151;
  font-size: 11px;
  font-weight: 700;
}
.alarm-editor-field input,
.alarm-editor-field select,
.alarm-editor-field textarea {
  width: 100%;
  box-sizing: border-box;
  border: 1px solid #dbe1ea;
  border-radius: 9px;
  background: #fff;
  padding: 9px 10px;
  color: #111827;
  font: inherit;
  font-size: 12px;
  outline: none;
}
.alarm-editor-field textarea {
  resize: vertical;
  min-height: 72px;
}
.alarm-editor-field input:focus,
.alarm-editor-field select:focus,
.alarm-editor-field textarea:focus {
  border-color: #93c5fd;
  box-shadow: 0 0 0 3px rgba(59,130,246,.12);
}
.alarm-editor-field small {
  display: block;
  margin-top: 5px;
  color: #64748b;
  font-size: 10px;
}
.alarm-lead-row {
  display: grid;
  grid-template-columns: 100px 1fr;
  gap: 8px;
}
.alarm-media-summary {
  min-height: 39px;
  display: flex;
  gap: 8px;
  align-items: center;
  padding: 7px 9px;
  border: 1px solid #e5e7eb;
  border-radius: 9px;
  background: #f8fafc;
}
.alarm-media-summary strong,
.alarm-media-summary small {
  display: block;
}
.alarm-media-summary strong {
  max-width: 190px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: #334155;
  font-size: 10px;
}
.alarm-media-summary small {
  margin-top: 2px;
  color: #94a3b8;
  font-size: 9px;
}
.alarm-editor-error {
  margin-top: 4px;
  padding: 9px 10px;
  border-radius: 9px;
  background: #fef2f2;
  color: #b91c1c;
  font-size: 10px;
}
.alarm-existing-note {
  margin-top: 8px;
  padding: 8px 10px;
  border-radius: 9px;
  background: #f8fafc;
  color: #64748b;
  font-size: 10px;
}
.alarm-editor-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 13px 19px;
  border-top: 1px solid #e5e7eb;
  background: #fafafa;
}
.alarm-editor-footer-right {
  display: flex;
  gap: 8px;
  margin-left: auto;
}
.alarm-btn,
.alarm-remove {
  min-height: 36px;
  padding: 0 13px;
  border-radius: 9px;
  font-size: 11px;
  font-weight: 700;
  cursor: pointer;
}
.alarm-btn.ghost {
  border: 1px solid #d1d5db;
  background: #fff;
  color: #374151;
}
.alarm-btn.primary {
  border: 1px solid #2563eb;
  background: #2563eb;
  color: #fff;
}
.alarm-remove {
  border: 1px solid #fecaca;
  background: #fff;
  color: #dc2626;
}
.alarm-btn:disabled,
.alarm-remove:disabled {
  opacity: .55;
  cursor: not-allowed;
}
@media (max-width: 600px) {
  .alarm-editor-backdrop { padding: 0; }
  .alarm-editor-modal {
    width: 100vw;
    max-height: none;
    height: 100vh;
    border-radius: 0;
  }
  .alarm-editor-grid.two { grid-template-columns: 1fr; }
  .alarm-editor-footer { align-items: stretch; flex-direction: column; }
  .alarm-editor-footer-right { width: 100%; }
  .alarm-editor-footer-right > button { flex: 1; }
}
</style>
