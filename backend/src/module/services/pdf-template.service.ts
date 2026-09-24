import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common'

import {
  join,
} from 'path'

import {
  existsSync,
} from 'fs'

import {
  readFile,
} from 'fs/promises'

import {
  PDFDocument,
} from 'pdf-lib'

import {
  ModulesService,
} from '../modules.service'


export interface PdfPrintRecord {
  id?: number
  data?: Record<string, any>
}


export interface GeneratedMappedPdf {
  buffer: Buffer
  fileName: string
}


@Injectable()
export class PdfTemplateService {

  constructor(
    private readonly modulesService:
      ModulesService,
  ) {}


  async generateMappedPdf(
    templateId: number,
    records: PdfPrintRecord[],
  ): Promise<GeneratedMappedPdf> {

    const tpl =
      await this.modulesService
        .getTemplateById(
          Number(
            templateId,
          ),
        )


    if (
      !tpl ||
      String(
        tpl.kind,
      ).toLowerCase() !==
        'pdf'
    ) {

      throw new NotFoundException(
        'PDF template not found',
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
        'PDF template file missing on disk',
      )

    }


    const safeRecords =
      Array.isArray(
        records,
      )
        ? records
        : []


    if (
      !safeRecords.length
    ) {

      throw new BadRequestException(
        'No records supplied for PDF generation.',
      )

    }


    const cfg: any =
      tpl.batchConfig ||
      {}


    const fields =
      Array.isArray(
        cfg.fields,
      )
        ? cfg.fields
        : []


    if (
      !fields.length
    ) {

      throw new BadRequestException(
        'This PDF template has no field mappings.',
      )

    }


    /*
     * Per-row PDF templates always render one record per page.
     * Batch templates use the configured recordsPerPage value.
     */
    const isRowMode =
      String(
        tpl.printMode ||
        'batch',
      ).toLowerCase() ===
      'row'


    const recordsPerPage =
      isRowMode
        ? 1
        : Math.max(
            1,
            Number(
              cfg.recordsPerPage,
            ) || 1,
          )


    const recordGapY =
      isRowMode
        ? 0
        : (
            Number(
              cfg.recordGapY,
            ) || 0
          )


    const templatePage =
      Math.max(
        1,
        Number(
          cfg.templatePage,
        ) || 1,
      )


    const templateBytes =
      await readFile(
        filePath,
      )


    const sourcePdf =
      await PDFDocument.load(
        templateBytes,
      )


    if (
      sourcePdf.getPageCount() <
      templatePage
    ) {

      throw new BadRequestException(
        `Template page ${templatePage} does not exist in this PDF.`,
      )

    }


    const outputPdf =
      await PDFDocument.create()


    const font =
      await outputPdf.embedFont(
        'Helvetica',
      )


    const totalPages =
      Math.ceil(
        safeRecords.length /
        recordsPerPage,
      )


    const recordValue = (
      record: PdfPrintRecord,
      field: any,
    ) => {

      const sourceType =
        String(
          field?.sourceType ||
          'column',
        )


      if (
        sourceType ===
        'fixed'
      ) {

        return String(
          field?.fixedValue ??
          '',
        )

      }


      if (
        sourceType ===
        'printDate'
      ) {

        return new Date()
          .toLocaleDateString(
            'en-PH',
            {
              year:
                'numeric',

              month:
                '2-digit',

              day:
                '2-digit',

              timeZone:
                'Asia/Manila',
            },
          )

      }


      const column =
        String(
          field?.column ||
          '',
        )


      if (
        !column
      ) {
        return ''
      }


      const value =
        record?.data?.[
          column
        ]


      return value === null ||
        value === undefined
        ? ''
        : String(
            value,
          )

    }


    const drawField = (
      page: any,
      field: any,
      record: PdfPrintRecord,
      recordIndex: number,
    ) => {

      const raw =
        recordValue(
          record,
          field,
        )


      const prefix =
        String(
          field?.prefix ||
          '',
        )


      const text =
        `${prefix}${raw}`


      if (
        !text
      ) {
        return
      }


      const repeatPerRecord =
        field
          ?.repeatPerRecord !==
        false


      const baseX =
        Number(
          field?.x,
        ) || 0


      const originalY =
        Number(
          field?.y,
        ) || 0


      const shiftedY =
        repeatPerRecord
          ? originalY -
            recordIndex *
              recordGapY
          : originalY


      const boxMode =
        String(
          field?.boxMode ||
          'baseline',
        )


      const width =
        Math.max(
          0,
          Number(
            field?.width,
          ) || 0,
        )


      const height =
        Math.max(
          0,
          Number(
            field?.height,
          ) || 0,
        )


      let size =
        Math.max(
          4,
          Number(
            field?.fontSize,
          ) || 8.5,
        )


      /*
       * Shrink text until it fits inside the configured box width.
       */
      if (
        width > 0
      ) {

        while (
          size > 4 &&
          font.widthOfTextAtSize(
            text,
            size,
          ) > width
        ) {

          size -=
            0.25

        }

      }


      const textWidth =
        font.widthOfTextAtSize(
          text,
          size,
        )


      const align =
        String(
          field?.align ||
          'left',
        )


      let x =
        baseX


      if (
        width > 0 &&
        align ===
          'center'
      ) {

        x =
          baseX +
          Math.max(
            0,
            (
              width -
              textWidth
            ) / 2,
          )

      } else if (
        width > 0 &&
        align ===
          'right'
      ) {

        x =
          baseX +
          Math.max(
            0,
            width -
            textWidth,
          )

      }


      /*
       * Visual mappings store Y as the TOP edge of the box.
       * pdf-lib drawText() expects a text baseline, so center the
       * visible glyph height inside the configured box.
       */
      let y =
        shiftedY


      if (
        boxMode ===
          'topLeft'
      ) {

        const effectiveHeight =
          height > 0
            ? height
            : Math.max(
                size,
                4,
              )


        let textHeight =
          size


        try {

          textHeight =
            font.heightAtSize(
              size,
              {
                descender:
                  false,
              },
            )

        } catch {

          textHeight =
            size * 0.8

        }


        y =
          shiftedY -
          Math.max(
            textHeight,
            (
              effectiveHeight +
              textHeight
            ) / 2,
          )

      }


      page.drawText(
        text,
        {
          x,
          y,
          size,
          font,
        },
      )

    }


    for (
      let pageIndex = 0;
      pageIndex <
        totalPages;
      pageIndex++
    ) {

      const [
        outputPage,
      ] =
        await outputPdf.copyPages(
          sourcePdf,
          [
            templatePage -
            1,
          ],
        )


      outputPdf.addPage(
        outputPage,
      )


      const pageRecords =
        safeRecords.slice(
          pageIndex *
            recordsPerPage,

          (
            pageIndex +
            1
          ) *
            recordsPerPage,
        )


      const staticFields =
        fields.filter(
          (field: any) =>
            field
              ?.repeatPerRecord ===
            false,
        )


      for (
        const field
        of staticFields
      ) {

        drawField(
          outputPage,
          field,
          pageRecords[0] ||
            {},
          0,
        )

      }


      const repeatingFields =
        fields.filter(
          (field: any) =>
            field
              ?.repeatPerRecord !==
            false,
        )


      pageRecords.forEach(
        (
          record,
          recordIndex,
        ) => {

          for (
            const field
            of repeatingFields
          ) {

            drawField(
              outputPage,
              field,
              record,
              recordIndex,
            )

          }

        },
      )

    }


    const pdfBytes =
      await outputPdf.save()


    const cleanName =
      String(
        tpl.name ||
        (
          isRowMode
            ? 'Fill_Print_Form'
            : 'Batch_Form'
        ),
      ).replace(
        /[^a-zA-Z0-9_-]+/g,
        '_',
      )


    return {
      buffer:
        Buffer.from(
          pdfBytes,
        ),

      fileName:
        `${cleanName}.pdf`,
    }

  }

}
