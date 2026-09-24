import {
  ref,
  computed
} from 'vue'

import api from '@/api/axios'

import PizZip from 'pizzip'

import Docxtemplater from 'docxtemplater'

import { saveAs } from 'file-saver'


export function useRowPrint({
  moduleRef,
  columnsRef,
  notify,
  toTag,
  convertGeneratedFileToPdf,
  revokePreviewUrl,
  preview
}) {


  const filling =
    ref(false)

  let docxPreviewRequestId =
    0

  const showDocxPreview =
    ref(false)

  const generatedDocxBlob =
    ref(null)

  const generatedDocxName =
    ref('')

  const docxPreviewPdfUrl =
    ref('')

  const rowPdfGenerating =
    ref(false)

  const showRowPrintChooser =
    ref(false)

  const rowPrintChooserLog =
    ref(null)

  const rowDocxTemplates = computed(() =>
    (moduleRef.value?.templates || []).filter(
      t =>
        String(t.kind || '').toLowerCase() === 'docx' &&
        String(t.printMode || 'row').toLowerCase() !== 'batch'
    )
  )

  const docxTemplate = computed(() =>
    rowDocxTemplates.value[0] || null
  )

  const rowPdfTemplates = computed(() =>
    (moduleRef.value?.templates || []).filter(
      t =>
        String(t.kind || '').toLowerCase() === 'pdf' &&
        String(t.printMode || 'batch').toLowerCase() === 'row'
    )
  )

  const rowPrintTemplates = computed(() => [
    ...rowDocxTemplates.value,
    ...rowPdfTemplates.value
  ])

  /* ================= ROW FILL & PRINT ================= */

  const closeRowPrintChooser = () => {
    showRowPrintChooser.value = false
    rowPrintChooserLog.value = null
  }

  const openRowFillAndPrint = async (
    log
  ) => {
    if (
      !rowPrintTemplates.value.length
    ) {
      notify(
        'No per-row Fill & Print template is configured',
        'error'
      )
      return
    }

    /*
     * One template = open immediately.
     * Multiple templates = let the user choose the form.
     */
    if (
      rowPrintTemplates.value.length === 1
    ) {
      await runRowPrintTemplate(
        rowPrintTemplates.value[0],
        log
      )
      return
    }

    rowPrintChooserLog.value =
      log

    showRowPrintChooser.value =
      true
  }

  const useRowPrintTemplate = async (
    template
  ) => {
    const log =
      rowPrintChooserLog.value

    closeRowPrintChooser()

    if (!log) {
      return
    }

    await runRowPrintTemplate(
      template,
      log
    )
  }

  const runRowPrintTemplate = async (
    template,
    log
  ) => {
    const kind =
      String(
        template?.kind ||
        ''
      ).toLowerCase()

    if (kind === 'pdf') {
      await generateRowPdf(
        template,
        log
      )
      return
    }

    if (kind === 'docx') {
      await fillAndPrint(
        log,
        template
      )
      return
    }

    notify(
      'Unsupported Fill & Print template type',
      'error'
    )
  }

  const generateRowPdf = async (
    template,
    log
  ) => {
    if (
      !template?.id ||
      !log
    ) {
      return
    }

    rowPdfGenerating.value =
      true

    try {
      const selectedRecord = {
        id:
          log.id,

        data:
          typeof structuredClone === 'function'
            ? structuredClone(
                log.data || {}
              )
            : JSON.parse(
                JSON.stringify(
                  log.data || {}
                )
              )
      }

      /*
       * Reuse the exact mapped-PDF renderer.
       * Supplying one record makes this a per-row form.
       */
      const res =
        await api.post(
          `/modules/templates/${template.id}/batch-pdf`,
          {
            records: [
              selectedRecord
            ]
          },
          {
            responseType:
              'blob'
          }
        )

      const pdfBlob =
        new Blob(
          [res.data],
          {
            type:
              'application/pdf'
          }
        )

      revokePreviewUrl(
        preview.batchPreviewPdfUrl.value
      )

      preview.batchPreviewPdfUrl.value =
        URL.createObjectURL(
          pdfBlob
        )

      preview.batchDownloadBlob.value =
        pdfBlob

      const cleanName =
        String(
          template.name ||
          'Fill_Print_Form'
        ).replace(
          /[^a-zA-Z0-9_-]+/g,
          '_'
        )

      preview.batchDownloadFileName.value =
        `${cleanName}_${
          log.id ?? 'record'
        }.pdf`

      preview.batchDownloadLabel.value =
        'Download PDF'

      preview.batchPreviewRecordCount.value =
        1

      preview.batchPreviewPages.value = [
        [
          selectedRecord
        ]
      ]

      preview.documentPreviewTitle.value =
        template.name ||
        'Fill & Print Preview'

      preview.documentPreviewInfo.value =
        'This is the exact mapped PDF form for the selected log row.'

      preview.showBatchPreview.value =
        true

      notify(
        'PDF Fill & Print preview ready',
        'success'
      )
    } catch (err) {
      console.error(
        'Row PDF generation failed:',
        err
      )

      notify(
        'Failed to generate the PDF Fill & Print form',
        'error'
      )
    } finally {
      rowPdfGenerating.value =
        false
    }
  }


  /* ================= DOCX FILL & PREVIEW ================= */

  const fillAndPrint = async (
    log,
    templateOverride = null
  ) => {

    const selectedTemplate =
      templateOverride ||
      docxTemplate.value

    if (!selectedTemplate) return

    /*
     * Snapshot the CLICKED row immediately.
     *
     * Do not keep reading the reactive `log` object after async work starts.
     * This guarantees that clicking row 1 prints row 1, and clicking row 2
     * prints row 2 even if the table re-renders, sorts, filters, or paginates.
     */
    const selectedLogId =
      log?.id

    let selectedLogData = {}

    try {
      selectedLogData =
        typeof structuredClone === 'function'
          ? structuredClone(
              log?.data || {}
            )
          : JSON.parse(
              JSON.stringify(
                log?.data || {}
              )
            )
    } catch {
      selectedLogData = {
        ...(log?.data || {})
      }
    }

    /*
     * Every click gets its own request id.
     * If an older conversion finishes after a newer click, it is ignored.
     */
    const requestId =
      ++docxPreviewRequestId

    filling.value = true

    /*
     * Close the previous preview first so the user can never mistake
     * an old document for the newly clicked row.
     */
    showDocxPreview.value = false

    revokePreviewUrl(
      docxPreviewPdfUrl.value
    )

    docxPreviewPdfUrl.value = ''

    generatedDocxBlob.value = null
    generatedDocxName.value = ''

    try {

      /* -----------------------------------------
         1. DOWNLOAD ORIGINAL DOCX TEMPLATE
      ----------------------------------------- */

      const res = await api.get(
        `/modules/templates/${selectedTemplate.id}/file`,
        {
          responseType: 'arraybuffer'
        }
      )

      /*
       * Another row may have been clicked while the template was loading.
       */
      if (
        requestId !==
        docxPreviewRequestId
      ) {
        return
      }

      /* -----------------------------------------
         2. LOAD TEMPLATE
      ----------------------------------------- */

      const zip =
        new PizZip(
          res.data
        )

      const doc =
        new Docxtemplater(
          zip,
          {
            paragraphLoop: true,
            linebreaks: true
          }
        )

      /* -----------------------------------------
         3. BUILD DATA FROM THE CLICKED ROW SNAPSHOT
      ----------------------------------------- */

      const data = {}

      columnsRef.value.forEach(
        col => {

          const value =
            selectedLogData?.[
              col.name
            ]

          data[
            toTag(
              col.name
            )
          ] =
            value === null ||
            value === undefined ||
            value === '-'
              ? ''
              : value

        }
      )

      /*
       * Optional template tag if you ever want to use {LogId}.
       */
      data.LogId =
        selectedLogId ?? ''

      console.log(
        'FILL & PRINT SELECTED ROW:',
        {
          id:
            selectedLogId,

          data:
            selectedLogData
        }
      )

      /* -----------------------------------------
         4. FILL DOCX TEMPLATE
      ----------------------------------------- */

      doc.render(
        data
      )

      /* -----------------------------------------
         5. GENERATE FILLED DOCX
      ----------------------------------------- */

      const out =
        doc
          .getZip()
          .generate({
            type: 'blob',

            mimeType:
              'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
          })

      /*
       * Check again before replacing the preview state.
       */
      if (
        requestId !==
        docxPreviewRequestId
      ) {
        return
      }

      generatedDocxBlob.value =
        out

      const safeName =
        (
          selectedTemplate.name ||
          'Form'
        ).replace(
          /[^a-zA-Z0-9-_ ]/g,
          ''
        )

      generatedDocxName.value =
        `${safeName}-${selectedLogId ?? 'record'}.docx`

      /* -----------------------------------------
         6. CONVERT THIS CLICKED ROW'S DOCX TO PDF
      ----------------------------------------- */

      const previewUrl =
        await convertGeneratedFileToPdf(
          out,
          generatedDocxName.value
        )

      /*
       * If another row was clicked while LibreOffice/PDF conversion
       * was running, discard this old preview.
       */
      if (
        requestId !==
        docxPreviewRequestId
      ) {

        revokePreviewUrl(
          previewUrl
        )

        return
      }

      docxPreviewPdfUrl.value =
        previewUrl

      /* -----------------------------------------
         7. OPEN THE CORRECT ROW PREVIEW
      ----------------------------------------- */

      showDocxPreview.value =
        true

      notify(
        `Preview opened for record ${selectedLogId ?? ''}`.trim(),
        'success'
      )

    } catch (err) {

      if (
        requestId !==
        docxPreviewRequestId
      ) {
        return
      }

      console.error(
        'DOCX preview error:',
        err
      )

      notify(
        'Failed to generate document preview',
        'error'
      )

      showDocxPreview.value =
        false

    } finally {

      if (
        requestId ===
        docxPreviewRequestId
      ) {
        filling.value =
          false
      }

    }

  }


  /* ================= DOWNLOAD FILLED DOCX ================= */

  const downloadFilledDocx = () => {

    if (!generatedDocxBlob.value) return

    saveAs(

      generatedDocxBlob.value,

      generatedDocxName.value || 'document.docx'

    )

  }



  /* ================= CLOSE DOCX PREVIEW ================= */

  const closeDocxPreview = () => {
    showDocxPreview.value = false
    generatedDocxBlob.value = null
    generatedDocxName.value = ''

    revokePreviewUrl(docxPreviewPdfUrl.value)
    docxPreviewPdfUrl.value = ''
  }



  /* ================= PRINT DOCX PREVIEW ================= */

  const printFilledDocx = () => {
    if (!docxPreviewPdfUrl.value) {
      notify('PDF preview is not ready yet', 'error')
      return
    }

    const frame = document.querySelector(
      '.docx-preview-body .real-document-frame'
    )

    try {
      frame?.contentWindow?.focus()
      frame?.contentWindow?.print()
    } catch {
      const win = window.open(docxPreviewPdfUrl.value, '_blank')
      if (!win) {
        notify('Please allow pop-ups to print the document', 'error')
      }
    }
  }

  return {
    filling, showDocxPreview, generatedDocxBlob, generatedDocxName, docxPreviewPdfUrl, rowPdfGenerating, showRowPrintChooser, rowPrintChooserLog, rowDocxTemplates, docxTemplate, rowPdfTemplates, rowPrintTemplates, closeRowPrintChooser, openRowFillAndPrint, useRowPrintTemplate, runRowPrintTemplate, generateRowPdf, fillAndPrint, downloadFilledDocx, closeDocxPreview, printFilledDocx
  }

}
