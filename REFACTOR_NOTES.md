# IMISS Refactor Phase 1

This refactor separates the largest features without changing the intended workflow.

## Frontend changes

### Manage Modules
- `frontend/src/views/admin/ManageModules.vue`
  - PDF mapper logic removed from the page.
  - Uses `PdfTemplateManager.vue`.
  - CSS moved to `frontend/src/styles/manage-modules.css`.

- `frontend/src/components/modules/templates/PdfTemplateManager.vue`
  - Owns the PDF-template list, Add PDF popup, Edit PDF popup, and mapper UI.

- `frontend/src/composables/usePdfTemplateManager.js`
  - Owns PDF.js rendering, field placement, drag/resize, Record 2 spacing,
    sample records, mapping persistence, PDF upload, and print-mode updates.

- `frontend/src/styles/pdf-template-manager.css`
  - PDF mapper styles.

### Dynamic Module
- `frontend/src/views/modules/DynamicModule.vue`
  - Row Fill & Print implementation moved out of the page.
  - CSS moved to `frontend/src/styles/dynamic-module.css`.

- `frontend/src/composables/useRowPrint.js`
  - Owns per-row DOCX/PDF Fill & Print behavior.

- `frontend/src/components/modules/print/RowPrintChooser.vue`
  - Chooser shown when more than one row print form exists.

- `frontend/src/components/modules/print/DocxPreviewModal.vue`
  - DOCX/PDF print-preview modal.

## Backend changes

- `backend/src/module/modules.controller.ts`
  - Exact mapped-PDF drawing logic removed from the controller.
  - Controller now delegates to `PdfTemplateService`.

- `backend/src/module/services/pdf-template.service.ts`
  - Owns mapped PDF generation, field alignment, record spacing, page copying,
    print-date/fixed/log values, and per-row/batch behavior.

- `backend/src/module/modules.module.ts`
  - Registers `PdfTemplateService`.

## Important

Copy the files using the paths already included in this ZIP.

After copying:

Frontend:
```powershell
cd C:\Users\Kenji\IMISS-SYSTEM\frontend
npm run dev
```

Backend:
```powershell
cd C:\Users\Kenji\IMISS-SYSTEM\backend
npm run start:dev
```

Test these before committing:
1. Open Manage Modules.
2. Add a PDF form and confirm the mapper popup opens.
3. Edit a saved PDF mapping.
4. Save PDF mapping and reopen it.
5. Test PDF Fill & Print on one row.
6. Test DOCX Fill & Print on one row.
7. Test batch/filtered PDF printing.
8. Create/update a module with a newly staged PDF template.

The JavaScript portions of the generated Vue/composable files were syntax checked.
The TypeScript refactor was structurally checked, but should be compiled inside the real NestJS project
where the project dependencies and tsconfig are available.
