<template>
  <div class="register-wrapper">

    <!-- Background decorations -->
    <div class="bg-grid" aria-hidden="true"></div>
    <div class="bg-glow" aria-hidden="true"></div>

    <div class="register-card">

      <!-- LOGO -->
      <div class="logo">
        <div class="logo-mark" aria-hidden="true">
          <span>I</span>
        </div>
        <div class="logo-text">
          <h1>IMISS</h1>
          <p>Create your account</p>
        </div>
      </div>

      <!-- ORGANIZATION NAME DISPLAY -->
      

      <div class="divider-line"></div>

      <!-- ERROR -->
      <transition name="slide-down">
        <div v-if="errorMessage" class="alert-box alert-error" role="alert">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          {{ errorMessage }}
        </div>
      </transition>

      <!-- SUCCESS -->
      <transition name="slide-down">
        <div v-if="successMessage" class="alert-box alert-success" role="status">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
          {{ successMessage }}
        </div>
      </transition>

      <!-- FORM -->
      <form class="form" @submit.prevent="register" novalidate>

        <!-- ORGANIZATION NAME -->
        <div class="field" :class="{ focused: focusedField === 'organizationName', filled: organizationName, error: fieldErrors.organizationName }">
          <label for="organizationName" class="field-label">Organization Name</label>
          <div class="field-inner">
            <svg class="field-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
            <input
              id="organizationName"
              v-model="organizationName"
              type="text"
              :disabled="loading"
              autocomplete="organization"
              @focus="focusedField = 'organizationName'"
              @blur="onBlur('organizationName')"
              @input="fieldErrors.organizationName = ''"
            />
            <transition name="check-pop">
              <svg v-if="organizationName && !fieldErrors.organizationName" class="field-check" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>
            </transition>
          </div>
          <p v-if="fieldErrors.organizationName" class="field-error">{{ fieldErrors.organizationName }}</p>
        </div>

        <!-- ROW: Username + Email side-by-side on wider screens -->
        <div class="field-row">

          <!-- USERNAME -->
          <div class="field" :class="{ focused: focusedField === 'username', filled: username, error: fieldErrors.username }">
            <label for="username" class="field-label">Username</label>
            <div class="field-inner">
              <svg class="field-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
              <input
                id="username"
                v-model="username"
                type="text"
                :disabled="loading"
                autocomplete="username"
                @focus="focusedField = 'username'"
                @blur="onBlur('username')"
                @input="fieldErrors.username = ''"
              />
              <transition name="check-pop">
                <svg v-if="username && !fieldErrors.username" class="field-check" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>
              </transition>
            </div>
            <p v-if="fieldErrors.username" class="field-error">{{ fieldErrors.username }}</p>
          </div>

          <!-- EMAIL -->
          <div class="field" :class="{ focused: focusedField === 'email', filled: email, error: fieldErrors.email }">
            <label for="email" class="field-label">Email</label>
            <div class="field-inner">
              <svg class="field-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
              <input
                id="email"
                v-model="email"
                type="email"
                :disabled="loading"
                autocomplete="email"
                @focus="focusedField = 'email'"
                @blur="onBlur('email')"
                @input="fieldErrors.email = ''"
              />
              <transition name="check-pop">
                <svg v-if="isValidEmail && !fieldErrors.email" class="field-check" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>
              </transition>
            </div>
            <p v-if="fieldErrors.email" class="field-error">{{ fieldErrors.email }}</p>
          </div>

        </div>

        <!-- MOBILE NUMBER -->
        <div class="field" :class="{ focused: focusedField === 'mobile', filled: mobile, error: fieldErrors.mobile }">
          <label for="mobile" class="field-label">Mobile Number <span class="field-label-badge">For verification</span></label>
          <div class="field-inner">
            <svg class="field-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>
            <input
              id="mobile"
              v-model="mobile"
              type="tel"
              :disabled="loading"
              autocomplete="tel"
              placeholder="+63 900 000 0000"
              @focus="focusedField = 'mobile'"
              @blur="onBlur('mobile')"
              @input="fieldErrors.mobile = ''"
            />
            <transition name="check-pop">
              <svg v-if="isValidMobile && !fieldErrors.mobile" class="field-check" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>
            </transition>
          </div>
          <p v-if="fieldErrors.mobile" class="field-error">{{ fieldErrors.mobile }}</p>
        </div>

        <!-- PASSWORD -->
        <div class="field" :class="{ focused: focusedField === 'password', filled: password }">
          <label for="password" class="field-label">Password</label>
          <div class="field-inner">
            <svg class="field-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
            <input
              id="password"
              v-model="password"
              :type="showPassword ? 'text' : 'password'"
              :disabled="loading"
              autocomplete="new-password"
              @focus="focusedField = 'password'"
              @blur="focusedField = ''"
            />
            <button
              type="button"
              class="eye-toggle"
              @click="showPassword = !showPassword"
              :aria-label="showPassword ? 'Hide password' : 'Show password'"
            >
              <svg v-if="showPassword" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
              <svg v-else width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
            </button>
          </div>

          <!-- PASSWORD STRENGTH -->
          <div v-if="password" class="strength-section" aria-label="Password strength">
            <div class="strength-bars" role="presentation">
              <span
                v-for="i in 4"
                :key="i"
                class="strength-bar"
                :class="{ active: i <= passwordStrength.level, [`c-${passwordStrength.color}`]: i <= passwordStrength.level }"
              ></span>
            </div>
            <span class="strength-label" :class="`text-${passwordStrength.color}`">{{ passwordStrength.label }}</span>
          </div>
        </div>

        <!-- CONFIRM PASSWORD -->
        <div class="field" :class="{ focused: focusedField === 'confirm', filled: confirmPassword, error: fieldErrors.confirm }">
          <label for="confirm" class="field-label">Confirm Password</label>
          <div class="field-inner">
            <svg class="field-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
            <input
              id="confirm"
              v-model="confirmPassword"
              :type="showPassword ? 'text' : 'password'"
              :disabled="loading"
              autocomplete="new-password"
              @focus="focusedField = 'confirm'"
              @blur="onBlur('confirm')"
              @input="fieldErrors.confirm = ''"
            />
            <transition name="check-pop">
              <svg v-if="confirmPassword && password === confirmPassword" class="field-check" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>
            </transition>
          </div>
          <p v-if="fieldErrors.confirm" class="field-error">{{ fieldErrors.confirm }}</p>
        </div>

        <!-- SUBMIT -->
        <button type="submit" class="submit-btn" :disabled="loading" :class="{ loading }">
          <span v-if="loading" class="spinner" aria-hidden="true"></span>
          <span>{{ loading ? 'Creating account…' : 'Create Account' }}</span>
        </button>

      </form>

      <!-- BACK TO LOGIN -->
      <p class="login-prompt">
        Already have an account?
        <router-link to="/" class="login-link">Sign in</router-link>
      </p>

    </div>
  </div>
</template>

<script setup>
import { ref, computed, reactive } from 'vue'
import { useRouter } from 'vue-router'
import api from '@/api/axios'

const router = useRouter()

const organizationName = ref('')
const username = ref('')
const email = ref('')
const mobile = ref('')
const password = ref('')
const confirmPassword = ref('')

const loading = ref(false)
const showPassword = ref(false)
const errorMessage = ref('')
const successMessage = ref('')
const focusedField = ref('')

const fieldErrors = reactive({
  organizationName: '',
  username: '',
  email: '',
  mobile: '',
  confirm: '',
})

/* ─── EMAIL VALIDATION ─── */
const isValidEmail = computed(() =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value)
)

/* ─── MOBILE VALIDATION ─── */
const isValidMobile = computed(() =>
  /^[+]?[\d\s\-().]{7,15}$/.test(mobile.value.trim())
)

/* ─── PASSWORD STRENGTH ─── */
const passwordStrength = computed(() => {
  const p = password.value
  if (!p) return { level: 0, label: '', color: 'gray' }

  let score = 0
  if (p.length >= 8) score++
  if (/[A-Z]/.test(p)) score++
  if (/[0-9]/.test(p)) score++
  if (/[^A-Za-z0-9]/.test(p)) score++

  const map = [
    { level: 1, label: 'Weak',    color: 'red'    },
    { level: 2, label: 'Fair',    color: 'amber'  },
    { level: 3, label: 'Good',    color: 'blue'   },
    { level: 4, label: 'Strong',  color: 'green'  },
  ]
  return map[score - 1] || { level: 1, label: 'Weak', color: 'red' }
})

/* ─── BLUR VALIDATION ─── */
const onBlur = (field) => {
  focusedField.value = ''
  if (field === 'organizationName' && organizationName.value && organizationName.value.length < 2) {
    fieldErrors.organizationName = 'At least 2 characters required'
  }
  if (field === 'email' && email.value && !isValidEmail.value) {
    fieldErrors.email = 'Enter a valid email address'
  }
  if (field === 'mobile' && mobile.value && !isValidMobile.value) {
    fieldErrors.mobile = 'Enter a valid mobile number'
  }
  if (field === 'confirm' && confirmPassword.value && password.value !== confirmPassword.value) {
    fieldErrors.confirm = 'Passwords do not match'
  }
  if (field === 'username' && username.value && username.value.length < 3) {
    fieldErrors.username = 'At least 3 characters required'
  }
}

/* ─── REGISTER ─── */
const register = async () => {
  errorMessage.value = ''
  successMessage.value = ''

  // Full validation pass
  let hasError = false
  if (!organizationName.value || organizationName.value.length < 2) {
    fieldErrors.organizationName = 'At least 2 characters required'
    hasError = true
  }
  if (!username.value || username.value.length < 3) {
    fieldErrors.username = 'At least 3 characters required'
    hasError = true
  }
  if (!email.value || !isValidEmail.value) {
    fieldErrors.email = 'Enter a valid email address'
    hasError = true
  }
  if (!mobile.value || !isValidMobile.value) {
    fieldErrors.mobile = 'Enter a valid mobile number'
    hasError = true
  }
  if (!password.value) {
    errorMessage.value = 'Please enter a password'
    hasError = true
  }
  if (password.value !== confirmPassword.value) {
    fieldErrors.confirm = 'Passwords do not match'
    hasError = true
  }
  if (hasError) return

  loading.value = true

  try {
    await api.post('/auth/register', {
      organizationName: organizationName.value,
      username: username.value,
      email: email.value,
      mobile: mobile.value,
      password: password.value,
    })

    successMessage.value = 'Account created! Redirecting to login…'

    setTimeout(() => router.push('/'), 1500)

  } catch (err) {
    errorMessage.value = err.response?.data?.message || 'Registration failed'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
/* ─── LAYOUT ─── */
.register-wrapper {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #0a0a0c;
  font-family: 'Inter', 'SF Pro Display', -apple-system, sans-serif;
  padding: 24px;
  position: relative;
  overflow: hidden;
}

.bg-grid {
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px);
  background-size: 48px 48px;
  pointer-events: none;
}

.bg-glow {
  position: absolute;
  width: 600px;
  height: 600px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(99,102,241,0.07) 0%, transparent 70%);
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  pointer-events: none;
}

/* ─── CARD ─── */
.register-card {
  width: 100%;
  max-width: 460px;
  background: #141416;
  border: 1px solid rgba(255,255,255,0.07);
  border-radius: 20px;
  padding: 36px 32px;
  position: relative;
  z-index: 1;
}

/* ─── LOGO ─── */
.logo {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-bottom: 12px;
}

.logo-mark {
  width: 44px;
  height: 44px;
  background: linear-gradient(135deg, #6366f1, #818cf8);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.logo-mark span {
  color: white;
  font-size: 22px;
  font-weight: 700;
  letter-spacing: -1px;
}

.logo-text h1 {
  margin: 0;
  font-size: 22px;
  font-weight: 700;
  color: #f0f0f4;
  letter-spacing: -0.5px;
}

.logo-text p {
  margin: 2px 0 0;
  font-size: 12px;
  color: #6b7280;
  letter-spacing: 0.02em;
}

/* ─── ORG BADGE ─── */
.org-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: rgba(99,102,241,0.1);
  border: 1px solid rgba(99,102,241,0.25);
  color: #a5b4fc;
  font-size: 12px;
  font-weight: 500;
  padding: 4px 10px;
  border-radius: 99px;
  margin-bottom: 16px;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.divider-line {
  height: 1px;
  background: rgba(255,255,255,0.06);
  margin-bottom: 24px;
}

/* ─── ALERTS ─── */
.alert-box {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  border-radius: 10px;
  font-size: 13px;
  margin-bottom: 16px;
}

.alert-error {
  background: rgba(248,113,113,0.1);
  color: #f87171;
  border: 1px solid rgba(248,113,113,0.2);
}

.alert-success {
  background: rgba(52,211,153,0.1);
  color: #34d399;
  border: 1px solid rgba(52,211,153,0.2);
}

/* ─── FORM ─── */
.form {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.field-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

@media (max-width: 440px) {
  .field-row {
    grid-template-columns: 1fr;
  }
}

.field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.field-label {
  font-size: 11px;
  font-weight: 500;
  color: #6b7280;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  transition: color 0.2s;
  display: flex;
  align-items: center;
  gap: 6px;
}

.field-label-badge {
  font-size: 10px;
  font-weight: 500;
  background: rgba(99,102,241,0.15);
  color: #818cf8;
  border: 1px solid rgba(99,102,241,0.2);
  border-radius: 99px;
  padding: 1px 7px;
  letter-spacing: 0.03em;
  text-transform: none;
}

.field.focused .field-label {
  color: #818cf8;
}

.field.error .field-label {
  color: #f87171;
}

.field-inner {
  position: relative;
  display: flex;
  align-items: center;
}

.field-icon {
  position: absolute;
  left: 13px;
  color: #4b5563;
  transition: color 0.2s;
  pointer-events: none;
}

.field.focused .field-icon {
  color: #818cf8;
}

.field.error .field-icon {
  color: #f87171;
}

.field-inner input {
  width: 100%;
  box-sizing: border-box;
  padding: 11px 36px 11px 38px;
  background: #1c1c1f;
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 10px;
  color: #f0f0f4;
  font-size: 14px;
  font-family: inherit;
  outline: none;
  transition: border-color 0.2s, background 0.2s;
}

.field-inner input::placeholder {
  color: #3d3d42;
  font-size: 13px;
}

.field-inner input:focus {
  border-color: rgba(99,102,241,0.5);
  background: #1e1e22;
}

.field.error .field-inner input {
  border-color: rgba(248,113,113,0.4);
}

.field-inner input:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Checkmark inside field */
.field-check {
  position: absolute;
  right: 12px;
  color: #34d399;
  pointer-events: none;
}

.eye-toggle {
  position: absolute;
  right: 10px;
  background: none;
  border: none;
  cursor: pointer;
  color: #4b5563;
  padding: 4px;
  display: flex;
  align-items: center;
  transition: color 0.2s;
}

.eye-toggle:hover {
  color: #9ca3af;
}

.field-error {
  font-size: 11.5px;
  color: #f87171;
  margin: 0;
}

/* ─── PASSWORD STRENGTH ─── */
.strength-section {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 2px;
}

.strength-bars {
  display: flex;
  gap: 4px;
  flex: 1;
}

.strength-bar {
  flex: 1;
  height: 3px;
  border-radius: 99px;
  background: rgba(255,255,255,0.08);
  transition: background 0.3s;
}

.strength-bar.active.c-red    { background: #f87171; }
.strength-bar.active.c-amber  { background: #fbbf24; }
.strength-bar.active.c-blue   { background: #60a5fa; }
.strength-bar.active.c-green  { background: #34d399; }

.strength-label {
  font-size: 11px;
  font-weight: 500;
  min-width: 38px;
  text-align: right;
}

.text-red   { color: #f87171; }
.text-amber { color: #fbbf24; }
.text-blue  { color: #60a5fa; }
.text-green { color: #34d399; }

/* ─── SUBMIT BUTTON ─── */
.submit-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
  padding: 12px;
  background: linear-gradient(135deg, #6366f1, #818cf8);
  color: white;
  border: none;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  font-family: inherit;
  transition: opacity 0.2s, transform 0.15s;
  margin-top: 4px;
}

.submit-btn:hover:not(:disabled) {
  opacity: 0.92;
  transform: translateY(-1px);
}

.submit-btn:active:not(:disabled) {
  transform: translateY(0);
}

.submit-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.spinner {
  width: 15px;
  height: 15px;
  border: 2px solid rgba(255,255,255,0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
  flex-shrink: 0;
}

@keyframes spin { to { transform: rotate(360deg); } }

/* ─── LOGIN PROMPT ─── */
.login-prompt {
  text-align: center;
  font-size: 13px;
  color: #6b7280;
  margin-top: 20px;
  margin-bottom: 0;
}

.login-link {
  color: #818cf8;
  text-decoration: none;
  font-weight: 500;
}

.login-link:hover {
  color: #a5b4fc;
}

/* ─── TRANSITIONS ─── */
.slide-down-enter-active,
.slide-down-leave-active {
  transition: all 0.25s ease;
}

.slide-down-enter-from,
.slide-down-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}

.check-pop-enter-active {
  transition: all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.check-pop-enter-from {
  opacity: 0;
  transform: scale(0.5);
}
</style>