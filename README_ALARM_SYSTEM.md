# IMISS Log Alarm System

This package adds a module-controlled alarm system for IMISS.

## Included behavior

- Manage Modules can enable or disable alarms per module.
- Alarm assignment mode: Individual only, Batch only, or Individual + Batch.
- Individual row bell button.
- Batch row selection and one schedule copied to all selected logs.
- Optional "Set an alarm after adding this log" flow.
- MP3, WAV, OGG, M4A, MP4, and WebM media uploads.
- 25 MB upload limit.
- Non-destructive trim range: the original file is stored, but only the selected clip is played.
- Alarm clip is limited to 30 seconds.
- Repeat 1/3/5/10 style through fixed count, or Until Dismissed.
- Configurable delay between repeats.
- Maximum audible period, after which sound/video stops but the alarm remains active.
- Snooze 5 or 10 minutes.
- Global Alarm Center available from every dashboard screen.
- Global alarm runtime remains mounted while the user changes IMISS pages.
- Browser/desktop notification support while IMISS is open.

## Files to add

### Backend

Copy these files into the same paths in your project:

- `backend/src/alarm/alarm.module.ts`
- `backend/src/alarm/alarm.controller.ts`
- `backend/src/alarm/alarm.service.ts`
- `backend/src/entities/module-alarm-config.entity.ts`
- `backend/src/entities/log-alarm.entity.ts`

### Frontend

Add:

- `frontend/src/components/alarms/AlarmModuleConfig.vue`
- `frontend/src/components/alarms/AlarmEditorModal.vue`
- `frontend/src/components/alarms/GlobalAlarmHost.vue`

## Files to replace

The ZIP also contains alarm-integrated versions of:

- `backend/src/app.module.ts`
- `frontend/src/views/admin/ManageModules.vue`
- `frontend/src/views/modules/DynamicModule.vue`
- `frontend/src/views/dashboard/Dashboard.vue`

The ManageModules file is based on the latest Template Library redesign/fix from this conversation.
The DynamicModule file preserves Monitoring, Upcoming Alerts, DOCX/PDF Fill & Print, and batch export logic from the latest working version used for this package.

## Database

Your project currently uses TypeORM with `synchronize: true`, so restarting the backend should automatically create:

- `module_alarm_config`
- `log_alarm`

No manual SQL migration is required for the current development setup.

## No new npm package is required

The alarm implementation uses your existing NestJS, TypeORM, Multer, Vue, Vue Router, and Axios dependencies.

Media trimming is non-destructive: IMISS stores the original media file and saves the selected start/end playback range. This avoids requiring FFmpeg on every server/computer.

## Upload directory

Alarm media is automatically stored in:

`backend/uploads/alarms/`

Recommended `.gitignore` entry:

`backend/uploads/alarms/`

Do not commit runtime MP3/MP4 alarm files to Git.

## Run

Backend:

```powershell
cd C:\Users\Kenji\IMISS-SYSTEM\backend
npm run start:dev
```

Frontend:

```powershell
cd C:\Users\Kenji\IMISS-SYSTEM\frontend
npm run dev
```

## First test

1. Open Manage Modules.
2. Edit the Routers module.
3. Turn **Log alarms** ON.
4. Choose **Individual + Batch**.
5. Upload a short MP3 or MP4.
6. Set trim start/end and preview it.
7. Save the module.
8. Open Routers.
9. Click the bell on one row and schedule an alarm a few minutes ahead.
10. Test batch selection and the top **Set alarm** button.
11. Open the Alarm Center using the floating bell.
12. Click **Enable desktop notifications** when offered.

## Important desktop-notification note

The global alarm runtime works while IMISS is open in at least one browser tab/window. It keeps checking the backend even when the user changes to another IMISS page.

Operating-system browser notifications require browser permission and are most reliable on HTTPS. Your current IMISS frontend/backend has been using a LAN HTTP address such as `http://172.16.2.23`. Chromium may restrict desktop notifications on non-secure LAN origins.

For guaranteed alarms when the browser is fully closed, or a notification that must always appear above Excel/Word/other applications, the next phase should be either:

- HTTPS + PWA/Service Worker + Web Push, or
- a small Windows desktop companion using Tauri/Electron.

The current package is intentionally the safer first phase: server-owned alarm records + global IMISS runtime + browser notification + in-app popup/media.
