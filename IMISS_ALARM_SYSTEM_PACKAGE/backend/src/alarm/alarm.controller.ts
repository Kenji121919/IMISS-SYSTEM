import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  Res,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'
import { diskStorage } from 'multer'
import type { Response } from 'express'
import { extname } from 'path'
import { mkdirSync } from 'fs'

import { AlarmService } from './alarm.service'

@Controller('alarms')
export class AlarmController {
  constructor(
    private readonly alarmService: AlarmService,
  ) {}

  @Get('due')
  due(
    @Query('userId') userId: string,
  ) {
    return this.alarmService.dueForUser(
      Number(userId),
    )
  }

  @Get('user/:userId')
  listUser(
    @Param('userId') userId: string,
  ) {
    return this.alarmService.listUser(
      Number(userId),
    )
  }

  @Get('module/:moduleId/config')
  getConfig(
    @Param('moduleId') moduleId: string,
  ) {
    return this.alarmService.getConfig(
      Number(moduleId),
    )
  }

  @Put('module/:moduleId/config')
  saveConfig(
    @Param('moduleId') moduleId: string,
    @Body() body: any,
  ) {
    return this.alarmService.saveConfig(
      Number(moduleId),
      body,
    )
  }

  @Post('module/:moduleId/media')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination(req, file, callback) {
          const dir = './uploads/alarms'
          mkdirSync(dir, { recursive: true })
          callback(null, dir)
        },
        filename(req, file, callback) {
          const unique =
            Date.now() + '-' +
            Math.round(Math.random() * 1000000)

          callback(
            null,
            unique + extname(file.originalname).toLowerCase(),
          )
        },
      }),
      limits: {
        fileSize: 25 * 1024 * 1024,
      },
      fileFilter(req, file, callback) {
        const lower = file.originalname.toLowerCase()
        const allowed =
          lower.endsWith('.mp3') ||
          lower.endsWith('.wav') ||
          lower.endsWith('.ogg') ||
          lower.endsWith('.mp4') ||
          lower.endsWith('.webm') ||
          lower.endsWith('.m4a')

        if (allowed) {
          callback(null, true)
        } else {
          callback(
            new Error(
              'Only MP3, WAV, OGG, M4A, MP4, or WebM alarm media is allowed.',
            ),
            false,
          )
        }
      },
    }),
  )
  uploadMedia(
    @Param('moduleId') moduleId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.alarmService.saveMedia(
      Number(moduleId),
      file,
    )
  }

  @Delete('module/:moduleId/media')
  removeMedia(
    @Param('moduleId') moduleId: string,
  ) {
    return this.alarmService.removeMedia(
      Number(moduleId),
    )
  }

  @Get('module/:moduleId/media')
  async getMedia(
    @Param('moduleId') moduleId: string,
    @Res() res: Response,
  ) {
    const media = await this.alarmService.getMediaFile(
      Number(moduleId),
    )

    res.setHeader('Content-Type', media.mime)
    res.setHeader(
      'Content-Disposition',
      `inline; filename="${media.fileName}"`,
    )
    res.setHeader('Cache-Control', 'no-store')

    return res.sendFile(media.filePath)
  }

  @Get('module/:moduleId')
  listModule(
    @Param('moduleId') moduleId: string,
  ) {
    return this.alarmService.listModule(
      Number(moduleId),
    )
  }

  @Get('log/:logId')
  getByLog(
    @Param('logId') logId: string,
  ) {
    return this.alarmService.getByLog(
      Number(logId),
    )
  }

  @Post('batch')
  saveBatch(
    @Body() body: any,
  ) {
    return this.alarmService.saveBatch(body)
  }

  @Post()
  saveIndividual(
    @Body() body: any,
  ) {
    return this.alarmService.saveIndividual(body)
  }

  @Put(':id')
  updateAlarm(
    @Param('id') id: string,
    @Body() body: any,
  ) {
    return this.alarmService.updateAlarm(
      Number(id),
      body,
    )
  }

  @Put(':id/snooze')
  snooze(
    @Param('id') id: string,
    @Body('minutes') minutes: number,
  ) {
    return this.alarmService.snooze(
      Number(id),
      Number(minutes),
    )
  }

  @Put(':id/dismiss')
  dismiss(
    @Param('id') id: string,
  ) {
    return this.alarmService.dismiss(
      Number(id),
    )
  }

  @Delete(':id')
  cancel(
    @Param('id') id: string,
  ) {
    return this.alarmService.cancel(
      Number(id),
    )
  }
}
