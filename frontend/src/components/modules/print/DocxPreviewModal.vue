<template>
  <div class="docx-preview-backdrop">
    <div class="docx-preview-modal">

      <div class="docx-preview-header">
        <div class="docx-preview-title">
          <h3>Print Preview</h3>
          <p>{{ fileName }}</p>
        </div>

        <button
          type="button"
          class="docx-preview-close"
          @click="$emit('close')"
          title="Close preview"
        >
          ✕
        </button>
      </div>

      <div class="docx-preview-body real-pdf-preview-body">
        <iframe
          v-if="pdfUrl"
          :src="pdfUrl"
          class="real-document-frame"
          title="DOCX PDF preview"
        ></iframe>

        <div
          v-else
          class="real-preview-loading"
        >
          Generating preview…
        </div>
      </div>

      <div class="docx-preview-footer">
        <div class="docx-preview-info">
          Review the filled form before printing.
        </div>

        <div class="docx-preview-actions">
          <button
            type="button"
            class="btn-ghost"
            @click="$emit('close')"
          >
            Cancel
          </button>

          <button
            type="button"
            class="btn-outline"
            @click="$emit('download')"
          >
            ↓ Download DOCX
          </button>

          <button
            type="button"
            class="btn-primary"
            @click="$emit('print')"
          >
            <span class="btn-icon-left">
              🖨
            </span>
            Print
          </button>
        </div>
      </div>

    </div>
  </div>
</template>

<script setup>
defineProps({
  fileName: {
    type: String,
    default: ''
  },

  pdfUrl: {
    type: String,
    default: ''
  }
})

defineEmits([
  'close',
  'download',
  'print'
])
</script>

<style scoped>
.docx-preview-backdrop {
  position: fixed;
  inset: 0;
  z-index: 20000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 18px;
  background: rgba(15, 23, 42, 0.66);
  backdrop-filter: blur(4px);
}

.docx-preview-modal {
  width: min(1180px, 96vw);
  height: min(900px, 94vh);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border-radius: 14px;
  background: #ffffff;
  box-shadow: 0 25px 80px rgba(15, 23, 42, 0.32);
}

.docx-preview-header {
  flex: 0 0 auto;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  padding: 14px 16px;
  border-bottom: 1px solid #e5e7eb;
}

.docx-preview-title h3 {
  margin: 0;
  color: #111827;
  font-size: 15px;
}

.docx-preview-title p {
  margin: 3px 0 0;
  color: #6b7280;
  font-size: 11px;
}

.docx-preview-close {
  width: 34px;
  height: 34px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: #ffffff;
  color: #6b7280;
  cursor: pointer;
}

.docx-preview-body {
  flex: 1 1 auto;
  min-height: 0;
  overflow: hidden;
  background: #eef2f7;
}

.real-document-frame {
  width: 100%;
  height: 100%;
  border: 0;
  background: #ffffff;
}

.real-preview-loading {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #64748b;
  font-size: 12px;
}

.docx-preview-footer {
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  padding: 12px 16px;
  border-top: 1px solid #e5e7eb;
}

.docx-preview-info {
  color: #6b7280;
  font-size: 11px;
}

.docx-preview-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.btn-ghost,
.btn-outline,
.btn-primary {
  min-height: 36px;
  padding: 0 12px;
  border-radius: 8px;
  font: inherit;
  font-size: 11px;
  cursor: pointer;
}

.btn-ghost {
  border: 1px solid #d1d5db;
  background: #ffffff;
  color: #374151;
}

.btn-outline {
  border: 1px solid #93c5fd;
  background: #eff6ff;
  color: #1d4ed8;
}

.btn-primary {
  border: 1px solid #2563eb;
  background: #2563eb;
  color: #ffffff;
  font-weight: 700;
}

.btn-icon-left {
  margin-right: 5px;
}

@media (max-width: 760px) {
  .docx-preview-backdrop {
    padding: 0;
  }

  .docx-preview-modal {
    width: 100vw;
    height: 100vh;
    border-radius: 0;
  }

  .docx-preview-footer {
    align-items: stretch;
    flex-direction: column;
  }

  .docx-preview-actions {
    width: 100%;
  }

  .docx-preview-actions button {
    flex: 1 1 auto;
  }
}
</style>
