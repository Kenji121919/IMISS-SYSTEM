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
  BadRequestException,
  InternalServerErrorException,
  UploadedFile,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common'

import {
  FileInterceptor,
  FilesInterceptor,
} from '@nestjs/platform-express'
import {
  diskStorage,
  memoryStorage,
} from 'multer'

import type { Response } from 'express'

import {
  join,
  extname,
  basename,
} from 'path'

import {
  existsSync,
} from 'fs'

import {
  mkdtemp,
  writeFile,
  readFile,
  rm,
} from 'fs/promises'

import {
  tmpdir,
} from 'os'

import {
  execFile,
} from 'child_process'

import {
  promisify,
} from 'util'

import { PDFDocument } from 'pdf-lib'

import { ModulesService } from './modules.service'

import { PdfTemplateService } from './services/pdf-template.service'


const execFileAsync =
  promisify(execFile)


@Controller('modules')
export class ModulesController {

  constructor(
    private service: ModulesService,

    private pdfTemplateService:
      PdfTemplateService,
  ) {}


  /* =========================================================
     REAL DOCUMENT PDF PREVIEW
     ---------------------------------------------------------
     Accepts an already-generated DOCX/XLSX file from Vue,
     converts it with LibreOffice headless, and returns PDF.
  ========================================================= */


  /* =========================================================
     MULTI-PAGE REAL PDF PREVIEW
     ---------------------------------------------------------
     Used by batch Excel printing.

     Each incoming XLSX is already a COMPLETE exact copy of the
     uploaded Excel template for one printable page.

     Flow:
     XLSX Page 1 -> LibreOffice -> PDF Page 1
     XLSX Page 2 -> LibreOffice -> PDF Page 2
     ...
     Then pdf-lib merges all converted PDFs into one document.
  ========================================================= */

  @Post('preview/pdf/multiple')
  @UseInterceptors(
    FilesInterceptor(
      'files',
      50,
      {
        storage:
          memoryStorage(),

        limits: {
          fileSize:
            25 * 1024 * 1024,
        },

        fileFilter(
          req,
          file,
          callback,
        ) {

          const lower =
            file.originalname
              .toLowerCase()

          const allowed =
            lower.endsWith('.xlsx') ||
            lower.endsWith('.xls') ||
            lower.endsWith('.docx')

          if (allowed) {
            callback(
              null,
              true,
            )
          } else {
            callback(
              new Error(
                'Only .docx, .xlsx, and .xls files can be previewed.',
              ),
              false,
            )
          }

        },
      },
    ),
  )
  async previewMultiplePdf(
    @UploadedFiles()
    files: Express.Multer.File[],

    @Res()
    res: Response,
  ) {

    if (
      !files ||
      !files.length
    ) {

      throw new BadRequestException(
        'No document pages received.',
      )

    }


    const tempDir =
      await mkdtemp(
        join(
          tmpdir(),
          'imiss-batch-preview-',
        ),
      )


    try {

      const officeExecutable =
        this.resolveLibreOfficeExecutable()


      const convertedPdfBuffers:
        Buffer[] = []


      /*
       * Convert every exact Excel template page separately.
       * We do this sequentially for predictable LibreOffice behavior.
       */
      for (
        let index = 0;
        index < files.length;
        index++
      ) {

        const file =
          files[index]


        const safeOriginalName =
          `${String(index + 1).padStart(3, '0')}-` +
          basename(
            file.originalname,
          ).replace(
            /[^a-zA-Z0-9._-]/g,
            '_',
          )


        const inputPath =
          join(
            tempDir,
            safeOriginalName,
          )


        await writeFile(
          inputPath,
          file.buffer,
        )


        const pageOutputDir =
          join(
            tempDir,
            `page-${index + 1}`,
          )


        const pageProfileDir =
          join(
            tempDir,
            `lo-profile-${index + 1}`,
          )


        /*
         * LibreOffice will create the output directory itself only
         * inconsistently, so use the temp root as the output folder.
         * Unique source names keep PDFs separate.
         */
        const profileUrl =
          'file:///' +
          pageProfileDir
            .replace(
              /\\/g,
              '/',
            )


        await execFileAsync(
          officeExecutable,
          [
            '--headless',
            '--nologo',
            '--nodefault',
            '--nofirststartwizard',
            `-env:UserInstallation=${profileUrl}`,
            '--convert-to',
            'pdf',
            '--outdir',
            tempDir,
            inputPath,
          ],
          {
            windowsHide:
              true,

            timeout:
              120000,
          },
        )


        const inputExt =
          extname(
            safeOriginalName,
          )


        const pdfName =
          basename(
            safeOriginalName,
            inputExt,
          ) + '.pdf'


        const pdfPath =
          join(
            tempDir,
            pdfName,
          )


        if (
          !existsSync(
            pdfPath,
          )
        ) {

          throw new Error(
            `LibreOffice did not create PDF page ${index + 1}.`,
          )

        }


        convertedPdfBuffers.push(
          await readFile(
            pdfPath,
          ),
        )

      }


      /*
       * Merge all converted page PDFs into ONE printable PDF.
       */
      const mergedPdf =
        await PDFDocument.create()


      for (
        const pdfBuffer
        of convertedPdfBuffers
      ) {

        const sourcePdf =
          await PDFDocument.load(
            pdfBuffer,
          )


        const copiedPages =
          await mergedPdf.copyPages(
            sourcePdf,
            sourcePdf.getPageIndices(),
          )


        for (
          const page
          of copiedPages
        ) {

          mergedPdf.addPage(
            page,
          )

        }

      }


      const mergedBytes =
        await mergedPdf.save()


      res.setHeader(
        'Content-Type',
        'application/pdf',
      )


      res.setHeader(
        'Content-Disposition',
        'inline; filename="IMISS-Batch-Preview.pdf"',
      )


      res.setHeader(
        'Cache-Control',
        'no-store',
      )


      return res.send(
        Buffer.from(
          mergedBytes,
        ),
      )

    } catch (err: any) {

      console.error(
        'Multi-page PDF preview conversion failed:',
        err,
      )


      throw new InternalServerErrorException(
        err?.message ||
        'Failed to convert batch documents to PDF.',
      )

    } finally {

      await rm(
        tempDir,
        {
          recursive:
            true,

          force:
            true,
        },
      ).catch(
        () => undefined,
      )

    }

  }


  @Post('preview/pdf')
  @UseInterceptors(
    FileInterceptor(
      'file',
      {
        storage:
          memoryStorage(),

        limits: {
          fileSize:
            25 * 1024 * 1024,
        },

        fileFilter(
          req,
          file,
          callback,
        ) {

          const lower =
            file.originalname
              .toLowerCase()

          const allowed =
            lower.endsWith('.docx') ||
            lower.endsWith('.xlsx') ||
            lower.endsWith('.xls')

          if (allowed) {
            callback(
              null,
              true,
            )
          } else {
            callback(
              new Error(
                'Only .docx, .xlsx, and .xls files can be previewed.',
              ),
              false,
            )
          }

        },
      },
    ),
  )
  async previewPdf(
    @UploadedFile()
    file: Express.Multer.File,

    @Res()
    res: Response,
  ) {

    if (!file) {
      throw new BadRequestException(
        'No document file received.',
      )
    }


    const tempDir =
      await mkdtemp(
        join(
          tmpdir(),
          'imiss-preview-',
        ),
      )


    try {

      const safeOriginalName =
        basename(
          file.originalname,
        ).replace(
          /[^a-zA-Z0-9._-]/g,
          '_',
        )


      const inputPath =
        join(
          tempDir,
          safeOriginalName,
        )


      await writeFile(
        inputPath,
        file.buffer,
      )


      const officeExecutable =
        this.resolveLibreOfficeExecutable()


      /*
       * Use a unique LibreOffice profile for every request.
       * This avoids "another instance is running" problems
       * when two users generate previews at the same time.
       */
      const profileDir =
        join(
          tempDir,
          'lo-profile',
        )


      const profileUrl =
        'file:///' +
        profileDir
          .replace(
            /\\/g,
            '/',
          )


      await execFileAsync(
        officeExecutable,
        [
          '--headless',
          '--nologo',
          '--nodefault',
          '--nofirststartwizard',
          `-env:UserInstallation=${profileUrl}`,
          '--convert-to',
          'pdf',
          '--outdir',
          tempDir,
          inputPath,
        ],
        {
          windowsHide:
            true,

          timeout:
            120000,
        },
      )


      const inputExt =
        extname(
          safeOriginalName,
        )


      const pdfName =
        basename(
          safeOriginalName,
          inputExt,
        ) + '.pdf'


      const pdfPath =
        join(
          tempDir,
          pdfName,
        )


      if (
        !existsSync(
          pdfPath,
        )
      ) {

        throw new Error(
          'LibreOffice did not create the PDF file.',
        )

      }


      const pdfBuffer =
        await readFile(
          pdfPath,
        )


      res.setHeader(
        'Content-Type',
        'application/pdf',
      )


      res.setHeader(
        'Content-Disposition',
        `inline; filename="${pdfName}"`,
      )


      res.setHeader(
        'Cache-Control',
        'no-store',
      )


      return res.send(
        pdfBuffer,
      )

    } catch (err: any) {

      console.error(
        'Document PDF preview conversion failed:',
        err,
      )


      throw new InternalServerErrorException(
        err?.message ||
        'Failed to convert document to PDF.',
      )

    } finally {

      /*
       * PDF was loaded into memory before res.send(),
       * so the temporary directory is safe to remove.
       */
      await rm(
        tempDir,
        {
          recursive:
            true,

          force:
            true,
        },
      ).catch(
        () => undefined,
      )

    }

  }


  private resolveLibreOfficeExecutable() {

    /*
     * Recommended:
     * Set LIBREOFFICE_PATH in your backend environment.
     *
     * Windows example:
     * C:\Program Files\LibreOffice\program\soffice.exe
     */

    const configured =
      process.env
        .LIBREOFFICE_PATH


    if (
      configured &&
      existsSync(
        configured,
      )
    ) {

      return configured

    }


    const windowsCandidates = [
      'C:\\Program Files\\LibreOffice\\program\\soffice.exe',
      'C:\\Program Files (x86)\\LibreOffice\\program\\soffice.exe',
    ]


    for (
      const candidate
      of windowsCandidates
    ) {

      if (
        existsSync(
          candidate,
        )
      ) {

        return candidate

      }

    }


    /*
     * Linux / PATH fallback.
     * On Linux this normally resolves to "libreoffice".
     * On Windows it works if LibreOffice was added to PATH.
     */
    return process.platform === 'win32'
      ? 'soffice.exe'
      : 'libreoffice'

  }


  /* =========================================================
     MODULE CRUD
  ========================================================= */

  @Post()
  create(
    @Body()
    body: any,
  ) {
    return this.service.create(
      body,
    )
  }


  @Get(':userId')
  findAll(
    @Param('userId')
    userId: number,
  ) {
    return this.service.findAll(
      Number(
        userId,
      ),
    )
  }


  @Get('single/:id')
  findOne(
    @Param('id')
    id: number,
  ) {
    return this.service.findOne(
      Number(
        id,
      ),
    )
  }


  @Put(':id')
  update(
    @Param('id')
    id: number,

    @Body()
    body: any,
  ) {
    return this.service.update(
      Number(
        id,
      ),
      body,
    )
  }


  @Delete(':id')
  delete(
    @Param('id')
    id: number,
  ) {
    return this.service.delete(
      Number(
        id,
      ),
    )
  }


  /* =========================================================
     LEGACY / BATCH EXCEL TEMPLATE
  ========================================================= */

  @Post(':id/template')
  @UseInterceptors(
    FileInterceptor(
      'file',
      {
        storage:
          diskStorage({
            destination:
              './uploads/templates',

            filename(
              req,
              file,
              callback,
            ) {

              const unique =
                Date.now() +
                '-' +
                Math.round(
                  Math.random() *
                  1000000,
                )

              callback(
                null,
                unique +
                extname(
                  file.originalname,
                ),
              )

            },
          }),

        fileFilter(
          req,
          file,
          callback,
        ) {

          if (
            file.originalname
              .toLowerCase()
              .endsWith('.xlsx') ||
            file.originalname
              .toLowerCase()
              .endsWith('.xls')
          ) {

            callback(
              null,
              true,
            )

          } else {

            callback(
              new Error(
                'Only Excel files are allowed.',
              ),
              false,
            )

          }

        },
      },
    ),
  )
  uploadTemplate(
    @Param('id')
    id: number,

    @UploadedFile()
    file: Express.Multer.File,
  ) {

    return this.service.saveTemplate(
      Number(
        id,
      ),
      file.filename,
      file.originalname,
      file.mimetype,
    )

  }


  @Get(':id/template')
  async getTemplate(
    @Param('id')
    id: number,

    @Res()
    res: Response,
  ) {

    const module: any =
      await this.service.findOne(
        Number(
          id,
        ),
      )


    if (
      !module ||
      !module.templateFile
    ) {

      throw new NotFoundException(
        'No template uploaded for this module',
      )

    }


    const filePath =
      join(
        process.cwd(),
        'uploads',
        'templates',
        module.templateFile,
      )


    if (
      !existsSync(
        filePath,
      )
    ) {

      throw new NotFoundException(
        'Template file missing on disk',
      )

    }


    res.setHeader(
      'Content-Type',
      module.templateFileMime ||
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    )


    res.setHeader(
      'Content-Disposition',
      `inline; filename="${module.templateFileName || module.templateFile}"`,
    )


    return res.sendFile(
      filePath,
    )

  }


  @Delete(':id/template')
  deleteLegacyTemplate(
    @Param('id')
    id: number,
  ) {

    return this.service
      .deleteLegacyTemplate(
        Number(
          id,
        ),
      )

  }


  /* =========================================================
     MULTI TEMPLATE SUPPORT
  ========================================================= */

  @Get(':id/templates')
  listTemplates(
    @Param('id')
    id: number,
  ) {

    return this.service.listTemplates(
      Number(
        id,
      ),
    )

  }


  @Post(':id/templates')
  @UseInterceptors(
    FileInterceptor(
      'file',
      {
        storage:
          diskStorage({
            destination:
              './uploads/templates',

            filename(
              req,
              file,
              callback,
            ) {

              const unique =
                Date.now() +
                '-' +
                Math.round(
                  Math.random() *
                  1000000,
                )

              callback(
                null,
                unique +
                extname(
                  file.originalname,
                ),
              )

            },
          }),

        fileFilter(
          req,
          file,
          callback,
        ) {

          const lower =
            file.originalname
              .toLowerCase()


          const okExcel =
            lower.endsWith(
              '.xlsx',
            ) ||
            lower.endsWith(
              '.xls',
            )


          const okDocx =
            lower.endsWith(
              '.docx',
            )


          const okPdf =
            lower.endsWith(
              '.pdf',
            )


          if (
            okExcel ||
            okDocx ||
            okPdf
          ) {

            callback(
              null,
              true,
            )

          } else {

            callback(
              new Error(
                'Only .xlsx, .xls, .docx, or .pdf files are allowed.',
              ),
              false,
            )

          }

        },
      },
    ),
  )
  uploadNewTemplate(
    @Param('id')
    id: number,

    @UploadedFile()
    file: Express.Multer.File,

    @Body('name')
    name: string,

    @Body('kind')
    kind:
      'excel' |
      'docx' |
      'pdf',

    @Body('printMode')
    printMode:
      'row' |
      'batch' = 'row',

    @Body('batchConfig')
    batchConfigRaw?: string,
  ) {

    let batchConfig: any =
      null

    if (batchConfigRaw) {
      try {
        batchConfig =
          JSON.parse(
            batchConfigRaw,
          )
      } catch {
        batchConfig =
          null
      }
    }

    return this.service.saveNewTemplate(
      Number(
        id,
      ),
      name,
      kind,
      file,
      printMode,
      batchConfig,
    )

  }


  @Get('templates/:templateId/file')
  async getTemplateFile(
    @Param('templateId')
    templateId: number,

    @Res()
    res: Response,
  ) {

    const tpl =
      await this.service.getTemplateById(
        Number(
          templateId,
        ),
      )


    if (!tpl) {

      throw new NotFoundException(
        'Template not found',
      )

    }


    const filePath =
      join(
        process.cwd(),
        'uploads',
        'templates',
        tpl.file,
      )


    if (
      !existsSync(
        filePath,
      )
    ) {

      throw new NotFoundException(
        'Template file missing on disk',
      )

    }


    res.setHeader(
      'Content-Type',
      tpl.fileMime ||
      'application/octet-stream',
    )


    res.setHeader(
      'Content-Disposition',
      `inline; filename="${tpl.fileName || tpl.file}"`,
    )


    return res.sendFile(
      filePath,
    )

  }



  /* =========================================================
     EXACT BATCH PDF
     ---------------------------------------------------------
     Uses the uploaded PDF itself as the page template.
     No LibreOffice is involved.
  ========================================================= */

  /* =========================================================
     GENERIC EXACT BATCH PDF
     ---------------------------------------------------------
     Uses any uploaded PDF page as the exact form background.
     Field coordinates are configured visually in Manage Modules.
  ========================================================= */

  @Post('templates/:templateId/batch-pdf')
  async generateBatchPdf(
    @Param('templateId')
    templateId: number,

    @Body()
    body: {
      records: Array<{
        id?: number
        data?: Record<string, any>
      }>
    },

    @Res()
    res: Response,
  ) {

    const generated =
      await this.pdfTemplateService
        .generateMappedPdf(
          Number(
            templateId,
          ),

          Array.isArray(
            body?.records,
          )
            ? body.records
            : [],
        )


    res.setHeader(
      'Content-Type',
      'application/pdf',
    )


    res.setHeader(
      'Content-Disposition',
      `inline; filename="${generated.fileName}"`,
    )


    res.setHeader(
      'Cache-Control',
      'no-store',
    )


    return res.send(
      generated.buffer,
    )

  }


  @Get('templates/:templateId/config')
  async getTemplateConfig(
    @Param('templateId')
    templateId: number,
  ) {

    const tpl =
      await this.service.getTemplateById(
        Number(
          templateId,
        ),
      )


    if (!tpl) {

      throw new NotFoundException(
        'Template not found',
      )

    }


    return tpl

  }


  @Put('templates/:templateId/config')
  async updateTemplateConfig(
    @Param('templateId')
    templateId: number,

    @Body()
    body: {
      name?: string

      printMode?:
        'row' |
        'batch'

      batchConfig?: any
    },
  ) {

    const updated =
      await this.service
        .updateTemplateConfig(
          Number(
            templateId,
          ),
          body,
        )


    if (!updated) {

      throw new NotFoundException(
        'Template not found',
      )

    }


    return updated

  }


  @Delete('templates/:templateId')
  deleteTemplate(
    @Param('templateId')
    templateId: number,
  ) {

    return this.service.deleteTemplate(
      Number(
        templateId,
      ),
    )

  }

}
