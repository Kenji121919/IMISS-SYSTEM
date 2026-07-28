import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Res,
  NotFoundException,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common'

import { FileInterceptor } from '@nestjs/platform-express'
import { diskStorage } from 'multer'
import type { Response } from 'express'
import { join } from 'path'
import { existsSync } from 'fs'
import { extname } from 'path'

import { ModulesService } from './modules.service'

@Controller('modules')
export class ModulesController {
  constructor(private service: ModulesService) {}

  @Post()
  create(@Body() body: any) {
    return this.service.create(body)
  }

  @Get(':userId')
  findAll(@Param('userId') userId: number) {
    return this.service.findAll(Number(userId))
  }

  @Get('single/:id')
  findOne(@Param('id') id: number) {
    return this.service.findOne(Number(id))
  }

  @Put(':id')
  update(@Param('id') id: number, @Body() body: any) {
    return this.service.update(Number(id), body)
  }

  @Delete(':id')
  delete(@Param('id') id: number) {
    return this.service.delete(Number(id))
  }

  // ================= UPLOAD TEMPLATE =================
  @Post(':id/template')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads/templates',

        filename: (req, file, callback) => {
          const unique =
            Date.now() +
            '-' +
            Math.round(Math.random() * 1000000)

          callback(
            null,
            unique + extname(file.originalname),
          )
        },
      }),

      fileFilter(req, file, callback) {
        if (
          file.originalname.endsWith('.xlsx') ||
          file.originalname.endsWith('.xls')
        ) {
          callback(null, true)
        } else {
          callback(new Error('Only Excel files are allowed.'), false)
        }
      },
    }),
  )
  uploadTemplate(
    @Param('id') id: number,
    @UploadedFile() file: Express.Multer.File
  ) {
    return this.service.saveTemplate(
      Number(id),
      file.filename,
      file.originalname,
      file.mimetype,
    )
  }

  // ================= FETCH TEMPLATE (for re-mapping / fill) =================
  @Get(':id/template')
  async getTemplate(@Param('id') id: number, @Res() res: Response) {
    const module: any = await this.service.findOne(Number(id))
    if (!module || !module.templateFile) {
      throw new NotFoundException('No template uploaded for this module')
    }

    const filePath = join(process.cwd(), 'uploads', 'templates', module.templateFile)
    if (!existsSync(filePath)) {
      throw new NotFoundException('Template file missing on disk')
    }

    res.setHeader(
      'Content-Type',
      module.templateFileMime || 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    )
    res.setHeader(
      'Content-Disposition',
      `inline; filename="${module.templateFileName || module.templateFile}"`
    )
    return res.sendFile(filePath)
  }
}