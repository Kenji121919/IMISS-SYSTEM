<template>
  <div class="global-alarm-host">
    <button
      class="alarm-center-fab"
      type="button"
      title="Alarm Center"
      @click="showCenter = true"
    >
      <span class="alarm-bell">🔔</span>
      <span v-if="activeCount" class="alarm-fab-count">{{ activeCount > 99 ? '99+' : activeCount }}</span>
    </button>

    <div
      v-if="currentAlarm && currentAlarm.config?.inAppPopup !== false"
      class="alarm-trigger-backdrop"
    >
      <div class="alarm-trigger-modal">
        <div class="alarm-trigger-top">
          <div class="alarm-pulse">🔔</div>
          <div>
            <h2>{{ currentAlarm.module?.name || 'IMISS Alarm' }}</h2>
            <p>Alarm triggered</p>
          </div>
        </div>

        <div class="alarm-trigger-body">
          <div class="alarm-record-label">
            {{ alarmRecordLabel(currentAlarm) }}
          </div>

          <div class="alarm-message">
            {{ currentAlarm.message || currentAlarm.config?.defaultMessage || 'This log record is due.' }}
          </div>

          <div class="alarm-due-copy">
            Due: {{ formatDateTime(currentAlarm.dueAt) }}
          </div>

          <div
            v-if="hasCurrentMedia"
            class="alarm-trigger-media"
          >
            <video
              v-if="currentIsVideo"
              ref="alarmMedia"
              :src="currentMediaUrl"
              preload="auto"
              playsinline
              @loadedmetadata="onMediaReady"
              @timeupdate="onMediaTimeUpdate"
              @ended="finishMediaCycle"
            ></video>

            <audio
              v-else
              ref="alarmMedia"
              :src="currentMediaUrl"
              preload="auto"
              @loadedmetadata="onMediaReady"
              @timeupdate="onMediaTimeUpdate"
              @ended="finishMediaCycle"
            ></audio>

            <button
              v-if="mediaBlocked"
              type="button"
              class="alarm-manual-play"
              @click="startMediaCycle"
            >
              ▶ Play alarm sound
            </button>

            <div v-if="audioLimitReached" class="alarm-audio-limit">
              Alarm sound stopped after the configured maximum time. The alarm is still active.
            </div>
          </div>
        </div>

        <div class="alarm-trigger-actions">
          <button
            type="button"
            class="alarm-action secondary"
            @click="openCurrentLog"
          >
            Open log
          </button>

          <button
            v-if="currentAlarm.config?.allowSnooze !== false"
            type="button"
            class="alarm-action secondary"
            @click="snoozeCurrent(5)"
          >
            Snooze 5m
          </button>

          <button
            v-if="currentAlarm.config?.allowSnooze !== false"
            type="button"
            class="alarm-action secondary"
            @click="snoozeCurrent(10)"
          >
            Snooze 10m
          </button>

          <button
            type="button"
            class="alarm-action dismiss"
            @click="dismissCurrent"
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>

    <div
      v-if="showCenter"
      class="alarm-center-backdrop"
      @click.self="showCenter = false"
    >
      <div class="alarm-center-panel">
        <div class="alarm-center-header">
          <div>
            <h3>Alarm Center</h3>
            <p>Due, snoozed, and upcoming alarms.</p>
          </div>
          <button type="button" @click="showCenter = false">✕</button>
        </div>

        <div class="alarm-center-body">
          <div
            v-if="notificationSupported && notificationPermission !== 'granted'"
            class="alarm-permission-card"
          >
            <div>
              <strong>Enable desktop notifications</strong>
              <span>Receive an IMISS alert while you are working in another browser tab or application.</span>
            </div>
            <button type="button" @click="requestNotificationPermission">
              Enable
            </button>
          </div>

          <div
            v-else-if="!notificationSupported"
            class="alarm-permission-card warning"
          >
            <div>
              <strong>Desktop notifications are unavailable</strong>
              <span>Use HTTPS or a supported browser. In-app alarms will still work while IMISS is open.</span>
            </div>
          </div>

          <section class="alarm-center-section">
            <div class="alarm-center-section-head">
              <strong>Needs attention</strong>
              <span>{{ dueCenterItems.length }}</span>
            </div>

            <div v-if="!dueCenterItems.length" class="alarm-center-empty">
              No alarms need attention.
            </div>

            <button
              v-for="alarm in dueCenterItems"
              :key="'due-' + alarm.id"
              type="button"
              class="alarm-center-item due"
              @click="focusAlarm(alarm)"
            >
              <span class="alarm-status-dot"></span>
              <span class="alarm-center-copy">
                <strong>{{ alarmRecordLabel(alarm) }}</strong>
                <small>{{ alarm.module?.name || 'Module' }} · {{ centerStatusText(alarm) }}</small>
              </span>
              <span class="alarm-center-time">{{ formatShortDateTime(effectiveAlarmTime(alarm)) }}</span>
            </button>
          </section>

          <section class="alarm-center-section">
            <div class="alarm-center-section-head">
              <strong>Upcoming</strong>
              <span>{{ upcomingCenterItems.length }}</span>
            </div>

            <div v-if="!upcomingCenterItems.length" class="alarm-center-empty">
              No upcoming alarms.
            </div>

            <button
              v-for="alarm in upcomingCenterItems"
              :key="'up-' + alarm.id"
              type="button"
              class="alarm-center-item"
              @click="openAlarmLog(alarm)"
            >
              <span class="alarm-status-dot upcoming"></span>
              <span class="alarm-center-copy">
                <strong>{{ alarmRecordLabel(alarm) }}</strong>
                <small>{{ alarm.module?.name || 'Module' }} · Due {{ formatDateTime(alarm.dueAt) }}</small>
              </span>
              <span class="alarm-center-time">{{ formatShortDateTime(effectiveAlarmTime(alarm)) }}</span>
            </button>
          </section>
        </div>

        <div class="alarm-center-footer">
          <span>IMISS checks alarms every 10 seconds while the app is open.</span>
          <button type="button" @click="refreshCenter">Refresh</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import {
  computed,
  nextTick,
  onMounted,
  onUnmounted,
  ref,
} from 'vue'
import { useRouter } from 'vue-router'
import api from '@/api/axios'

const router = useRouter()

const showCenter = ref(false)
const centerItems = ref([])
const currentAlarm = ref(null)
const alarmQueue = ref([])
const alarmMedia = ref(null)
const mediaBlocked = ref(false)
const audioLimitReached = ref(false)
const repeatsPlayed = ref(0)
const audibleStartedAt = ref(0)
const notificationPermission = ref(
  typeof Notification !== 'undefined'
    ? Notification.permission
    : 'unsupported',
)

const queuedKeys = new Set()
let dueTimer = null
let centerTimer = null
let repeatTimer = null
let notificationRef = null

const notificationSupported = computed(() =>
  typeof Notification !== 'undefined',
)

const userId = computed(() => {
  try {
    const user = JSON.parse(localStorage.getItem('user') || '{}')
    return Number(user?.id || 0)
  } catch {
    return 0
  }
})

const activeCount = computed(() => centerItems.value.length)

const effectiveAlarmTime = alarm =>
  alarm?.status === 'SNOOZED' && alarm?.snoozedUntil
    ? alarm.snoozedUntil
    : alarm?.alarmAt

const dueCenterItems = computed(() => {
  const now = Date.now()
  return centerItems.value.filter(alarm => {
    if (['TRIGGERED'].includes(alarm.status)) return true
    const time = new Date(effectiveAlarmTime(alarm)).getTime()
    return Number.isFinite(time) && time <= now
  })
})

const upcomingCenterItems = computed(() => {
  const now = Date.now()
  return centerItems.value.filter(alarm => {
    if (alarm.status === 'TRIGGERED') return false
    const time = new Date(effectiveAlarmTime(alarm)).getTime()
    return Number.isFinite(time) && time > now
  })
})

const currentMediaUrl = computed(() => {
  if (!currentAlarm.value?.moduleId || !hasCurrentMedia.value) return ''
  return `${api.defaults.baseURL}/alarms/module/${currentAlarm.value.moduleId}/media`
})

const hasCurrentMedia = computed(() =>
  !!currentAlarm.value?.config?.mediaFile,
)

const currentIsVideo = computed(() => {
  const mime = String(currentAlarm.value?.config?.mediaMime || '')
  const name = String(currentAlarm.value?.config?.mediaFileName || '').toLowerCase()
  return mime.startsWith('video/') || name.endsWith('.mp4') || name.endsWith('.webm')
})

const alarmRecordLabel = alarm => {
  const data = alarm?.log?.data || {}
  const values = Object.values(data)
    .map(value => String(value ?? '').trim())
    .filter(Boolean)
  return values[0] || `Log #${alarm?.logId || alarm?.log?.id || ''}`
}

const formatDateTime = value => {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleString('en-PH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

const formatShortDateTime = value => {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleString('en-PH', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

const centerStatusText = alarm => {
  if (alarm.status === 'SNOOZED') return 'Snoozed'
  if (alarm.status === 'TRIGGERED') return 'Triggered'
  return 'Due'
}

const refreshCenter = async () => {
  if (!userId.value) return

  try {
    const res = await api.get(
      `/alarms/user/${userId.value}`,
    )
    centerItems.value = Array.isArray(res.data) ? res.data : []
  } catch (err) {
    console.error('[AlarmCenter] refresh failed:', err)
  }
}

const alarmQueueKey = alarm =>
  `${alarm.id}:${alarm.triggeredAt || alarm.snoozedUntil || alarm.alarmAt}`

const pollDue = async () => {
  if (!userId.value) return

  try {
    const res = await api.get('/alarms/due', {
      params: {
        userId: userId.value,
      },
    })

    const due = Array.isArray(res.data) ? res.data : []

    for (const alarm of due) {
      const key = alarmQueueKey(alarm)
      if (queuedKeys.has(key)) continue
      queuedKeys.add(key)
      alarmQueue.value.push(alarm)
    }

    if (!currentAlarm.value) {
      presentNextAlarm()
    }

    if (due.length) {
      refreshCenter()
    }
  } catch (err) {
    console.error('[AlarmHost] due poll failed:', err)
  }
}

const presentNextAlarm = async () => {
  if (currentAlarm.value || !alarmQueue.value.length) return

  const nextAlarm = alarmQueue.value.shift()
  showDesktopNotification(nextAlarm)

  // If the module explicitly disables the in-app popup, deliver the
  // desktop notification only and continue to the next queued alarm.
  // The alarm remains visible in Alarm Center until dismissed/cancelled.
  if (nextAlarm?.config?.inAppPopup === false) {
    nextTick(() => presentNextAlarm())
    return
  }

  currentAlarm.value = nextAlarm
  repeatsPlayed.value = 0
  audibleStartedAt.value = Date.now()
  mediaBlocked.value = false
  audioLimitReached.value = false

  await nextTick()

  if (hasCurrentMedia.value) {
    // loadedmetadata also calls this. Calling here handles cached media.
    startMediaCycle()
  }
}

const showDesktopNotification = alarm => {
  if (
    !alarm?.config?.browserNotification ||
    !notificationSupported.value ||
    Notification.permission !== 'granted'
  ) {
    return
  }

  try {
    notificationRef?.close?.()

    notificationRef = new Notification(
      `${alarm.module?.name || 'IMISS'} Alarm`,
      {
        body:
          alarm.message ||
          alarm.config?.defaultMessage ||
          `${alarmRecordLabel(alarm)} is due.`,
        tag: `imiss-alarm-${alarm.id}`,
        requireInteraction: true,
      },
    )

    notificationRef.onclick = () => {
      window.focus()
      openAlarmLog(alarm)
      notificationRef?.close?.()
    }
  } catch (err) {
    console.warn('[AlarmHost] desktop notification failed:', err)
  }
}

const requestNotificationPermission = async () => {
  if (!notificationSupported.value) return
  try {
    notificationPermission.value = await Notification.requestPermission()
  } catch (err) {
    console.error(err)
  }
}

const resolvedRepeatMode = computed(() =>
  currentAlarm.value?.repeatMode ||
  currentAlarm.value?.config?.repeatMode ||
  'untilDismissed',
)

const resolvedRepeatCount = computed(() =>
  Number(
    currentAlarm.value?.repeatCount ||
    currentAlarm.value?.config?.repeatCount ||
    5,
  ),
)

const stopMedia = () => {
  if (repeatTimer) {
    clearTimeout(repeatTimer)
    repeatTimer = null
  }

  const media = alarmMedia.value
  if (media) {
    try {
      media.pause()
    } catch {}
  }
}

const maxAudibleReached = () => {
  const maxSeconds = Math.max(
    10,
    Number(currentAlarm.value?.config?.maxAudibleSeconds || 120),
  )

  return (
    audibleStartedAt.value > 0 &&
    Date.now() - audibleStartedAt.value >= maxSeconds * 1000
  )
}

const startMediaCycle = async () => {
  if (!currentAlarm.value || !hasCurrentMedia.value) return

  if (maxAudibleReached()) {
    stopMedia()
    audioLimitReached.value = true
    return
  }

  const media = alarmMedia.value
  if (!media) return

  const start = Math.max(
    0,
    Number(currentAlarm.value.config?.mediaStartSeconds || 0),
  )

  try {
    media.currentTime = start
    await media.play()
    mediaBlocked.value = false
  } catch (err) {
    console.warn('[AlarmHost] media autoplay blocked:', err)
    mediaBlocked.value = true
  }
}

const onMediaReady = () => {
  if (currentAlarm.value && !audioLimitReached.value) {
    startMediaCycle()
  }
}

const onMediaTimeUpdate = () => {
  const media = alarmMedia.value
  if (!media || !currentAlarm.value) return

  const end = Math.max(
    Number(currentAlarm.value.config?.mediaStartSeconds || 0) + 0.25,
    Number(currentAlarm.value.config?.mediaEndSeconds || 10),
  )

  if (media.currentTime >= end) {
    finishMediaCycle()
  }
}

const finishMediaCycle = () => {
  const media = alarmMedia.value
  if (media) {
    try {
      media.pause()
    } catch {}
  }

  repeatsPlayed.value += 1

  if (maxAudibleReached()) {
    audioLimitReached.value = true
    return
  }

  if (
    resolvedRepeatMode.value === 'count' &&
    repeatsPlayed.value >= resolvedRepeatCount.value
  ) {
    return
  }

  const delay = Math.max(
    0,
    Number(currentAlarm.value?.config?.repeatDelaySeconds || 0),
  )

  if (repeatTimer) clearTimeout(repeatTimer)

  repeatTimer = setTimeout(() => {
    startMediaCycle()
  }, delay * 1000)
}

const openAlarmLog = alarm => {
  if (!alarm?.moduleId) return

  showCenter.value = false

  router.push({
    name: 'dynamic-module',
    params: {
      id: alarm.moduleId,
    },
    query: {
      alarmLogId: alarm.logId,
    },
  })
}

const openCurrentLog = () => {
  if (currentAlarm.value) {
    openAlarmLog(currentAlarm.value)
  }
}

const finishCurrent = () => {
  stopMedia()
  notificationRef?.close?.()
  notificationRef = null
  currentAlarm.value = null
  mediaBlocked.value = false
  audioLimitReached.value = false
  repeatsPlayed.value = 0
  audibleStartedAt.value = 0

  nextTick(() => {
    presentNextAlarm()
  })
}

const dismissCurrent = async () => {
  if (!currentAlarm.value?.id) return

  const id = currentAlarm.value.id

  try {
    await api.put(`/alarms/${id}/dismiss`)
  } catch (err) {
    console.error(err)
  }

  finishCurrent()
  refreshCenter()
}

const snoozeCurrent = async minutes => {
  if (!currentAlarm.value?.id) return

  const id = currentAlarm.value.id

  try {
    await api.put(`/alarms/${id}/snooze`, {
      minutes,
    })
  } catch (err) {
    console.error(err)
  }

  finishCurrent()
  refreshCenter()
}

const focusAlarm = alarm => {
  if (currentAlarm.value?.id === alarm.id) {
    showCenter.value = false
    return
  }

  const key = alarmQueueKey(alarm)
  if (!queuedKeys.has(key)) {
    queuedKeys.add(key)
    alarmQueue.value.unshift(alarm)
  }

  showCenter.value = false

  if (!currentAlarm.value) {
    presentNextAlarm()
  } else {
    openAlarmLog(alarm)
  }
}

onMounted(() => {
  refreshCenter()
  pollDue()

  dueTimer = setInterval(pollDue, 10000)
  centerTimer = setInterval(refreshCenter, 30000)
})

onUnmounted(() => {
  if (dueTimer) clearInterval(dueTimer)
  if (centerTimer) clearInterval(centerTimer)
  if (repeatTimer) clearTimeout(repeatTimer)
  notificationRef?.close?.()
  stopMedia()
})
</script>

<style scoped>
.alarm-center-fab {
  position: fixed;
  right: 20px;
  bottom: 20px;
  z-index: 18000;
  width: 48px;
  height: 48px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px solid #dbeafe;
  border-radius: 50%;
  background: #fff;
  color: #1e3a8a;
  box-shadow: 0 12px 32px rgba(15, 23, 42, .2);
  cursor: pointer;
}
.alarm-center-fab:hover { background: #eff6ff; }
.alarm-bell { font-size: 19px; }
.alarm-fab-count {
  position: absolute;
  top: -5px;
  right: -5px;
  min-width: 19px;
  height: 19px;
  padding: 0 5px;
  box-sizing: border-box;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 2px solid #fff;
  border-radius: 999px;
  background: #dc2626;
  color: #fff;
  font-size: 9px;
  font-weight: 800;
}
.alarm-trigger-backdrop,
.alarm-center-backdrop {
  position: fixed;
  inset: 0;
  z-index: 40000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  background: rgba(15, 23, 42, .64);
  backdrop-filter: blur(5px);
}
.alarm-trigger-modal {
  width: min(520px, 96vw);
  overflow: hidden;
  border-radius: 18px;
  background: #fff;
  box-shadow: 0 30px 100px rgba(15,23,42,.4);
}
.alarm-trigger-top {
  display: flex;
  align-items: center;
  gap: 13px;
  padding: 18px 20px;
  background: linear-gradient(135deg, #fff7ed, #fff);
  border-bottom: 1px solid #fed7aa;
}
.alarm-pulse {
  width: 46px;
  height: 46px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: #ffedd5;
  font-size: 21px;
  animation: alarmPulse 1.35s ease-in-out infinite;
}
@keyframes alarmPulse {
  0%,100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(249,115,22,.22); }
  50% { transform: scale(1.04); box-shadow: 0 0 0 9px rgba(249,115,22,0); }
}
.alarm-trigger-top h2 {
  margin: 0;
  color: #111827;
  font-size: 18px;
}
.alarm-trigger-top p {
  margin: 3px 0 0;
  color: #ea580c;
  font-size: 11px;
  font-weight: 700;
}
.alarm-trigger-body { padding: 20px; text-align: center; }
.alarm-record-label {
  color: #0f172a;
  font-size: 18px;
  font-weight: 800;
}
.alarm-message {
  margin-top: 8px;
  color: #374151;
  font-size: 13px;
  line-height: 1.5;
}
.alarm-due-copy {
  margin-top: 7px;
  color: #64748b;
  font-size: 10px;
}
.alarm-trigger-media { margin-top: 14px; }
.alarm-trigger-media video {
  width: min(360px, 100%);
  max-height: 210px;
  border-radius: 10px;
  background: #0f172a;
  object-fit: contain;
}
.alarm-manual-play {
  display: block;
  margin: 12px auto 0;
  padding: 8px 12px;
  border: 1px solid #fdba74;
  border-radius: 8px;
  background: #fff7ed;
  color: #c2410c;
  font-size: 11px;
  font-weight: 700;
  cursor: pointer;
}
.alarm-audio-limit {
  margin-top: 10px;
  color: #92400e;
  font-size: 10px;
}
.alarm-trigger-actions {
  display: flex;
  gap: 8px;
  padding: 13px 16px;
  border-top: 1px solid #e5e7eb;
  background: #fafafa;
  flex-wrap: wrap;
  justify-content: flex-end;
}
.alarm-action {
  min-height: 36px;
  padding: 0 12px;
  border-radius: 9px;
  font-size: 11px;
  font-weight: 700;
  cursor: pointer;
}
.alarm-action.secondary {
  border: 1px solid #d1d5db;
  background: #fff;
  color: #374151;
}
.alarm-action.dismiss {
  border: 1px solid #dc2626;
  background: #dc2626;
  color: #fff;
}
.alarm-center-panel {
  width: min(620px, 96vw);
  max-height: 88vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  border-radius: 17px;
  background: #fff;
  box-shadow: 0 28px 90px rgba(15,23,42,.38);
}
.alarm-center-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 14px;
  padding: 16px 18px;
  border-bottom: 1px solid #e5e7eb;
}
.alarm-center-header h3 { margin: 0; color: #111827; font-size: 16px; }
.alarm-center-header p { margin: 3px 0 0; color: #64748b; font-size: 10px; }
.alarm-center-header > button {
  width: 32px;
  height: 32px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: #fff;
  color: #64748b;
  cursor: pointer;
}
.alarm-center-body {
  flex: 1 1 auto;
  min-height: 0;
  overflow-y: auto;
  padding: 14px 16px;
  background: #f8fafc;
}
.alarm-permission-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 14px;
  padding: 11px 12px;
  margin-bottom: 13px;
  border: 1px solid #bfdbfe;
  border-radius: 10px;
  background: #eff6ff;
}
.alarm-permission-card.warning { border-color: #fde68a; background: #fffbeb; }
.alarm-permission-card strong,
.alarm-permission-card span { display: block; }
.alarm-permission-card strong { color: #1e3a8a; font-size: 10px; }
.alarm-permission-card.warning strong { color: #92400e; }
.alarm-permission-card span { margin-top: 2px; color: #475569; font-size: 9px; line-height: 1.4; }
.alarm-permission-card button {
  padding: 7px 10px;
  border: 1px solid #2563eb;
  border-radius: 8px;
  background: #2563eb;
  color: #fff;
  font-size: 10px;
  font-weight: 700;
  cursor: pointer;
}
.alarm-center-section + .alarm-center-section { margin-top: 18px; }
.alarm-center-section-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 2px 7px;
}
.alarm-center-section-head strong { color: #334155; font-size: 10px; text-transform: uppercase; letter-spacing: .045em; }
.alarm-center-section-head span { color: #94a3b8; font-size: 9px; }
.alarm-center-empty {
  padding: 16px;
  border: 1px dashed #cbd5e1;
  border-radius: 10px;
  color: #94a3b8;
  text-align: center;
  font-size: 10px;
  background: #fff;
}
.alarm-center-item {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 11px;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  background: #fff;
  text-align: left;
  cursor: pointer;
}
.alarm-center-item + .alarm-center-item { margin-top: 7px; }
.alarm-center-item:hover { border-color: #bfdbfe; background: #f8fbff; }
.alarm-center-item.due { border-color: #fed7aa; background: #fffaf5; }
.alarm-status-dot {
  width: 8px;
  height: 8px;
  flex: 0 0 8px;
  border-radius: 50%;
  background: #ef4444;
}
.alarm-status-dot.upcoming { background: #f59e0b; }
.alarm-center-copy { flex: 1; min-width: 0; }
.alarm-center-copy strong,
.alarm-center-copy small { display: block; }
.alarm-center-copy strong {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: #111827;
  font-size: 11px;
}
.alarm-center-copy small {
  margin-top: 2px;
  color: #64748b;
  font-size: 9px;
}
.alarm-center-time {
  flex: 0 0 auto;
  color: #64748b;
  font-size: 9px;
}
.alarm-center-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
  padding: 10px 16px;
  border-top: 1px solid #e5e7eb;
  color: #94a3b8;
  font-size: 9px;
}
.alarm-center-footer button {
  border: 0;
  background: transparent;
  color: #2563eb;
  font-size: 9px;
  font-weight: 700;
  cursor: pointer;
}
@media (max-width: 600px) {
  .alarm-trigger-backdrop,
  .alarm-center-backdrop { padding: 0; }
  .alarm-center-panel,
  .alarm-trigger-modal {
    width: 100vw;
    max-height: none;
    height: 100vh;
    border-radius: 0;
  }
  .alarm-trigger-actions { margin-top: auto; }
  .alarm-center-fab { right: 14px; bottom: 14px; }
}
</style>
