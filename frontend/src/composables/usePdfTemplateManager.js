import {
  ref,
  computed,
  nextTick,
  watch
} from 'vue'

import api from '@/api/axios'

import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs'
import pdfWorker from 'pdfjs-dist/legacy/build/pdf.worker.min.mjs?url'

pdfjsLib.GlobalWorkerOptions.workerSrc =
  pdfWorker


export function usePdfTemplateManager(
  props,
  emit
) {

  const pdfTemplates = computed(() =>
    (
      props.moduleData?.templates ||
      []
    ).filter(
      template =>
        String(
          template.kind ||
          ''
        ).toLowerCase() ===
        'pdf'
    )
  )


  const showPdfModal = ref(false)

  const notify = (
    message,
    type = 'success'
  ) => {
    emit(
      'notify',
      {
        message,
        type
      }
    )
  }

  const newPdfName = ref('PDF Form')
  const newPdfPrintMode = ref('batch')
  const pendingPdfFile = ref(null)

  const editingPdfTemplateId = ref(null)
  const editingPdfFileName = ref('')
  const savingPdfTemplateConfig = ref(false)

  const pdfMapperCanvas = ref(null)
  const pdfPageReady = ref(false)
  const pdfPreviewLoading = ref(false)
  const pdfPreviewError = ref('')
  const pdfRenderedViewport = ref(null)

  const pdfPreviewBytes = ref(null)
  const pdfMapperZoom = ref(1)
  const selectedPdfMappingId = ref(null)
  const pdfBoxInteraction = ref(null)
  const pdfRecordBlockInteraction = ref(null)

  const pdfSampleRecords = ref([])
  const pdfSampleIndex = ref(0)
  const pdfSampleLoading = ref(false)

  const defaultPdfBatchConfig = () => ({
    source: 'filtered',
    recordsPerPage: 9,
    recordGapY: 0,
    templatePage: 1,
    firstAnchor: null,
    secondAnchor: null,
    fields: []
  })

  const pdfBatchConfig = ref(
    defaultPdfBatchConfig()
  )

  const onPdfPrintModeChange = () => {
    if (
      newPdfPrintMode.value ===
      'row'
    ) {
      pdfBatchConfig.value.recordsPerPage = 1
      pdfBatchConfig.value.recordGapY = 0
      pdfBatchConfig.value.firstAnchor = null
      pdfBatchConfig.value.secondAnchor = null
    } else if (
      Number(
        pdfBatchConfig.value.recordsPerPage
      ) <= 1
    ) {
      pdfBatchConfig.value.recordsPerPage = 9
    }
  }

  const defaultPdfNewMapping = () => ({
    sourceType: 'column',
    column: '',
    fixedValue: '',
    prefix: '',
    fontSize: 8.5,
    width: 120,
    height: 16,
    align: 'left',
    repeatPerRecord: true
  })

  const pdfNewMapping = ref(
    defaultPdfNewMapping()
  )

  const pdfMappingArmed = ref(false)

  const resetPdfMapper = () => {
    pdfPageReady.value = false
    pdfPreviewLoading.value = false
    pdfPreviewError.value = ''
    pdfRenderedViewport.value = null
    pdfPreviewBytes.value = null
    pdfMapperZoom.value = 1
    selectedPdfMappingId.value = null
    pdfBoxInteraction.value = null
    pdfRecordBlockInteraction.value = null
    pdfMappingArmed.value = false
    pdfSampleRecords.value = []
    pdfSampleIndex.value = 0
    pdfSampleLoading.value = false
    pdfNewMapping.value =
      defaultPdfNewMapping()
  }

  const renderPdfMapperPreview = async (
    source = null
  ) => {
    pdfPreviewLoading.value = true
    pdfPreviewError.value = ''
    pdfPageReady.value = false

    try {
      let data

      if (source) {

        if (
          source instanceof Uint8Array
        ) {
          data =
            source.slice()

        } else if (
          source instanceof ArrayBuffer
        ) {
          data =
            new Uint8Array(
              source.slice(0)
            )

        } else if (
          ArrayBuffer.isView(
            source
          )
        ) {
          data =
            new Uint8Array(
              source.buffer.slice(
                source.byteOffset,
                source.byteOffset +
                source.byteLength
              )
            )

        } else if (
          typeof source.arrayBuffer ===
          'function'
        ) {
          const buffer =
            await source.arrayBuffer()

          data =
            new Uint8Array(
              buffer
            )

        } else {
          throw new Error(
            `Unsupported PDF response type: ${
              Object.prototype.toString.call(
                source
              )
            }`
          )
        }

        pdfPreviewBytes.value =
          data.slice()

      } else if (
        pdfPreviewBytes.value
      ) {

        data =
          pdfPreviewBytes.value.slice()

      } else {

        throw new Error(
          'No PDF data was received.'
        )

      }

      if (
        !data ||
        !data.byteLength
      ) {
        throw new Error(
          'The saved PDF file is empty.'
        )
      }

      const isPdf =
        data.byteLength >= 4 &&
        data[0] === 0x25 &&
        data[1] === 0x50 &&
        data[2] === 0x44 &&
        data[3] === 0x46

      if (!isPdf) {
        throw new Error(
          'The server response is not a valid PDF file.'
        )
      }

      /*
       * Give PDF.js a disposable copy. Some worker builds may transfer
       * the typed array internally, so keep our stored preview bytes intact.
       */
      const loadingTask =
        pdfjsLib.getDocument({
          data:
            data.slice()
        })

      const pdf =
        await loadingTask.promise

      const requestedPage =
        Math.max(
          1,
          Number(
            pdfBatchConfig.value.templatePage
          ) || 1
        )

      const pageNumber =
        Math.min(
          requestedPage,
          pdf.numPages
        )

      const page =
        await pdf.getPage(
          pageNumber
        )

      const unscaled =
        page.getViewport({
          scale: 1
        })

      /*
       * Base scale fits a normal editor width.
       * pdfMapperZoom then magnifies it for precise placement.
       */
      const maxWidth =
        980

      const baseScale =
        Math.min(
          1.6,
          Math.max(
            0.7,
            maxWidth /
              unscaled.width
          )
        )

      const scale =
        Math.min(
          3.5,
          Math.max(
            0.45,
            baseScale *
            Number(
              pdfMapperZoom.value ||
              1
            )
          )
        )

      const viewport =
        page.getViewport({
          scale
        })

      await nextTick()

      await new Promise(
        resolve =>
          requestAnimationFrame(
            resolve
          )
      )

      const canvas =
        pdfMapperCanvas.value

      if (!canvas) {
        throw new Error(
          'PDF mapping canvas was not created.'
        )
      }

      const ctx =
        canvas.getContext(
          '2d',
          {
            alpha: false
          }
        )

      if (!ctx) {
        throw new Error(
          'Could not get the PDF preview canvas context.'
        )
      }

      const outputScale =
        window.devicePixelRatio ||
        1

      canvas.width =
        Math.floor(
          viewport.width *
          outputScale
        )

      canvas.height =
        Math.floor(
          viewport.height *
          outputScale
        )

      canvas.style.width =
        `${viewport.width}px`

      canvas.style.height =
        `${viewport.height}px`

      const transform =
        outputScale !== 1
          ? [
              outputScale,
              0,
              0,
              outputScale,
              0,
              0
            ]
          : undefined

      await page.render({
        canvasContext:
          ctx,

        transform,

        viewport
      }).promise

      pdfRenderedViewport.value = {
        width:
          viewport.width,

        height:
          viewport.height,

        scale,

        pdfWidth:
          unscaled.width,

        pdfHeight:
          unscaled.height
      }

      pdfPageReady.value =
        true

      try {
        await pdf.cleanup()
      } catch {
        // Ignore cleanup errors.
      }

    } catch (err) {
      console.error(
        'PDF mapper preview failed:',
        err
      )

      const message =
        err?.message ||
        String(err) ||
        'Unknown PDF preview error'

      pdfPreviewError.value =
        `Could not render this PDF for mapping: ${message}`

      throw err
    } finally {
      pdfPreviewLoading.value =
        false
    }
  }


  const setPdfMapperZoom = async (
    zoom
  ) => {
    const nextZoom =
      Number(
        zoom
      ) || 1

    if (
      pdfMapperZoom.value ===
      nextZoom
    ) {
      return
    }

    pdfMapperZoom.value =
      nextZoom

    if (
      pdfPreviewBytes.value
    ) {
      await renderPdfMapperPreview()
    }
  }


  const loadPdfSampleRecords = async (
    moduleId
  ) => {
    pdfSampleRecords.value = []
    pdfSampleIndex.value = 0

    if (!moduleId) {
      return
    }

    pdfSampleLoading.value =
      true

    try {
      const res =
        await api.get(
          `/logs/module/${moduleId}`
        )

      const rows =
        Array.isArray(
          res.data
        )
          ? res.data
          : []

      pdfSampleRecords.value =
        rows.slice(
          0,
          50
        )

    } catch (err) {
      console.warn(
        'Could not load PDF mapper sample logs:',
        err
      )
    } finally {
      pdfSampleLoading.value =
        false
    }
  }


  const onPdfSelected = async (e) => {
    editingPdfTemplateId.value = null
    editingPdfFileName.value = ''

    pendingPdfFile.value =
      e.target.files[0] || null

    pdfBatchConfig.value =
      defaultPdfBatchConfig()

    resetPdfMapper()

    if (
      pendingPdfFile.value
    ) {
      await renderPdfMapperPreview(
        pendingPdfFile.value
      )

      await loadPdfSampleRecords(
        props.moduleData?.id ||
        props.activeModuleId
      )
    }
  }

  const canvasClickToPdfPoint = (
    event
  ) => {
    if (
      !pdfRenderedViewport.value ||
      !pdfMapperCanvas.value
    ) {
      return null
    }

    const rect =
      pdfMapperCanvas.value
        .getBoundingClientRect()

    const view =
      pdfRenderedViewport.value

    const clickX =
      event.clientX -
      rect.left

    const clickY =
      event.clientY -
      rect.top

    return {
      x:
        clickX /
        view.scale,

      y:
        view.pdfHeight -
        (
          clickY /
          view.scale
        )
    }
  }

  const snapPdfSpacing = (
    value
  ) => {
    const numeric =
      Number(
        value
      )

    if (
      !Number.isFinite(
        numeric
      )
    ) {
      return 0
    }

    /*
     * Quarter-point precision is fine enough for PDF placement
     * while still preventing ugly floating point values.
     */
    return Math.max(
      0.25,
      Math.round(
        numeric * 4
      ) / 4
    )
  }


  const hasRepeatingPdfFields = computed(() =>
    pdfBatchConfig.value.fields.some(
      field =>
        field.repeatPerRecord !==
        false
    )
  )


  const estimatePdfRecordGap = () => {
    const repeating =
      pdfBatchConfig.value.fields.filter(
        field =>
          field.repeatPerRecord !==
          false
      )

    if (!repeating.length) {
      return 24
    }

    repeating.forEach(
      field =>
        ensurePdfBoxTopLeft(
          field
        )
    )

    /*
     * PDF Y grows upward.
     * "y" is the top edge for new visual mappings.
     */
    const highestTop =
      Math.max(
        ...repeating.map(
          field =>
            Number(
              field.y
            ) || 0
        )
      )

    const lowestBottom =
      Math.min(
        ...repeating.map(
          field =>
            (
              Number(
                field.y
              ) || 0
            ) -
            Math.max(
              6,
              Number(
                field.height
              ) || 16
            )
        )
      )

    const blockHeight =
      Math.max(
        8,
        highestTop -
        lowestBottom
      )

    /*
     * Give the next record a small visual clearance.
     * The user then drags R2 onto the exact form row.
     */
    return snapPdfSpacing(
      blockHeight + 3
    )
  }


  const preparePdfRecord2Block = () => {
    if (
      !pdfPageReady.value
    ) {
      notify(
        'Upload or open the PDF first',
        'error'
      )
      return
    }

    if (
      !hasRepeatingPdfFields.value
    ) {
      notify(
        'Map at least one repeating field first',
        'error'
      )
      return
    }

    pdfBatchConfig.value.recordGapY =
      estimatePdfRecordGap()

    /*
     * Old point anchors are no longer needed.
     * Keep them cleared so saved configs only rely on recordGapY.
     */
    pdfBatchConfig.value.firstAnchor =
      null

    pdfBatchConfig.value.secondAnchor =
      null

    notify(
      'Record 2 preview created. Drag any green R2 box vertically to align it.',
      'success'
    )
  }


  const normalizePdfRecordGap = () => {
    const value =
      Number(
        pdfBatchConfig.value.recordGapY
      )

    if (
      !Number.isFinite(value) ||
      value <= 0
    ) {
      pdfBatchConfig.value.recordGapY =
        0
      return
    }

    pdfBatchConfig.value.recordGapY =
      snapPdfSpacing(
        value
      )
  }


  const nudgePdfRecordBlock = (
    delta
  ) => {
    const current =
      Number(
        pdfBatchConfig.value.recordGapY
      )

    if (
      !Number.isFinite(current) ||
      current <= 0
    ) {
      return
    }

    pdfBatchConfig.value.recordGapY =
      snapPdfSpacing(
        current +
        Number(
          delta
        )
      )
  }


  const resetPdfRecordSpacing = () => {
    pdfBatchConfig.value.recordGapY =
      0

    pdfBatchConfig.value.firstAnchor =
      null

    pdfBatchConfig.value.secondAnchor =
      null

    pdfRecordBlockInteraction.value =
      null
  }


  const startPdfRecordBlockDrag = (
    event
  ) => {
    if (
      event.button !== undefined &&
      event.button !== 0
    ) {
      return
    }

    const view =
      pdfRenderedViewport.value

    const currentGap =
      Number(
        pdfBatchConfig.value.recordGapY
      )

    if (
      !view ||
      !Number.isFinite(currentGap) ||
      currentGap <= 0
    ) {
      return
    }

    pdfMappingArmed.value =
      false

    pdfRecordBlockInteraction.value = {
      pointerId:
        event.pointerId,

      startClientY:
        event.clientY,

      startGap:
        currentGap
    }

    try {
      event.currentTarget
        ?.setPointerCapture(
          event.pointerId
        )
    } catch {
      // Pointer capture is optional.
    }
  }


  const movePdfRecordBlock = (
    event
  ) => {
    const interaction =
      pdfRecordBlockInteraction.value

    const view =
      pdfRenderedViewport.value

    if (
      !interaction ||
      !view ||
      interaction.pointerId !==
        event.pointerId
    ) {
      return
    }

    const scale =
      Number(
        view.scale
      ) || 1

    /*
     * Screen Y grows downward.
     * Increasing recordGapY also moves R2 downward.
     */
    const delta =
      (
        event.clientY -
        interaction.startClientY
      ) /
      scale

    pdfBatchConfig.value.recordGapY =
      snapPdfSpacing(
        interaction.startGap +
        delta
      )
  }


  const endPdfRecordBlockDrag = (
    event
  ) => {
    const interaction =
      pdfRecordBlockInteraction.value

    if (!interaction) {
      return
    }

    try {
      event.currentTarget
        ?.releasePointerCapture(
          event.pointerId
        )
    } catch {
      // Ignore.
    }

    pdfRecordBlockInteraction.value =
      null
  }


  const onPdfRecordBlockKeydown = (
    event
  ) => {
    if (
      ![
        'ArrowUp',
        'ArrowDown'
      ].includes(
        event.key
      )
    ) {
      return
    }

    event.preventDefault()

    const step =
      event.ctrlKey ||
      event.metaKey
        ? 0.25
        : event.shiftKey
          ? 5
          : 1

    nudgePdfRecordBlock(
      event.key ===
      'ArrowUp'
        ? -step
        : step
    )
  }


  const armPdfMapping = () => {
    if (
      !pdfPageReady.value
    ) {
      notify(
        'Upload a PDF first',
        'error'
      )
      return
    }

    if (
      pdfNewMapping.value.sourceType === 'column' &&
      !pdfNewMapping.value.column
    ) {
      notify(
        'Select a log column first',
        'error'
      )
      return
    }

    if (
      pdfNewMapping.value.sourceType === 'fixed' &&
      !pdfNewMapping.value.fixedValue
    ) {
      notify(
        'Enter the fixed text first',
        'error'
      )
      return
    }

    pdfMappingArmed.value =
      true

    notify(
      'Click the desired position on the PDF',
      'success'
    )
  }

  const onPdfCanvasClick = (
    event
  ) => {
    const point =
      canvasClickToPdfPoint(
        event
      )

    if (!point) {
      return
    }

    if (
      !pdfMappingArmed.value
    ) {
      return
    }

    const mapping = {
      id:
        `${Date.now()}-${Math.random()
          .toString(36)
          .slice(2)}`,

      sourceType:
        pdfNewMapping.value.sourceType,

      column:
        pdfNewMapping.value.column,

      fixedValue:
        pdfNewMapping.value.fixedValue,

      prefix:
        pdfNewMapping.value.prefix || '',

      fontSize:
        Number(
          pdfNewMapping.value.fontSize
        ) || 8.5,

      width:
        Math.max(
          10,
          Number(
            pdfNewMapping.value.width
          ) || 120
        ),

      height:
        Math.max(
          6,
          Number(
            pdfNewMapping.value.height
          ) || 16
        ),

      align:
        pdfNewMapping.value.align ||
        'left',

      repeatPerRecord:
        !!pdfNewMapping.value.repeatPerRecord,

      /*
       * New mappings store the clicked point as the TOP-LEFT
       * corner of the visual text box.
       */
      boxMode:
        'topLeft',

      x:
        point.x,

      y:
        point.y
    }

    pdfBatchConfig.value.fields.push(
      mapping
    )

    selectedPdfMappingId.value =
      mapping.id

    pdfMappingArmed.value =
      false

    pdfNewMapping.value =
      defaultPdfNewMapping()
  }

  const removePdfMapping = (
    index
  ) => {
    const removed =
      pdfBatchConfig.value.fields[
        index
      ]

    pdfBatchConfig.value.fields.splice(
      index,
      1
    )

    if (
      removed?.id &&
      selectedPdfMappingId.value ===
      removed.id
    ) {
      selectedPdfMappingId.value =
        null
    }
  }

  const pdfMappingLabel = (
    mapping
  ) => {
    if (
      mapping.sourceType ===
      'column'
    ) {
      return mapping.column ||
        'Column'
    }

    if (
      mapping.sourceType ===
      'fixed'
    ) {
      return `Fixed: ${
        mapping.fixedValue ||
        ''
      }`
    }

    if (
      mapping.sourceType ===
      'printDate'
    ) {
      return 'Print Date'
    }

    return 'Field'
  }

  const pdfPointStyle = (
    point
  ) => {
    const view =
      pdfRenderedViewport.value

    if (
      !view ||
      !point
    ) {
      return {
        display:
          'none'
      }
    }

    return {
      left:
        `${
          point.x *
          view.scale
        }px`,

      top:
        `${
          (
            view.pdfHeight -
            point.y
          ) *
          view.scale
        }px`
    }
  }

  const pdfMarkerStyle = (
    mapping
  ) => {
    const view =
      pdfRenderedViewport.value

    if (
      !view ||
      !mapping
    ) {
      return {
        display: 'none'
      }
    }

    const scale =
      view.scale

    const width =
      Math.max(
        10,
        Number(
          mapping.width
        ) || 120
      )

    const height =
      Math.max(
        6,
        Number(
          mapping.height
        ) || 16
      )

    /*
     * Old mappings were point/baseline mappings.
     * New mappings are top-left boxes.
     */
    const top =
      mapping.boxMode === 'topLeft'
        ? (
            view.pdfHeight -
            mapping.y
          ) *
          scale
        : (
            view.pdfHeight -
            mapping.y
          ) *
          scale -
          height *
          scale

    return {
      left:
        `${mapping.x * scale}px`,

      top:
        `${top}px`,

      width:
        `${width * scale}px`,

      height:
        `${height * scale}px`,

      fontSize:
        `${Math.max(
          8,
          Number(
            mapping.fontSize
          ) * scale
        )}px`
    }
  }

  const pdfMappingPreviewText = (
    mapping,
    recordOffset = 0
  ) => {
    const prefix =
      mapping?.prefix ||
      ''

    if (
      mapping?.sourceType ===
      'fixed'
    ) {
      return `${prefix}${
        mapping.fixedValue ||
        ''
      }`
    }

    if (
      mapping?.sourceType ===
      'printDate'
    ) {
      return `${prefix}${
        new Date()
          .toLocaleDateString(
            'en-PH'
          )
      }`
    }

    const records =
      pdfSampleRecords.value

    const baseIndex =
      Math.max(
        0,
        Number(
          pdfSampleIndex.value
        ) || 0
      )

    const record =
      records[
        Math.min(
          Math.max(
            0,
            baseIndex +
            Number(
              recordOffset ||
              0
            )
          ),
          Math.max(
            0,
            records.length -
            1
          )
        )
      ]

    const sample =
      record?.data?.[
        mapping?.column
      ]

    const displayValue =
      sample !== null &&
      sample !== undefined &&
      String(sample) !== ''
        ? String(sample)
        : (
            mapping?.column ||
            'Field'
          )

    return `${prefix}${displayValue}`
  }


  const selectPdfMapping = (
    mapping
  ) => {
    selectedPdfMappingId.value =
      mapping?.id ||
      null
  }


  const ensurePdfBoxTopLeft = (
    mapping
  ) => {
    if (
      !mapping ||
      mapping.boxMode ===
      'topLeft'
    ) {
      return
    }

    const height =
      Math.max(
        6,
        Number(
          mapping.height
        ) || 16
      )

    /*
     * Old mappings stored y as a baseline. Convert once to the
     * top edge used by the visual designer without moving the box.
     */
    mapping.y =
      Number(
        mapping.y
      ) +
      height

    mapping.boxMode =
      'topLeft'
  }


  const startPdfBoxDrag = (
    mapping,
    event
  ) => {
    if (
      event.button !== undefined &&
      event.button !== 0
    ) {
      return
    }

    ensurePdfBoxTopLeft(
      mapping
    )

    selectPdfMapping(
      mapping
    )

    pdfMappingArmed.value =
      false

    pdfBoxInteraction.value = {
      id:
        mapping.id,

      mode:
        'drag',

      pointerId:
        event.pointerId,

      startClientX:
        event.clientX,

      startClientY:
        event.clientY,

      startX:
        Number(
          mapping.x
        ) || 0,

      startY:
        Number(
          mapping.y
        ) || 0,

      startWidth:
        Math.max(
          10,
          Number(
            mapping.width
          ) || 120
        ),

      startHeight:
        Math.max(
          6,
          Number(
            mapping.height
          ) || 16
        )
    }

    try {
      event.currentTarget
        ?.setPointerCapture(
          event.pointerId
        )
    } catch {
      // Pointer capture is optional.
    }
  }


  const startPdfBoxResize = (
    mapping,
    event
  ) => {
    ensurePdfBoxTopLeft(
      mapping
    )

    selectPdfMapping(
      mapping
    )

    pdfBoxInteraction.value = {
      id:
        mapping.id,

      mode:
        'resize',

      pointerId:
        event.pointerId,

      startClientX:
        event.clientX,

      startClientY:
        event.clientY,

      startX:
        Number(
          mapping.x
        ) || 0,

      startY:
        Number(
          mapping.y
        ) || 0,

      startWidth:
        Math.max(
          10,
          Number(
            mapping.width
          ) || 120
        ),

      startHeight:
        Math.max(
          6,
          Number(
            mapping.height
          ) || 16
        )
    }

    try {
      event.currentTarget
        ?.setPointerCapture(
          event.pointerId
        )
    } catch {
      // Pointer capture is optional.
    }
  }


  const movePdfBox = (
    mapping,
    event
  ) => {
    const interaction =
      pdfBoxInteraction.value

    const view =
      pdfRenderedViewport.value

    if (
      !interaction ||
      !view ||
      interaction.id !==
        mapping.id ||
      interaction.pointerId !==
        event.pointerId
    ) {
      return
    }

    const scale =
      Number(
        view.scale
      ) || 1

    const dx =
      (
        event.clientX -
        interaction.startClientX
      ) /
      scale

    const dy =
      (
        event.clientY -
        interaction.startClientY
      ) /
      scale

    if (
      interaction.mode ===
      'drag'
    ) {
      mapping.x =
        interaction.startX +
        dx

      /*
       * Screen Y grows downward, PDF Y grows upward.
       */
      mapping.y =
        interaction.startY -
        dy

    } else if (
      interaction.mode ===
      'resize'
    ) {
      mapping.width =
        Math.max(
          10,
          interaction.startWidth +
          dx
        )

      mapping.height =
        Math.max(
          6,
          interaction.startHeight +
          dy
        )
    }
  }


  const endPdfBoxInteraction = (
    mapping,
    event
  ) => {
    const interaction =
      pdfBoxInteraction.value

    if (
      !interaction ||
      interaction.id !==
        mapping.id
    ) {
      return
    }

    try {
      event.currentTarget
        ?.releasePointerCapture(
          event.pointerId
        )
    } catch {
      // Ignore.
    }

    pdfBoxInteraction.value =
      null
  }


  const onPdfBoxKeydown = (
    mapping,
    event
  ) => {
    const arrows = [
      'ArrowLeft',
      'ArrowRight',
      'ArrowUp',
      'ArrowDown'
    ]

    if (
      !arrows.includes(
        event.key
      )
    ) {
      return
    }

    event.preventDefault()

    ensurePdfBoxTopLeft(
      mapping
    )

    selectPdfMapping(
      mapping
    )

    const step =
      event.ctrlKey ||
      event.metaKey
        ? 0.25
        : event.shiftKey
          ? 5
          : 1

    if (
      event.key ===
      'ArrowLeft'
    ) {
      mapping.x -= step
    }

    if (
      event.key ===
      'ArrowRight'
    ) {
      mapping.x += step
    }

    if (
      event.key ===
      'ArrowUp'
    ) {
      mapping.y += step
    }

    if (
      event.key ===
      'ArrowDown'
    ) {
      mapping.y -= step
    }
  }


  const pdfRepeatPreviewStyle = (
    mapping,
    repeatIndex = 1
  ) => {
    const cloned = {
      ...mapping,

      y:
        Number(
          mapping.y
        ) -
        (
          Number(
            pdfBatchConfig.value.recordGapY
          ) || 0
        ) *
        Number(
          repeatIndex ||
          0
        )
    }

    return pdfMarkerStyle(
      cloned
    )
  }


  const normalizePdfBatchConfig = (
    value
  ) => {
    let raw = value

    /*
     * Depending on the DB driver / older saved records,
     * batchConfig may arrive as a JSON string instead of
     * an already-parsed object.
     */
    if (
      typeof raw === 'string'
    ) {
      try {
        raw =
          JSON.parse(
            raw
          )
      } catch {
        raw = {}
      }
    }

    if (
      !raw ||
      typeof raw !== 'object' ||
      Array.isArray(raw)
    ) {
      raw = {}
    }

    const fields =
      Array.isArray(
        raw.fields
      )
        ? raw.fields.map(
            field => ({
              ...field,

              id:
                field.id ||
                `${Date.now()}-${Math.random()
                  .toString(36)
                  .slice(2)}`,

              fontSize:
                Number(
                  field.fontSize
                ) || 8.5,

              width:
                Math.max(
                  10,
                  Number(
                    field.width
                  ) || 120
                ),

              height:
                Math.max(
                  6,
                  Number(
                    field.height
                  ) || 16
                ),

              align:
                field.align ||
                'left',

              repeatPerRecord:
                field.repeatPerRecord !==
                false
            })
          )
        : []

    let recordGapY =
      Number(
        raw.recordGapY
      ) || 0

    /*
     * Backward compatibility:
     * old mappings used R1/R2 point anchors.
     * If they have a valid spacing, migrate that spacing once.
     */
    if (
      recordGapY <= 0 &&
      raw.firstAnchor &&
      raw.secondAnchor
    ) {
      recordGapY =
        Math.abs(
          Number(
            raw.firstAnchor.y
          ) -
          Number(
            raw.secondAnchor.y
          )
        )
    }

    return {
      ...defaultPdfBatchConfig(),
      ...raw,

      recordGapY:
        recordGapY > 0
          ? snapPdfSpacing(recordGapY)
          : 0,

      /*
       * Point anchors are intentionally cleared.
       * New UI uses the draggable Record 2 block instead.
       */
      firstAnchor:
        null,

      secondAnchor:
        null,

      fields
    }
  }


  const editPdfTemplate = async (
    template
  ) => {
    try {
      if (
        !template?.id
      ) {
        throw new Error(
          'Saved PDF template has no ID.'
        )
      }

      showPdfModal.value =
        true

      editingPdfTemplateId.value =
        template.id

      editingPdfFileName.value =
        template.fileName ||
        template.name ||
        'PDF template'

      newPdfName.value =
        template.name ||
        'PDF Form'

      newPdfPrintMode.value =
        String(
          template.printMode ||
          'batch'
        ).toLowerCase() === 'row'
          ? 'row'
          : 'batch'

      pendingPdfFile.value =
        null

      pdfBatchConfig.value =
        normalizePdfBatchConfig(
          template.batchConfig
        )

      if (
        newPdfPrintMode.value ===
        'row'
      ) {
        pdfBatchConfig.value.recordsPerPage = 1
        pdfBatchConfig.value.recordGapY = 0
        pdfBatchConfig.value.firstAnchor = null
        pdfBatchConfig.value.secondAnchor = null
      }

      resetPdfMapper()

      /*
       * ArrayBuffer is more predictable here than Blob and
       * works directly with PDF.js.
       */
      const res =
        await api.get(
          `/modules/templates/${template.id}/file`,
          {
            responseType:
              'arraybuffer',

            params: {
              _ts:
                Date.now()
            }
          }
        )

      await renderPdfMapperPreview(
        res.data
      )

      await loadPdfSampleRecords(
        props.moduleData?.id ||
        props.activeModuleId ||
        template.moduleId
      )

      notify(
        'Saved PDF mapping loaded',
        'success'
      )

    } catch (err) {
      console.error(
        'Failed to open PDF template mapping:',
        err
      )

      const status =
        err?.response?.status

      const detail =
        err?.message ||
        'Unknown error'

      notify(
        status
          ? `Failed to open the saved PDF mapping (${status})`
          : `Failed to open the saved PDF mapping: ${detail}`,
        'error'
      )
    }
  }


  const saveExistingPdfTemplateConfig = async () => {
    if (
      !editingPdfTemplateId.value
    ) {
      return
    }

    if (
      !pdfBatchConfig.value.fields.length
    ) {
      notify(
        'Add at least one PDF field mapping',
        'error'
      )
      return
    }

    const hasRepeatingFields =
      pdfBatchConfig.value.fields.some(
        field =>
          field.repeatPerRecord !==
          false
      )

    if (
      newPdfPrintMode.value === 'batch' &&
      hasRepeatingFields &&
      Number(
        pdfBatchConfig.value.recordsPerPage
      ) > 1 &&
      !Number(
        pdfBatchConfig.value.recordGapY
      )
    ) {
      notify(
        'Create and position the Record 2 preview first',
        'error'
      )
      return
    }

    savingPdfTemplateConfig.value =
      true

    try {

      /*
       * Strip Vue reactive/proxy wrappers before sending the JSON config.
       */
      const configToSave =
        JSON.parse(
          JSON.stringify(
            pdfBatchConfig.value
          )
        )


      const templateId =
        Number(
          editingPdfTemplateId.value
        )


      /*
       * 1. Persist the mapping.
       */
      const saveRes =
        await api.put(
          `/modules/templates/${templateId}/config`,
          {
            name:
              newPdfName.value ||
              'PDF Form',

            printMode:
              newPdfPrintMode.value,

            batchConfig:
              configToSave
          }
        )


      if (
        !saveRes?.data
      ) {
        throw new Error(
          'The backend did not return the saved PDF template.'
        )
      }


      /*
       * 2. Read the template back from the database.
       *
       * Do not trust local state as proof that it saved.
       */
      const verifyRes =
        await api.get(
          `/modules/templates/${templateId}/config`,
          {
            params: {
              _ts:
                Date.now()
            }
          }
        )


      if (
        !verifyRes?.data
      ) {
        throw new Error(
          'Could not verify the saved PDF mapping.'
        )
      }


      const persistedConfig =
        normalizePdfBatchConfig(
          verifyRes.data.batchConfig
        )


      /*
       * Basic persistence verification.
       */
      if (
        persistedConfig.fields.length !==
        configToSave.fields.length
      ) {
        throw new Error(
          'The saved PDF mapping did not match the mapping sent to the server.'
        )
      }


      /*
       * 3. Replace the current editor template with the DB copy.
       */
      const index =
        props.moduleData.templates
          .findIndex(
            t =>
              Number(t.id) ===
              templateId
          )


      if (
        index >= 0
      ) {

        props.moduleData.templates[index] = {
          ...props.moduleData.templates[index],
          ...verifyRes.data,

          batchConfig:
            persistedConfig
        }

      }


      /*
       * Refresh the module from the backend, then let the parent decide
       * how to merge it into the module list.
       */
      if (
        props.moduleData?.id
      ) {

        const moduleRes =
          await api.get(
            `/modules/single/${props.moduleData.id}`,
            {
              params: {
                _ts:
                  Date.now()
              }
            }
          )


        const freshModule =
          moduleRes?.data


        if (freshModule) {

          emit(
            'module-refreshed',
            freshModule
          )

        }

      }


      /*
       * Keep the verified config in the mapper until we close it.
       */
      pdfBatchConfig.value =
        persistedConfig


      emit(
        'template-saved',
        verifyRes.data
      )


      console.log(
        'PDF MAPPING SAVED AND VERIFIED:',
        {
          templateId,
          fields:
            persistedConfig.fields.length,

          config:
            persistedConfig
        }
      )


      notify(
        'PDF mapping saved and verified',
        'success'
      )


      editingPdfTemplateId.value =
        null

      editingPdfFileName.value =
        ''

      showPdfModal.value =
        false

      resetPdfMapper()

    } catch (err) {

      console.error(
        'Failed to save PDF mapping:',
        err
      )


      const status =
        err?.response?.status


      notify(
        status
          ? `Failed to save PDF mapping (${status})`
          : (
              err?.message ||
              'Failed to save PDF mapping'
            ),
        'error'
      )

    } finally {

      savingPdfTemplateConfig.value =
        false

    }
  }


  const uploadPendingPdfTemplate = async (
    moduleId
  ) => {
    if (!pendingPdfFile.value) return

    if (
      !pdfBatchConfig.value.fields.length
    ) {
      notify(
        'Add at least one PDF field mapping before saving',
        'error'
      )

      throw new Error(
        'PDF field mappings are required'
      )
    }

    const hasRepeatingFields =
      pdfBatchConfig.value.fields.some(
        field =>
          field.repeatPerRecord !==
          false
      )

    if (
      newPdfPrintMode.value === 'batch' &&
      hasRepeatingFields &&
      Number(
        pdfBatchConfig.value.recordsPerPage
      ) > 1 &&
      !Number(
        pdfBatchConfig.value.recordGapY
      )
    ) {
      notify(
        'Create and position the Record 2 preview so row spacing can be saved',
        'error'
      )

      throw new Error(
        'PDF row spacing is required'
      )
    }

    try {
      const formData =
        new FormData()

      formData.append(
        'file',
        pendingPdfFile.value
      )

      formData.append(
        'name',
        newPdfName.value ||
        'PDF Form'
      )

      formData.append(
        'kind',
        'pdf'
      )

      formData.append(
        'printMode',
        newPdfPrintMode.value
      )

      const configToUpload =
        JSON.parse(
          JSON.stringify(
            pdfBatchConfig.value
          )
        )

      if (
        newPdfPrintMode.value ===
        'row'
      ) {
        configToUpload.recordsPerPage = 1
        configToUpload.recordGapY = 0
        configToUpload.firstAnchor = null
        configToUpload.secondAnchor = null
      }

      formData.append(
        'batchConfig',
        JSON.stringify(
          configToUpload
        )
      )

      const uploadRes =
        await api.post(
          `/modules/${moduleId}/templates`,
          formData,
          {
            headers: {
              'Content-Type':
                'multipart/form-data'
            }
          }
        )

      if (
        uploadRes?.data
      ) {
        emit(
          'template-uploaded',
          uploadRes.data
        )
      }
    } catch (err) {
      console.error(err)

      notify(
        'Module saved, but the PDF template failed to upload',
        'error'
      )

      throw err
    } finally {
      pendingPdfFile.value =
        null

      newPdfName.value =
        'PDF Form'

      newPdfPrintMode.value =
        'batch'

      pdfBatchConfig.value =
        defaultPdfBatchConfig()

      resetPdfMapper()
    }
  }



  const validatePendingPdfMapping = () => {

    if (
      !pendingPdfFile.value
    ) {
      notify(
        'Choose a PDF file first',
        'error'
      )

      return false
    }

    if (
      !String(
        newPdfName.value ||
        ''
      ).trim()
    ) {
      notify(
        'Enter a template name',
        'error'
      )

      return false
    }

    if (
      !pdfBatchConfig.value.fields.length
    ) {
      notify(
        'Add at least one PDF field mapping',
        'error'
      )

      return false
    }

    const hasRepeatingFields =
      pdfBatchConfig.value.fields.some(
        field =>
          field.repeatPerRecord !==
          false
      )

    if (
      newPdfPrintMode.value ===
        'batch' &&
      hasRepeatingFields &&
      Number(
        pdfBatchConfig.value.recordsPerPage
      ) > 1 &&
      !Number(
        pdfBatchConfig.value.recordGapY
      )
    ) {
      notify(
        'Create and position the Record 2 preview first',
        'error'
      )

      return false
    }

    return true

  }


  const finishNewPdfMapping = () => {

    if (
      !validatePendingPdfMapping()
    ) {
      return
    }

    /*
     * Hide the mapper WITHOUT clearing pendingPdfFile / batchConfig.
     * The configured PDF is uploaded when the user saves the module.
     */
    showPdfModal.value =
      false

    editingPdfTemplateId.value =
      null

    editingPdfFileName.value =
      ''

    notify(
      'PDF form is ready. Save the module to upload it.',
      'success'
    )

  }


  const reopenPendingPdfMapping = async () => {

    if (
      !pendingPdfFile.value
    ) {
      return
    }

    editingPdfTemplateId.value =
      null

    editingPdfFileName.value =
      ''

    showPdfModal.value =
      true

    await nextTick()

    try {

      await renderPdfMapperPreview(
        pendingPdfFile.value
      )

      await loadPdfSampleRecords(
        props.moduleData?.id ||
        props.activeModuleId
      )

    } catch (err) {

      console.error(
        'Failed to reopen pending PDF mapper:',
        err
      )

      notify(
        'Failed to reopen the PDF mapping',
        'error'
      )

    }

  }


  const discardPendingPdfTemplate = () => {

    pendingPdfFile.value =
      null

    newPdfName.value =
      'PDF Form'

    newPdfPrintMode.value =
      'batch'

    pdfBatchConfig.value =
      defaultPdfBatchConfig()

    resetPdfMapper()

    notify(
      'Pending PDF form discarded',
      'success'
    )

  }




  const openNewPdf = async () => {

    editingPdfTemplateId.value =
      null

    editingPdfFileName.value =
      ''

    if (
      pendingPdfFile.value
    ) {
      await reopenPendingPdfMapping()
      return
    }

    newPdfName.value =
      'PDF Form'

    newPdfPrintMode.value =
      'batch'

    pdfBatchConfig.value =
      defaultPdfBatchConfig()

    resetPdfMapper()

    showPdfModal.value =
      true
  }


  const cancelAddTemplate = () => {

    showPdfModal.value =
      false

    savingPdfTemplateConfig.value =
      false

    /*
     * If this is a brand-new PDF form, Cancel discards the staged PDF.
     * Existing saved templates are never deleted by closing the modal.
     */
    if (
      !editingPdfTemplateId.value
    ) {
      pendingPdfFile.value =
        null

      newPdfName.value =
        'PDF Form'

      newPdfPrintMode.value =
        'batch'

      pdfBatchConfig.value =
        defaultPdfBatchConfig()
    }

    editingPdfTemplateId.value =
      null

    editingPdfFileName.value =
      ''

    resetPdfMapper()

  }


  const updatePdfPrintMode = async (
    template,
    printMode
  ) => {

    try {

      const batchConfig =
        normalizePdfBatchConfig(
          template.batchConfig
        )


      if (
        printMode ===
        'row'
      ) {

        batchConfig.recordsPerPage =
          1

        batchConfig.recordGapY =
          0

        batchConfig.firstAnchor =
          null

        batchConfig.secondAnchor =
          null

      }


      const res =
        await api.put(
          `/modules/templates/${template.id}/config`,
          {
            printMode,
            batchConfig
          }
        )


      template.printMode =
        printMode

      template.batchConfig =
        batchConfig


      emit(
        'template-saved',
        res?.data ||
        template
      )


      notify(
        'Template print mode updated',
        'success'
      )

    } catch (err) {

      console.error(err)


      notify(
        'Failed to update PDF print mode',
        'error'
      )

    }

  }


  const deletePdfTemplate = async (
    templateId
  ) => {

    try {

      await api.delete(
        `/modules/templates/${templateId}`
      )


      props.moduleData.templates =
        (
          props.moduleData.templates ||
          []
        ).filter(
          template =>
            Number(template.id) !==
            Number(templateId)
        )


      emit(
        'template-deleted',
        templateId
      )


      notify(
        'PDF template removed',
        'success'
      )

    } catch (err) {

      console.error(err)


      notify(
        'Failed to remove PDF template',
        'error'
      )

    }

  }


  const resetPdfFeature = () => {

    showPdfModal.value =
      false

    editingPdfTemplateId.value =
      null

    editingPdfFileName.value =
      ''

    savingPdfTemplateConfig.value =
      false

    pendingPdfFile.value =
      null

    newPdfName.value =
      'PDF Form'

    newPdfPrintMode.value =
      'batch'

    pdfBatchConfig.value =
      defaultPdfBatchConfig()

    resetPdfMapper()

  }



  const hasPendingPdf =
    computed(
      () =>
        !!pendingPdfFile.value
    )


  watch(
    () =>
      props.moduleData?.id,
    (
      nextId,
      previousId
    ) => {

      if (
        previousId !== undefined &&
        previousId !== nextId
      ) {

        resetPdfFeature()

      }

    }
  )

  return {
    pdfTemplates,
    showPdfModal,
    notify,
    newPdfName,
    newPdfPrintMode,
    pendingPdfFile,
    editingPdfTemplateId,
    editingPdfFileName,
    savingPdfTemplateConfig,
    pdfMapperCanvas,
    pdfPageReady,
    pdfPreviewLoading,
    pdfPreviewError,
    pdfRenderedViewport,
    pdfPreviewBytes,
    pdfMapperZoom,
    selectedPdfMappingId,
    pdfBoxInteraction,
    pdfRecordBlockInteraction,
    pdfSampleRecords,
    pdfSampleIndex,
    pdfSampleLoading,
    defaultPdfBatchConfig,
    pdfBatchConfig,
    onPdfPrintModeChange,
    defaultPdfNewMapping,
    pdfNewMapping,
    pdfMappingArmed,
    resetPdfMapper,
    renderPdfMapperPreview,
    setPdfMapperZoom,
    loadPdfSampleRecords,
    onPdfSelected,
    canvasClickToPdfPoint,
    snapPdfSpacing,
    hasRepeatingPdfFields,
    estimatePdfRecordGap,
    preparePdfRecord2Block,
    normalizePdfRecordGap,
    nudgePdfRecordBlock,
    resetPdfRecordSpacing,
    startPdfRecordBlockDrag,
    movePdfRecordBlock,
    endPdfRecordBlockDrag,
    onPdfRecordBlockKeydown,
    armPdfMapping,
    onPdfCanvasClick,
    removePdfMapping,
    pdfMappingLabel,
    pdfPointStyle,
    pdfMarkerStyle,
    pdfMappingPreviewText,
    selectPdfMapping,
    ensurePdfBoxTopLeft,
    startPdfBoxDrag,
    startPdfBoxResize,
    movePdfBox,
    endPdfBoxInteraction,
    onPdfBoxKeydown,
    pdfRepeatPreviewStyle,
    normalizePdfBatchConfig,
    editPdfTemplate,
    saveExistingPdfTemplateConfig,
    uploadPendingPdfTemplate,
    validatePendingPdfMapping,
    finishNewPdfMapping,
    reopenPendingPdfMapping,
    discardPendingPdfTemplate,
    openNewPdf,
    cancelAddTemplate,
    updatePdfPrintMode,
    deletePdfTemplate,
    resetPdfFeature,
    hasPendingPdf
  }
}
