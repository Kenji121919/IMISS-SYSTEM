<template>
  <div class="alarm-config-card">
    <div class="alarm-config-head">
      <div>
        <div class="alarm-section-title">Log alarms</div>
        <div class="alarm-section-subtitle">
          Allow users to set alarms for individual logs, selected logs, or both.
        </div>
      </div>

      <label class="alarm-switch">
        <input v-model="local.enabled" type="checkbox" />
        <span></span>
      </label>
    </div>

    <transition name="alarm-config-slide">
      <div v-if="local.enabled" class="alarm-config-body">
        <div class="alarm-grid two">
          <div class="alarm-field">
            <label>Alarm assignment</label>
            <select v-model="local.mode">
              <option value="both">Individual + Batch</option>
              <option value="individual">Individual only</option>
              <option value="batch">Batch only</option>
            </select>
          </div>

          <div class="alarm-field">
            <label>Default reminder</label>
            <div class="alarm-inline">
              <input
                v-model.number="local.defaultLeadValue"
                type="number"
                min="0"
                max="999"
              />
              <select v-model="local.defaultLeadUnit">
                <option value="minutes">Minutes before</option>
                <option value="hours">Hours before</option>
                <option value="days">Days before</option>
              </select>
            </div>
          </div>
        </div>

        <div class="alarm-field">
          <label>Default alarm message</label>
          <input
            v-model="local.defaultMessage"
            type="text"
            placeholder="e.g. This router is due for return."
          />
        </div>

        <div class="alarm-divider"></div>

        <div class="alarm-media-head">
          <div>
            <strong>Alarm media</strong>
            <span>Optional audio/video used when an alarm is triggered.</span>
          </div>
          <span class="alarm-media-limit">Max file: 25 MB · Clip: 30 sec max</span>
        </div>

        <div class="alarm-upload-row">
          <label class="alarm-upload-btn">
            <input
              ref="fileInput"
              type="file"
              accept="audio/mpeg,audio/wav,audio/ogg,audio/mp4,video/mp4,video/webm,.mp3,.wav,.ogg,.m4a,.mp4,.webm"
              @change="onMediaSelected"
            />
            {{ hasMedia ? 'Replace media' : 'Upload audio / video' }}
          </label>

          <div v-if="displayMediaName" class="alarm-media-name">
            <span>▶</span>
            <div>
              <strong>{{ displayMediaName }}</strong>
              <small>{{ displayMediaType }}</small>
            </div>
          </div>

          <button
            v-if="hasMedia"
            type="button"
            class="alarm-remove-media"
            @click="removeMedia"
          >
            Remove
          </button>
        </div>

        <div v-if="hasMedia" class="alarm-trim-panel">
          <div class="alarm-preview-wrap">
            <video
              v-if="isVideo"
              ref="mediaPreview"
              :src="mediaPreviewSrc"
              class="alarm-video-preview"
              preload="metadata"
              @loadedmetadata="onLoadedMetadata"
              @timeupdate="onPreviewTimeUpdate"
            ></video>

            <audio
              v-else
              ref="mediaPreview"
              :src="mediaPreviewSrc"
              preload="metadata"
              @loadedmetadata="onLoadedMetadata"
              @timeupdate="onPreviewTimeUpdate"
            ></audio>

            <button
              type="button"
              class="alarm-preview-btn"
              @click="previewTrim"
            >
              {{ previewPlaying ? '■ Stop preview' : '▶ Preview trimmed clip' }}
            </button>
          </div>

          <div class="alarm-grid three">
            <div class="alarm-field">
              <label>Start (seconds)</label>
              <input
                v-model.number="local.mediaStartSeconds"
                type="number"
                min="0"
                step="0.1"
                @change="normalizeTrim"
              />
            </div>

            <div class="alarm-field">
              <label>End (seconds)</label>
              <input
                v-model.number="local.mediaEndSeconds"
                type="number"
                min="0.1"
                step="0.1"
                @change="normalizeTrim"
              />
            </div>

            <div class="alarm-field">
              <label>Clip length</label>
              <div class="alarm-readonly">
                {{ clipLength.toFixed(1) }} sec
              </div>
            </div>
          </div>

          <div class="alarm-trim-track">
            Playback uses only {{ Number(local.mediaStartSeconds || 0).toFixed(1) }}s
            to {{ Number(local.mediaEndSeconds || 0).toFixed(1) }}s of the file.
          </div>
        </div>

        <div class="alarm-divider"></div>

        <div class="alarm-grid three">
          <div class="alarm-field">
            <label>Repeat mode</label>
            <select v-model="local.repeatMode">
              <option value="untilDismissed">Until dismissed</option>
              <option value="count">Fixed number of times</option>
            </select>
          </div>

          <div v-if="local.repeatMode === 'count'" class="alarm-field">
            <label>Repeat count</label>
            <select v-model.number="local.repeatCount">
              <option :value="1">1 time</option>
              <option :value="3">3 times</option>
              <option :value="5">5 times</option>
              <option :value="10">10 times</option>
            </select>
          </div>

          <div class="alarm-field">
            <label>Delay between repeats</label>
            <div class="alarm-inline suffix">
              <input
                v-model.number="local.repeatDelaySeconds"
                type="number"
                min="0"
                max="60"
              />
              <span>seconds</span>
            </div>
          </div>

          <div class="alarm-field">
            <label>Maximum audible period</label>
            <div class="alarm-inline suffix">
              <input
                v-model.number="maxAudibleMinutes"
                type="number"
                min="1"
                max="30"
              />
              <span>minutes</span>
            </div>
          </div>
        </div>

        <div class="alarm-options">
          <label>
            <input v-model="local.inAppPopup" type="checkbox" />
            <span>
              <strong>In-app popup</strong>
              <small>Show the full IMISS alarm window while the system is open.</small>
            </span>
          </label>

          <label>
            <input v-model="local.browserNotification" type="checkbox" />
            <span>
              <strong>Desktop/browser notification</strong>
              <small>Show an operating-system notification while the user is on another tab or application.</small>
            </span>
          </label>

          <label>
            <input v-model="local.allowSnooze" type="checkbox" />
            <span>
              <strong>Allow snooze</strong>
              <small>Users may postpone a triggered alarm for 5 or 10 minutes.</small>
            </span>
          </label>
        </div>

        <div class="alarm-info-note">
          Desktop notifications require browser permission. For computers using IMISS through a LAN IP,
          HTTPS is recommended so browser notifications work reliably.
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup>
import {
  computed,
  ref,
  watch,
  onBeforeUnmount,
} from 'vue'
import api from '@/api/axios'

const props = defineProps({
  modelValue: {
    type: Object,
    default: () => ({}),
  },
  moduleId: {
    type: [Number, String],
    default: null,
  },
})

const emit = defineEmits([
  'update:modelValue',
  'toast',
])

const defaults = () => ({
  enabled: false,
  mode: 'both',
  defaultLeadValue: 1,
  defaultLeadUnit: 'hours',
  defaultMessage: '',
  mediaFile: null,
  mediaFileName: null,
  mediaMime: null,
  mediaStartSeconds: 0,
  mediaEndSeconds: 10,
  repeatMode: 'untilDismissed',
  repeatCount: 5,
  repeatDelaySeconds: 3,
  maxAudibleSeconds: 120,
  inAppPopup: true,
  browserNotification: true,
  allowSnooze: true,
})

const local = ref({
  ...defaults(),
  ...(props.modelValue || {}),
})

const fileInput = ref(null)
const mediaPreview = ref(null)
const pendingFile = ref(null)
const pendingObjectUrl = ref('')
const mediaDuration = ref(0)
const previewPlaying = ref(false)

let syncingFromParent = false

watch(
  () => props.modelValue,
  value => {
    syncingFromParent = true
    local.value = {
      ...defaults(),
      ...(value || {}),
    }
    queueMicrotask(() => {
      syncingFromParent = false
    })
  },
  { deep: true },
)

watch(
  local,
  value => {
    if (syncingFromParent) return
    emit(
      'update:modelValue',
      JSON.parse(JSON.stringify(value)),
    )
  },
  { deep: true },
)

const maxAudibleMinutes = computed({
  get() {
    return Math.max(
      1,
      Math.round(Number(local.value.maxAudibleSeconds || 120) / 60),
    )
  },
  set(value) {
    const minutes = Math.min(30, Math.max(1, Number(value) || 1))
    local.value.maxAudibleSeconds = Math.round(minutes * 60)
  },
})

const clipLength = computed(() =>
  Math.max(
    0,
    Number(local.value.mediaEndSeconds || 0) -
      Number(local.value.mediaStartSeconds || 0),
  ),
)

const hasMedia = computed(() =>
  !!pendingFile.value || !!local.value.mediaFile,
)

const displayMediaName = computed(() =>
  pendingFile.value?.name || local.value.mediaFileName || '',
)

const displayMediaType = computed(() => {
  const mime = pendingFile.value?.type || local.value.mediaMime || ''
  if (mime.startsWith('video/')) return 'Video alarm'
  if (mime.startsWith('audio/')) return 'Audio alarm'
  return 'Alarm media'
})

const isVideo = computed(() => {
  const mime = pendingFile.value?.type || local.value.mediaMime || ''
  const name = displayMediaName.value.toLowerCase()
  return mime.startsWith('video/') || name.endsWith('.mp4') || name.endsWith('.webm')
})

const mediaPreviewSrc = computed(() => {
  if (pendingObjectUrl.value) return pendingObjectUrl.value
  if (!props.moduleId || !local.value.mediaFile) return ''
  return `${api.defaults.baseURL}/alarms/module/${props.moduleId}/media?_ts=${Date.now()}`
})

const showToast = (message, type = 'success') => {
  emit('toast', { message, type })
}

const clearPendingObjectUrl = () => {
  if (pendingObjectUrl.value) {
    URL.revokeObjectURL(pendingObjectUrl.value)
    pendingObjectUrl.value = ''
  }
}

const onMediaSelected = event => {
  const file = event.target.files?.[0]
  if (!file) return

  const allowed = /\.(mp3|wav|ogg|m4a|mp4|webm)$/i.test(file.name)
  if (!allowed) {
    showToast('Use MP3, WAV, OGG, M4A, MP4, or WebM media.', 'error')
    event.target.value = ''
    return
  }

  if (file.size > 25 * 1024 * 1024) {
    showToast('Alarm media must be 25 MB or smaller.', 'error')
    event.target.value = ''
    return
  }

  clearPendingObjectUrl()
  pendingFile.value = file
  pendingObjectUrl.value = URL.createObjectURL(file)
  mediaDuration.value = 0

  local.value.mediaFileName = file.name
  local.value.mediaMime = file.type || null
  local.value.mediaStartSeconds = 0
  local.value.mediaEndSeconds = 10
}

const onLoadedMetadata = () => {
  const duration = Number(mediaPreview.value?.duration || 0)
  if (!Number.isFinite(duration) || duration <= 0) return

  mediaDuration.value = duration

  const start = Math.min(
    Number(local.value.mediaStartSeconds || 0),
    Math.max(0, duration - 0.25),
  )

  local.value.mediaStartSeconds = start
  local.value.mediaEndSeconds = Math.min(
    duration,
    Math.max(start + 0.25, Number(local.value.mediaEndSeconds || start + 10)),
    start + 30,
  )
}

const normalizeTrim = () => {
  let start = Math.max(0, Number(local.value.mediaStartSeconds || 0))
  let end = Math.max(0.25, Number(local.value.mediaEndSeconds || 10))

  if (mediaDuration.value > 0) {
    start = Math.min(start, Math.max(0, mediaDuration.value - 0.25))
    end = Math.min(end, mediaDuration.value)
  }

  if (end <= start) end = start + 0.25
  if (end - start > 30) end = start + 30
  if (mediaDuration.value > 0) end = Math.min(end, mediaDuration.value)

  local.value.mediaStartSeconds = Number(start.toFixed(2))
  local.value.mediaEndSeconds = Number(end.toFixed(2))
}

const stopPreview = () => {
  const media = mediaPreview.value
  if (media) media.pause()
  previewPlaying.value = false
}

const previewTrim = async () => {
  const media = mediaPreview.value
  if (!media) return

  if (previewPlaying.value) {
    stopPreview()
    return
  }

  normalizeTrim()

  try {
    media.currentTime = Number(local.value.mediaStartSeconds || 0)
    await media.play()
    previewPlaying.value = true
  } catch (err) {
    console.error(err)
    showToast('The browser blocked media playback. Click preview again.', 'error')
  }
}

const onPreviewTimeUpdate = () => {
  const media = mediaPreview.value
  if (!media || !previewPlaying.value) return

  if (media.currentTime >= Number(local.value.mediaEndSeconds || 0)) {
    stopPreview()
    media.currentTime = Number(local.value.mediaStartSeconds || 0)
  }
}

const removeMedia = async () => {
  stopPreview()

  if (pendingFile.value) {
    pendingFile.value = null
    clearPendingObjectUrl()
    if (fileInput.value) fileInput.value.value = ''

    if (props.moduleId && local.value.mediaFile) {
      await loadForModule(props.moduleId)
    } else {
      local.value.mediaFileName = null
      local.value.mediaMime = null
      local.value.mediaStartSeconds = 0
      local.value.mediaEndSeconds = 10
    }
    return
  }

  if (!props.moduleId || !local.value.mediaFile) return

  try {
    const res = await api.delete(
      `/alarms/module/${props.moduleId}/media`,
    )
    local.value = {
      ...defaults(),
      ...res.data,
    }
    showToast('Alarm media removed.')
  } catch (err) {
    console.error(err)
    showToast('Failed to remove alarm media.', 'error')
  }
}

const reset = () => {
  stopPreview()
  clearPendingObjectUrl()
  pendingFile.value = null
  mediaDuration.value = 0
  if (fileInput.value) fileInput.value.value = ''
  local.value = defaults()
}

const loadForModule = async moduleId => {
  stopPreview()
  clearPendingObjectUrl()
  pendingFile.value = null
  mediaDuration.value = 0

  if (!moduleId) {
    local.value = defaults()
    return local.value
  }

  try {
    const res = await api.get(
      `/alarms/module/${moduleId}/config`,
    )

    local.value = {
      ...defaults(),
      ...(res.data || {}),
    }

    return local.value
  } catch (err) {
    console.error(err)
    local.value = defaults()
    showToast('Could not load alarm configuration.', 'error')
    return local.value
  }
}

const saveToModule = async moduleId => {
  if (!moduleId) return null

  normalizeTrim()

  const configPayload = {
    ...local.value,
    mediaFile: undefined,
    mediaFileName: undefined,
    mediaMime: undefined,
  }

  const configRes = await api.put(
    `/alarms/module/${moduleId}/config`,
    configPayload,
  )

  local.value = {
    ...defaults(),
    ...(configRes.data || {}),
  }

  if (pendingFile.value) {
    const data = new FormData()
    data.append('file', pendingFile.value)

    const mediaRes = await api.post(
      `/alarms/module/${moduleId}/media`,
      data,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      },
    )

    local.value = {
      ...defaults(),
      ...(mediaRes.data || {}),
    }

    pendingFile.value = null
    clearPendingObjectUrl()
    if (fileInput.value) fileInput.value.value = ''
  }

  emit(
    'update:modelValue',
    JSON.parse(JSON.stringify(local.value)),
  )

  return local.value
}

onBeforeUnmount(() => {
  clearPendingObjectUrl()
})

defineExpose({
  reset,
  loadForModule,
  saveToModule,
})
</script>

<style scoped>
.alarm-config-card {
  margin-top: 2px;
  border: 1px solid #e5e7eb;
  border-radius: 14px;
  background: #fff;
  overflow: hidden;
}
.alarm-config-head {
  display: flex;
  justify-content: space-between;
  gap: 18px;
  align-items: center;
  padding: 16px 18px;
}
.alarm-section-title {
  color: #111827;
  font-size: 13px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: .045em;
}
.alarm-section-subtitle {
  margin-top: 4px;
  color: #6b7280;
  font-size: 12px;
  line-height: 1.45;
}
.alarm-switch {
  position: relative;
  width: 44px;
  height: 24px;
  flex: 0 0 44px;
}
.alarm-switch input {
  opacity: 0;
  width: 0;
  height: 0;
}
.alarm-switch span {
  position: absolute;
  inset: 0;
  cursor: pointer;
  border-radius: 999px;
  background: #d1d5db;
  transition: .18s ease;
}
.alarm-switch span::after {
  content: '';
  position: absolute;
  width: 18px;
  height: 18px;
  left: 3px;
  top: 3px;
  border-radius: 50%;
  background: #fff;
  box-shadow: 0 1px 3px rgba(0,0,0,.2);
  transition: .18s ease;
}
.alarm-switch input:checked + span {
  background: #2563eb;
}
.alarm-switch input:checked + span::after {
  transform: translateX(20px);
}
.alarm-config-body {
  padding: 0 18px 18px;
  border-top: 1px solid #eef2f7;
}
.alarm-grid {
  display: grid;
  gap: 12px;
  margin-top: 15px;
}
.alarm-grid.two { grid-template-columns: repeat(2, minmax(0, 1fr)); }
.alarm-grid.three { grid-template-columns: repeat(3, minmax(0, 1fr)); }
.alarm-field {
  margin-top: 14px;
}
.alarm-grid .alarm-field { margin-top: 0; }
.alarm-field > label {
  display: block;
  margin-bottom: 6px;
  color: #374151;
  font-size: 11px;
  font-weight: 700;
}
.alarm-field input,
.alarm-field select,
.alarm-readonly {
  width: 100%;
  min-height: 38px;
  box-sizing: border-box;
  border: 1px solid #dbe1ea;
  border-radius: 9px;
  background: #fff;
  padding: 8px 10px;
  color: #111827;
  font-size: 12px;
  outline: none;
}
.alarm-field input:focus,
.alarm-field select:focus {
  border-color: #93c5fd;
  box-shadow: 0 0 0 3px rgba(59,130,246,.12);
}
.alarm-inline {
  display: grid;
  grid-template-columns: 90px 1fr;
  gap: 8px;
}
.alarm-inline.suffix {
  grid-template-columns: 90px auto;
  align-items: center;
}
.alarm-inline.suffix span {
  color: #6b7280;
  font-size: 11px;
}
.alarm-divider {
  height: 1px;
  margin: 18px 0 0;
  background: #eef2f7;
}
.alarm-media-head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
  margin-top: 16px;
}
.alarm-media-head strong,
.alarm-media-head span {
  display: block;
}
.alarm-media-head strong {
  color: #111827;
  font-size: 12px;
}
.alarm-media-head > div > span {
  margin-top: 3px;
  color: #6b7280;
  font-size: 11px;
}
.alarm-media-limit {
  color: #64748b;
  font-size: 10px;
  white-space: nowrap;
}
.alarm-upload-row {
  display: flex;
  gap: 10px;
  align-items: center;
  margin-top: 12px;
  flex-wrap: wrap;
}
.alarm-upload-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 36px;
  padding: 0 12px;
  border: 1px solid #cbd5e1;
  border-radius: 9px;
  background: #f8fafc;
  color: #334155;
  font-size: 11px;
  font-weight: 700;
  cursor: pointer;
}
.alarm-upload-btn input { display: none; }
.alarm-media-name {
  min-width: 0;
  flex: 1;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  border: 1px solid #e5e7eb;
  border-radius: 9px;
  background: #fff;
}
.alarm-media-name strong,
.alarm-media-name small { display: block; }
.alarm-media-name strong {
  max-width: 330px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: #111827;
  font-size: 11px;
}
.alarm-media-name small {
  margin-top: 2px;
  color: #94a3b8;
  font-size: 9px;
}
.alarm-remove-media {
  border: 0;
  background: transparent;
  color: #dc2626;
  font-size: 11px;
  font-weight: 700;
  cursor: pointer;
}
.alarm-trim-panel {
  margin-top: 12px;
  padding: 12px;
  border: 1px solid #e2e8f0;
  border-radius: 11px;
  background: #f8fafc;
}
.alarm-preview-wrap {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}
.alarm-video-preview {
  width: 180px;
  height: 100px;
  object-fit: contain;
  border-radius: 8px;
  background: #0f172a;
}
.alarm-preview-btn {
  min-height: 34px;
  padding: 0 11px;
  border: 1px solid #bfdbfe;
  border-radius: 8px;
  background: #eff6ff;
  color: #1d4ed8;
  font-size: 11px;
  font-weight: 700;
  cursor: pointer;
}
.alarm-readonly {
  display: flex;
  align-items: center;
  background: #f1f5f9;
  color: #475569;
}
.alarm-trim-track {
  margin-top: 10px;
  color: #64748b;
  font-size: 10px;
}
.alarm-options {
  display: grid;
  gap: 8px;
  margin-top: 17px;
}
.alarm-options label {
  display: flex;
  align-items: flex-start;
  gap: 9px;
  padding: 10px;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  cursor: pointer;
}
.alarm-options input { margin-top: 2px; }
.alarm-options strong,
.alarm-options small { display: block; }
.alarm-options strong {
  color: #111827;
  font-size: 11px;
}
.alarm-options small {
  margin-top: 2px;
  color: #6b7280;
  font-size: 10px;
  line-height: 1.4;
}
.alarm-info-note {
  margin-top: 12px;
  padding: 9px 11px;
  border-radius: 9px;
  background: #fffbeb;
  color: #92400e;
  font-size: 10px;
  line-height: 1.45;
}
.alarm-config-slide-enter-active,
.alarm-config-slide-leave-active { transition: .18s ease; }
.alarm-config-slide-enter-from,
.alarm-config-slide-leave-to { opacity: 0; transform: translateY(-4px); }
@media (max-width: 760px) {
  .alarm-grid.two,
  .alarm-grid.three { grid-template-columns: 1fr; }
  .alarm-media-head { flex-direction: column; }
  .alarm-media-limit { white-space: normal; }
}
</style>
