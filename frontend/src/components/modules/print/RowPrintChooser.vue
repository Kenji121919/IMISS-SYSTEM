<template>
  <div
    class="row-print-chooser-backdrop"
    @click.self="$emit('close')"
  >
    <div class="row-print-chooser-modal">
      <div class="row-print-chooser-header">
        <div>
          <h3>Fill & Print</h3>
          <p>Choose the form to use for this record.</p>
        </div>

        <button
          type="button"
          class="row-print-chooser-close"
          @click="$emit('close')"
        >
          ✕
        </button>
      </div>

      <div class="row-print-chooser-list">
        <button
          v-for="tpl in templates"
          :key="'row-print-' + tpl.id"
          type="button"
          class="row-print-template-option"
          @click="$emit('select', tpl)"
        >
          <span class="row-print-template-icon">
            {{
              String(tpl.kind || '').toLowerCase() === 'pdf'
                ? '📕'
                : '📄'
            }}
          </span>

          <span class="row-print-template-copy">
            <strong>{{ tpl.name }}</strong>

            <small>
              {{
                String(tpl.kind || '').toLowerCase() === 'pdf'
                  ? 'PDF · exact mapped form'
                  : 'Word · Fill & Print form'
              }}
            </small>
          </span>

          <span class="row-print-template-arrow">
            ›
          </span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  templates: {
    type: Array,
    default: () => []
  }
})

defineEmits([
  'close',
  'select'
])
</script>

<style scoped>
.row-print-chooser-backdrop {
  position: fixed;
  inset: 0;
  z-index: 25000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 18px;
  background: rgba(15, 23, 42, 0.58);
  backdrop-filter: blur(4px);
}

.row-print-chooser-modal {
  width: min(460px, 94vw);
  overflow: hidden;
  border-radius: 14px;
  background: #ffffff;
  box-shadow: 0 25px 70px rgba(15, 23, 42, 0.28);
}

.row-print-chooser-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 14px;
  padding: 16px 17px;
  border-bottom: 1px solid #e5e7eb;
}

.row-print-chooser-header h3 {
  margin: 0;
  color: #111827;
  font-size: 15px;
  font-weight: 800;
}

.row-print-chooser-header p {
  margin: 3px 0 0;
  color: #6b7280;
  font-size: 11px;
}

.row-print-chooser-close {
  width: 32px;
  height: 32px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: #ffffff;
  color: #6b7280;
  cursor: pointer;
}

.row-print-chooser-list {
  padding: 10px;
}

.row-print-template-option {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 11px;
  padding: 12px;
  border: 1px solid transparent;
  border-radius: 10px;
  background: transparent;
  text-align: left;
  cursor: pointer;
}

.row-print-template-option:hover {
  border-color: #dbeafe;
  background: #eff6ff;
}

.row-print-template-icon {
  flex: 0 0 auto;
  width: 36px;
  height: 36px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 9px;
  background: #f8fafc;
  font-size: 17px;
}

.row-print-template-copy {
  flex: 1 1 auto;
  min-width: 0;
}

.row-print-template-copy strong,
.row-print-template-copy small {
  display: block;
}

.row-print-template-copy strong {
  color: #0f172a;
  font-size: 12px;
}

.row-print-template-copy small {
  margin-top: 2px;
  color: #64748b;
  font-size: 10px;
}

.row-print-template-arrow {
  color: #94a3b8;
  font-size: 22px;
  line-height: 1;
}
</style>
