$root = Get-Location
$required = @(
  'backend\src\alarm\alarm.module.ts',
  'backend\src\alarm\alarm.controller.ts',
  'backend\src\alarm\alarm.service.ts',
  'backend\src\entities\log-alarm.entity.ts',
  'backend\src\entities\module-alarm-config.entity.ts',
  'frontend\src\components\alarms\AlarmModuleConfig.vue',
  'frontend\src\components\alarms\AlarmEditorModal.vue',
  'frontend\src\components\alarms\GlobalAlarmHost.vue',
  'frontend\src\views\admin\ManageModules.vue',
  'frontend\src\views\modules\DynamicModule.vue',
  'frontend\src\views\dashboard\Dashboard.vue'
)

Write-Host "Checking alarm overlay in $root" -ForegroundColor Cyan
$missing = @()
foreach ($file in $required) {
  if (Test-Path $file) {
    Write-Host "OK      $file" -ForegroundColor Green
  } else {
    Write-Host "MISSING $file" -ForegroundColor Red
    $missing += $file
  }
}

if ($missing.Count -gt 0) {
  Write-Host "`nSome alarm files are missing. Extract the ZIP directly into the repository root." -ForegroundColor Red
  exit 1
}

$checks = @(
  @{ File='frontend\src\components\alarms\AlarmModuleConfig.vue'; Text='Individual + Batch' },
  @{ File='frontend\src\components\alarms\AlarmModuleConfig.vue'; Text='25 MB' },
  @{ File='frontend\src\components\alarms\AlarmModuleConfig.vue'; Text='30 sec max' },
  @{ File='frontend\src\views\modules\DynamicModule.vue'; Text='Set an alarm after adding this log' },
  @{ File='frontend\src\views\modules\DynamicModule.vue'; Text='selectedAlarmLogIds' },
  @{ File='frontend\src\components\alarms\GlobalAlarmHost.vue'; Text='Snooze 5' },
  @{ File='frontend\src\components\alarms\GlobalAlarmHost.vue'; Text='Snooze 10' }
)

Write-Host "`nChecking feature markers..." -ForegroundColor Cyan
foreach ($check in $checks) {
  $content = Get-Content $check.File -Raw
  if ($content.Contains($check.Text)) {
    Write-Host "OK      $($check.Text)" -ForegroundColor Green
  } else {
    Write-Host "MISSING $($check.Text) in $($check.File)" -ForegroundColor Red
  }
}
