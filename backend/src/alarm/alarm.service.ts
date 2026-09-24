import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import {
  Brackets,
  In,
  Repository,
} from 'typeorm'
import {
  existsSync,
  unlinkSync,
} from 'fs'
import { join } from 'path'

import {
  ModuleAlarmConfig,
} from '../entities/module-alarm-config.entity'
import type {
  AlarmAssignmentMode,
  AlarmLeadUnit,
  AlarmRepeatMode,
} from '../entities/module-alarm-config.entity'

import {
  LogAlarm,
} from '../entities/log-alarm.entity'
import type {
  LogAlarmStatus,
} from '../entities/log-alarm.entity'
import { Module as ModuleEntity } from '../entities/module.entity'
import { Log } from '../entities/log.entity'

export interface SaveAlarmInput {
  moduleId: number
  logId: number
  dueAt: string | Date
  leadValue?: number
  leadUnit?: AlarmLeadUnit
  message?: string
  repeatMode?: AlarmRepeatMode | null
  repeatCount?: number | null
}

@Injectable()
export class AlarmService {
  constructor(
    @InjectRepository(ModuleAlarmConfig)
    private configRepo: Repository<ModuleAlarmConfig>,

    @InjectRepository(LogAlarm)
    private alarmRepo: Repository<LogAlarm>,

    @InjectRepository(ModuleEntity)
    private moduleRepo: Repository<ModuleEntity>,

    @InjectRepository(Log)
    private logRepo: Repository<Log>,
  ) {}

  private defaultConfig(moduleId: number) {
    return {
      moduleId,
      enabled: false,
      mode: 'both' as AlarmAssignmentMode,
      defaultLeadValue: 1,
      defaultLeadUnit: 'hours' as AlarmLeadUnit,
      defaultMessage: '',
      mediaFile: null,
      mediaFileName: null,
      mediaMime: null,
      mediaStartSeconds: 0,
      mediaEndSeconds: 10,
      repeatMode: 'untilDismissed' as AlarmRepeatMode,
      repeatCount: 5,
      repeatDelaySeconds: 3,
      maxAudibleSeconds: 120,
      inAppPopup: true,
      browserNotification: true,
      allowSnooze: true,
    }
  }

  private clampNumber(
    value: any,
    fallback: number,
    min: number,
    max: number,
  ) {
    const parsed = Number(value)
    if (!Number.isFinite(parsed)) return fallback
    return Math.min(max, Math.max(min, parsed))
  }

  private normalizeLeadUnit(value: any): AlarmLeadUnit {
    return ['minutes', 'hours', 'days'].includes(String(value))
      ? (String(value) as AlarmLeadUnit)
      : 'hours'
  }

  private normalizeMode(value: any): AlarmAssignmentMode {
    return ['individual', 'batch', 'both'].includes(String(value))
      ? (String(value) as AlarmAssignmentMode)
      : 'both'
  }

  private normalizeRepeatMode(value: any): AlarmRepeatMode {
    return String(value) === 'count'
      ? 'count'
      : 'untilDismissed'
  }

  private toClientConfig(config: Partial<ModuleAlarmConfig> & { moduleId: number }) {
    const defaults = this.defaultConfig(Number(config.moduleId))

    return {
      ...defaults,
      ...config,
      id: (config as any)?.id ?? null,
      mediaStartSeconds: this.clampNumber(
        (config as any)?.mediaStartSeconds,
        defaults.mediaStartSeconds,
        0,
        3600,
      ),
      mediaEndSeconds: this.clampNumber(
        (config as any)?.mediaEndSeconds,
        defaults.mediaEndSeconds,
        0.25,
        3600,
      ),
    }
  }

  async getConfig(moduleId: number) {
    const config = await this.configRepo.findOne({
      where: { moduleId },
    })

    return this.toClientConfig(
      config || this.defaultConfig(moduleId),
    )
  }

  async saveConfig(moduleId: number, body: any) {
    const module = await this.moduleRepo.findOne({
      where: { id: moduleId },
    })

    if (!module) {
      throw new NotFoundException('Module not found')
    }

    let config = await this.configRepo.findOne({
      where: { moduleId },
    })

    if (!config) {
      config = this.configRepo.create({
        ...this.defaultConfig(moduleId),
        moduleId,
      })
    }

    config.enabled = !!body?.enabled
    config.mode = this.normalizeMode(body?.mode)
    config.defaultLeadValue = Math.round(
      this.clampNumber(body?.defaultLeadValue, 1, 0, 999),
    )
    config.defaultLeadUnit = this.normalizeLeadUnit(body?.defaultLeadUnit)
    config.defaultMessage = String(body?.defaultMessage || '').trim() || null

    config.repeatMode = this.normalizeRepeatMode(body?.repeatMode)
    config.repeatCount = Math.round(
      this.clampNumber(body?.repeatCount, 5, 1, 100),
    )
    config.repeatDelaySeconds = Math.round(
      this.clampNumber(body?.repeatDelaySeconds, 3, 0, 60),
    )
    config.maxAudibleSeconds = Math.round(
      this.clampNumber(body?.maxAudibleSeconds, 120, 10, 1800),
    )

    config.inAppPopup = body?.inAppPopup !== false
    config.browserNotification = body?.browserNotification !== false
    config.allowSnooze = body?.allowSnooze !== false

    let start = this.clampNumber(
      body?.mediaStartSeconds,
      Number(config.mediaStartSeconds || 0),
      0,
      3600,
    )

    let end = this.clampNumber(
      body?.mediaEndSeconds,
      Number(config.mediaEndSeconds || 10),
      0.25,
      3600,
    )

    if (end <= start) {
      end = start + 1
    }

    // Keep alarm clips intentionally short.
    if (end - start > 30) {
      end = start + 30
    }

    config.mediaStartSeconds = start
    config.mediaEndSeconds = end

    const saved = await this.configRepo.save(config)
    return this.toClientConfig(saved)
  }

  async saveMedia(
    moduleId: number,
    file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('No alarm media uploaded')
    }

    let config = await this.configRepo.findOne({
      where: { moduleId },
    })

    if (!config) {
      await this.saveConfig(moduleId, this.defaultConfig(moduleId))
      config = await this.configRepo.findOne({ where: { moduleId } })
    }

    if (!config) {
      throw new BadRequestException('Could not create alarm configuration')
    }

    this.deleteMediaFile(config.mediaFile)

    config.mediaFile = file.filename
    config.mediaFileName = file.originalname
    config.mediaMime = file.mimetype

    const saved = await this.configRepo.save(config)
    return this.toClientConfig(saved)
  }

  async removeMedia(moduleId: number) {
    const config = await this.configRepo.findOne({
      where: { moduleId },
    })

    if (!config) {
      return this.getConfig(moduleId)
    }

    this.deleteMediaFile(config.mediaFile)

    config.mediaFile = null
    config.mediaFileName = null
    config.mediaMime = null
    config.mediaStartSeconds = 0
    config.mediaEndSeconds = 10

    const saved = await this.configRepo.save(config)
    return this.toClientConfig(saved)
  }

  private deleteMediaFile(filename?: string | null) {
    if (!filename) return

    const filePath = join(
      process.cwd(),
      'uploads',
      'alarms',
      filename,
    )

    try {
      if (existsSync(filePath)) {
        unlinkSync(filePath)
      }
    } catch (err) {
      console.warn('[AlarmService] Failed to delete media:', err)
    }
  }

  async getMediaFile(moduleId: number) {
    const config = await this.configRepo.findOne({
      where: { moduleId },
    })

    if (!config?.mediaFile) {
      throw new NotFoundException('No alarm media configured')
    }

    const filePath = join(
      process.cwd(),
      'uploads',
      'alarms',
      config.mediaFile,
    )

    if (!existsSync(filePath)) {
      throw new NotFoundException('Alarm media file is missing')
    }

    return {
      filePath,
      mime: config.mediaMime || 'application/octet-stream',
      fileName: config.mediaFileName || config.mediaFile,
    }
  }

  private subtractLead(
    dueAt: Date,
    value: number,
    unit: AlarmLeadUnit,
  ) {
    const msPerUnit =
      unit === 'days'
        ? 24 * 60 * 60 * 1000
        : unit === 'hours'
          ? 60 * 60 * 1000
          : 60 * 1000

    return new Date(
      dueAt.getTime() - value * msPerUnit,
    )
  }

  private async assertAlarmPolicy(
    moduleId: number,
    assignment: 'individual' | 'batch',
  ) {
    const config = await this.getConfig(moduleId)

    if (!config.enabled) {
      throw new BadRequestException('Log alarms are disabled for this module')
    }

    const allowed =
      config.mode === 'both' ||
      config.mode === assignment

    if (!allowed) {
      throw new BadRequestException(
        `${assignment === 'batch' ? 'Batch' : 'Individual'} alarms are disabled for this module`,
      )
    }

    return config
  }

  private async verifyLog(moduleId: number, logId: number) {
    const log = await this.logRepo.findOne({
      where: {
        id: logId,
        module: { id: moduleId },
      },
      relations: ['module'],
    })

    if (!log) {
      throw new NotFoundException('Log record not found in this module')
    }

    return log
  }

  private normalizeAlarmInput(
    input: SaveAlarmInput,
    config: any,
  ) {
    const dueAt = new Date(input.dueAt)

    if (Number.isNaN(dueAt.getTime())) {
      throw new BadRequestException('Invalid alarm due date/time')
    }

    const leadValue = Math.round(
      this.clampNumber(
        input.leadValue,
        Number(config.defaultLeadValue || 0),
        0,
        999,
      ),
    )

    const leadUnit = input.leadUnit
      ? this.normalizeLeadUnit(input.leadUnit)
      : this.normalizeLeadUnit(config.defaultLeadUnit)

    const alarmAt = this.subtractLead(
      dueAt,
      leadValue,
      leadUnit,
    )

    const repeatMode = input.repeatMode
      ? this.normalizeRepeatMode(input.repeatMode)
      : null

    const repeatCount = repeatMode === 'count'
      ? Math.round(
          this.clampNumber(
            input.repeatCount,
            Number(config.repeatCount || 5),
            1,
            100,
          ),
        )
      : null

    return {
      dueAt,
      alarmAt,
      leadValue,
      leadUnit,
      message: String(input.message || '').trim() || null,
      repeatMode,
      repeatCount,
    }
  }

  async saveIndividual(input: SaveAlarmInput) {
    const config = await this.assertAlarmPolicy(
      Number(input.moduleId),
      'individual',
    )

    await this.verifyLog(
      Number(input.moduleId),
      Number(input.logId),
    )

    const normalized = this.normalizeAlarmInput(input, config)

    let alarm = await this.alarmRepo.findOne({
      where: {
        moduleId: Number(input.moduleId),
        logId: Number(input.logId),
      },
    })

    if (!alarm) {
      alarm = this.alarmRepo.create({
        moduleId: Number(input.moduleId),
        logId: Number(input.logId),
      })
    }

    Object.assign(alarm, normalized)
    alarm.status = 'ACTIVE'
    alarm.triggeredAt = null
    alarm.snoozedUntil = null
    alarm.dismissedAt = null

    return this.alarmRepo.save(alarm)
  }

  async saveBatch(body: {
    moduleId: number
    logIds: number[]
    dueAt: string | Date
    leadValue?: number
    leadUnit?: AlarmLeadUnit
    message?: string
    repeatMode?: AlarmRepeatMode | null
    repeatCount?: number | null
  }) {
    const moduleId = Number(body.moduleId)
    const config = await this.assertAlarmPolicy(moduleId, 'batch')

    const requestedIds = Array.from(
      new Set((body.logIds || []).map(Number).filter(Boolean)),
    )

    if (!requestedIds.length) {
      throw new BadRequestException('Select at least one log')
    }

    const logs = await this.logRepo.find({
      where: {
        id: In(requestedIds),
        module: { id: moduleId },
      },
      relations: ['module'],
    })

    if (logs.length !== requestedIds.length) {
      throw new BadRequestException('One or more selected logs are invalid')
    }

    const normalized = this.normalizeAlarmInput(
      {
        ...body,
        logId: requestedIds[0],
      },
      config,
    )

    const existing = await this.alarmRepo.find({
      where: {
        moduleId,
        logId: In(requestedIds),
      },
    })

    const existingByLog = new Map(
      existing.map(item => [Number(item.logId), item]),
    )

    const rows = requestedIds.map(logId => {
      const alarm = existingByLog.get(logId) || this.alarmRepo.create({
        moduleId,
        logId,
      })

      Object.assign(alarm, normalized)
      alarm.status = 'ACTIVE'
      alarm.triggeredAt = null
      alarm.snoozedUntil = null
      alarm.dismissedAt = null
      return alarm
    })

    return this.alarmRepo.save(rows)
  }

  async getByLog(logId: number) {
    return this.alarmRepo.findOne({
      where: { logId },
      relations: ['module', 'log'],
    })
  }

  async listModule(moduleId: number) {
    return this.alarmRepo.find({
      where: { moduleId },
      relations: ['module', 'log'],
      order: { alarmAt: 'ASC' },
    })
  }

  async listUser(userId: number) {
    const rows = await this.alarmRepo
      .createQueryBuilder('alarm')
      .leftJoinAndSelect('alarm.module', 'module')
      .leftJoinAndSelect('alarm.log', 'log')
      .where('module.userId = :userId', { userId })
      .andWhere('alarm.status NOT IN (:...done)', {
        done: ['DISMISSED', 'CANCELLED'],
      })
      .orderBy('alarm.alarmAt', 'ASC')
      .getMany()

    return rows
  }

  async dueForUser(userId: number) {
    const now = new Date()

    const rows = await this.alarmRepo
      .createQueryBuilder('alarm')
      .leftJoinAndSelect('alarm.module', 'module')
      .leftJoinAndSelect('alarm.log', 'log')
      .where('module.userId = :userId', { userId })
      .andWhere(
        new Brackets(qb => {
          qb.where(
            'alarm.status IN (:...readyStatuses) AND alarm.alarmAt <= :now',
            {
              readyStatuses: ['ACTIVE', 'TRIGGERED'],
              now,
            },
          ).orWhere(
            'alarm.status = :snoozedStatus AND alarm.snoozedUntil IS NOT NULL AND alarm.snoozedUntil <= :now',
            {
              snoozedStatus: 'SNOOZED',
              now,
            },
          )
        }),
      )
      .orderBy('alarm.alarmAt', 'ASC')
      .getMany()

    const changed: LogAlarm[] = []

    for (const alarm of rows) {
      if (alarm.status === 'ACTIVE' || alarm.status === 'SNOOZED') {
        alarm.status = 'TRIGGERED'
        alarm.triggeredAt = now
        alarm.snoozedUntil = null
        changed.push(alarm)
      }
    }

    if (changed.length) {
      await this.alarmRepo.save(changed)
    }

    const moduleIds = Array.from(
      new Set(rows.map(item => Number(item.moduleId))),
    )

    const configs = moduleIds.length
      ? await this.configRepo.find({
          where: { moduleId: In(moduleIds) },
        })
      : []

    const configMap = new Map(
      configs.map(config => [
        Number(config.moduleId),
        this.toClientConfig(config),
      ]),
    )

    return rows.map(alarm => ({
      ...alarm,
      config:
        configMap.get(Number(alarm.moduleId)) ||
        this.defaultConfig(Number(alarm.moduleId)),
    }))
  }

  async snooze(id: number, minutes: number) {
    const alarm = await this.alarmRepo.findOne({
      where: { id },
    })

    if (!alarm) {
      throw new NotFoundException('Alarm not found')
    }

    const safeMinutes = Math.round(
      this.clampNumber(minutes, 10, 1, 1440),
    )

    alarm.status = 'SNOOZED'
    alarm.snoozedUntil = new Date(
      Date.now() + safeMinutes * 60 * 1000,
    )

    return this.alarmRepo.save(alarm)
  }

  async dismiss(id: number) {
    const alarm = await this.alarmRepo.findOne({
      where: { id },
    })

    if (!alarm) {
      throw new NotFoundException('Alarm not found')
    }

    alarm.status = 'DISMISSED'
    alarm.dismissedAt = new Date()
    alarm.snoozedUntil = null

    return this.alarmRepo.save(alarm)
  }

  async cancel(id: number) {
    const alarm = await this.alarmRepo.findOne({
      where: { id },
    })

    if (!alarm) {
      throw new NotFoundException('Alarm not found')
    }

    alarm.status = 'CANCELLED'
    alarm.snoozedUntil = null
    return this.alarmRepo.save(alarm)
  }

  async updateAlarm(id: number, body: Partial<SaveAlarmInput>) {
    const alarm = await this.alarmRepo.findOne({
      where: { id },
    })

    if (!alarm) {
      throw new NotFoundException('Alarm not found')
    }

    const config = await this.getConfig(alarm.moduleId)

    const normalized = this.normalizeAlarmInput(
      {
        moduleId: alarm.moduleId,
        logId: alarm.logId,
        dueAt: body.dueAt || alarm.dueAt,
        leadValue: body.leadValue ?? alarm.leadValue,
        leadUnit: body.leadUnit || alarm.leadUnit,
        message: body.message ?? alarm.message ?? '',
        repeatMode:
          body.repeatMode === undefined
            ? alarm.repeatMode
            : body.repeatMode,
        repeatCount:
          body.repeatCount === undefined
            ? alarm.repeatCount
            : body.repeatCount,
      },
      config,
    )

    Object.assign(alarm, normalized)
    alarm.status = 'ACTIVE'
    alarm.triggeredAt = null
    alarm.snoozedUntil = null
    alarm.dismissedAt = null

    return this.alarmRepo.save(alarm)
  }
}
