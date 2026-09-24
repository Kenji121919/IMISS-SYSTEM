IMISS Alarm export/type fix

Replace/merge these files into the IMISS-SYSTEM project root.

Fixes:
1. Restores/ensures export class LogAlarm.
2. Restores/ensures export type LogAlarmStatus.
3. Uses import type for AlarmLeadUnit/AlarmRepeatMode/LogAlarmStatus.
4. Keeps ModuleAlarmConfig and LogAlarm as runtime imports for TypeORM decorators.
5. Uses explicit MySQL varchar types for nullable media string columns.

After copying, restart:
cd backend
npm run start:dev
