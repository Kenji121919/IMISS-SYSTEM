<template>
  <div class="login-wrapper">

    <!-- Background grid decoration -->
    <div class="bg-grid" aria-hidden="true"></div>
    <div class="bg-glow" aria-hidden="true"></div>

    <div class="login-card" :class="{ shake: shakeError }">

      <!-- LOGO -->
      <div class="logo">
        <div class="logo-mark">
          <span>I</span>
        </div>
        <div class="logo-text">
          <h1>IMISS</h1>
          <p>Daily Logs System</p>
        </div>
      </div>

      <div class="divider-line"></div>

      <!-- ERROR -->
      <transition name="slide-down">
        <div v-if="errorMessage" class="alert-box alert-error" role="alert">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          {{ errorMessage }}
        </div>
      </transition>

      <!-- FORM -->
      <form class="form" @submit.prevent="login" novalidate>

        <!-- IDENTIFIER -->
        <div class="field" :class="{ focused: focusedField === 'identifier', filled: identifier }">
          <label for="identifier" class="field-label">Username or Email</label>
          <div class="field-inner">
            <svg class="field-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            <input
              id="identifier"
              v-model="identifier"
              type="text"
              :disabled="loading"
              autocomplete="username"
              @focus="focusedField = 'identifier'"
              @blur="focusedField = ''"
            />
          </div>
        </div>

        <!-- PASSWORD -->
        <div class="field" :class="{ focused: focusedField === 'password', filled: password }">
          <label for="password" class="field-label">Password</label>
          <div class="field-inner">
            <svg class="field-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
            <input
              id="password"
              v-model="password"
              :type="showPassword ? 'text' : 'password'"
              :disabled="loading"
              autocomplete="current-password"
              @focus="focusedField = 'password'"
              @blur="focusedField = ''"
            />
            <button
              type="button"
              class="eye-toggle"
              @click="showPassword = !showPassword"
              :aria-label="showPassword ? 'Hide password' : 'Show password'"
            >
              <svg v-if="showPassword" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
              <svg v-else width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
            </button>
          </div>
        </div>

        <!-- FORGOT -->
        <div class="form-meta">
          <button type="button" class="link-btn" @click="forgotPassword">Forgot password?</button>
        </div>

        <!-- LOGIN BUTTON -->
        <button type="submit" class="submit-btn" :disabled="loading" :class="{ loading }">
          <span v-if="loading" class="spinner" aria-hidden="true"></span>
          <span>{{ loading ? 'Signing in…' : 'Sign In' }}</span>
        </button>

      </form>

      <!-- DIVIDER -->
      <div class="or-divider">
        <span>or</span>
      </div>

      <!-- GOOGLE LOGIN -->
      <button class="google-btn" type="button" @click="loginWithGoogle">
        <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
        Continue with Google
      </button>

      <!-- REGISTER -->
      <p class="register-prompt">
        New to IMISS?
        <router-link to="/register" class="register-link">Create an account</router-link>
      </p>

    </div>

    <!-- ===== FORGOT PASSWORD MODAL ===== -->
    <transition name="modal-fade">
      <div v-if="showForgotModal" class="modal-backdrop" @click.self="closeForgotModal">
        <div class="modal-box" :class="{ shake: modalShake }">

          <!-- STEP 1: Choose method -->
          <template v-if="forgotStep === 1">
            <div class="modal-head">
              <h3>Reset your password</h3>
              <p>How would you like to receive your reset code?</p>
              <button class="modal-close" @click="closeForgotModal">✕</button>
            </div>
            <div class="method-options">
              <button class="method-btn" :disabled="forgotLoading" @click="selectMethod('email')">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                <div>
                  <strong>Email</strong>
                  <span>Send a 6-digit code to your email</span>
                </div>
                <span v-if="forgotLoading && forgotMethod === 'email'" class="spinner-sm" style="margin-left:auto"></span>
              </button>
              <button class="method-btn" :disabled="forgotLoading" @click="selectMethod('sms')">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>
                <div>
                  <strong>SMS</strong>
                  <span>Send a 6-digit code to your mobile</span>
                </div>
                <span v-if="forgotLoading && forgotMethod === 'sms'" class="spinner-sm" style="margin-left:auto"></span>
              </button>
            </div>
            <transition name="slide-down">
              <p v-if="forgotError" class="modal-error">{{ forgotError }}</p>
            </transition>
          </template>

          <!-- STEP 2: Enter OTP -->
          <template v-else-if="forgotStep === 2">
            <div class="modal-head">
              <h3>Enter your code</h3>
              <p>{{ sentMessage }}</p>
              <button class="modal-close" @click="closeForgotModal">✕</button>
            </div>
            <div class="otp-inputs">
              <input
                v-for="(_, i) in otpDigits"
                :key="i"
                :ref="el => otpRefs[i] = el"
                v-model="otpDigits[i]"
                type="text"
                inputmode="numeric"
                maxlength="1"
                class="otp-box"
                @input="onOtpInput(i)"
                @keydown.backspace="onOtpBackspace(i)"
                @paste.prevent="onOtpPaste($event)"
              />
            </div>
            <transition name="slide-down">
              <p v-if="forgotError" class="modal-error">{{ forgotError }}</p>
            </transition>
            <div class="modal-actions">
              <button class="btn-ghost" @click="forgotStep = 1">Back</button>
              <button class="btn-primary" :disabled="otpFull || forgotLoading" @click="verifyOtp">
                <span v-if="forgotLoading" class="spinner-sm"></span>
                {{ forgotLoading ? 'Verifying…' : 'Verify Code' }}
              </button>
            </div>
            <p class="resend-text">
              Didn't receive it?
              <button class="link-btn" @click="resendOtp" :disabled="resendCooldown > 0">
                {{ resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend' }}
              </button>
            </p>
          </template>

          <!-- STEP 3: New password -->
          <template v-else-if="forgotStep === 3">
            <div class="modal-head">
              <h3>Set new password</h3>
              <p>Choose a strong password for your account.</p>
              <button class="modal-close" @click="closeForgotModal">✕</button>
            </div>
            <div class="modal-field">
              <label>New Password</label>
              <div class="modal-input-wrap">
                <input
                  v-model="newPassword"
                  :type="showNewPass ? 'text' : 'password'"
                  placeholder="At least 8 characters"
                />
                <button type="button" class="eye-toggle" @click="showNewPass = !showNewPass">
                  <svg v-if="showNewPass" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                  <svg v-else width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                </button>
              </div>
            </div>
            <div class="modal-field">
              <label>Confirm Password</label>
              <div class="modal-input-wrap">
                <input
                  v-model="confirmNewPassword"
                  :type="showNewPass ? 'text' : 'password'"
                  placeholder="Repeat your password"
                />
              </div>
            </div>
            <transition name="slide-down">
              <p v-if="forgotError" class="modal-error">{{ forgotError }}</p>
            </transition>
            <div class="modal-actions">
              <button class="btn-ghost" @click="forgotStep = 2">Back</button>
              <button class="btn-primary" :disabled="forgotLoading" @click="submitNewPassword">
                <span v-if="forgotLoading" class="spinner-sm"></span>
                {{ forgotLoading ? 'Saving…' : 'Save Password' }}
              </button>
            </div>
          </template>

          <!-- STEP 4: Success -->
          <template v-else-if="forgotStep === 4">
            <div class="modal-success">
              <div class="success-icon">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
              </div>
              <h3>Password updated!</h3>
              <p>You can now sign in with your new password.</p>
              <button class="btn-primary" style="width:100%;margin-top:8px;justify-content:center" @click="closeForgotModal">
                Back to Sign In
              </button>
            </div>
          </template>

        </div>
      </div>
    </transition>

  </div>
</template>

<script setup>
import { ref, computed, onMounted, reactive } from 'vue'
import { useRouter } from 'vue-router'
import api from '@/api/axios'

const router = useRouter()

// ─── LOGIN STATE ───
const identifier = ref('')
const password = ref('')
const loading = ref(false)
const showPassword = ref(false)
const errorMessage = ref('')
const shakeError = ref(false)
const focusedField = ref('')

// ─── FORGOT MODAL STATE ───
const showForgotModal = ref(false)
const forgotStep = ref(1)
const forgotMethod = ref('')
const forgotError = ref('')
const forgotLoading = ref(false)
const sentMessage = ref('')
const modalShake = ref(false)

// OTP
const otpDigits = reactive(['', '', '', '', '', ''])
const otpRefs = ref([])
const otpFull = computed(() => otpDigits.some(d => d === ''))

// New password
const newPassword = ref('')
const confirmNewPassword = ref('')
const showNewPass = ref(false)

// Resend cooldown
const resendCooldown = ref(0)
let cooldownTimer = null

onMounted(() => {
  const params = new URLSearchParams(window.location.search)
  if (params.get('error') === 'cancelled') {
    errorMessage.value = 'Google sign-in was cancelled'
  }
  const loggedOut = sessionStorage.getItem('loggedOut')
  if (loggedOut) {
    sessionStorage.removeItem('loggedOut')
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    localStorage.removeItem('activeProfile')
  }
})

// ─── LOGIN ───
const login = async () => {
  errorMessage.value = ''
  shakeError.value = false
  if (!identifier.value || !password.value) {
    errorMessage.value = 'Please fill in all fields'
    triggerShake()
    return
  }
  loading.value = true
  try {
    const res = await api.post('/auth/login', {
      identifier: identifier.value,
      password: password.value,
    })
    localStorage.setItem('token', res.data.access_token)
    localStorage.setItem('user', JSON.stringify(res.data.user))
    router.replace('/profiles')
  } catch (err) {
    errorMessage.value = err.response?.data?.message || 'Invalid credentials'
    triggerShake()
    identifier.value = ''
    password.value = ''
  } finally {
    loading.value = false
  }
}

const triggerShake = () => {
  shakeError.value = true
  setTimeout(() => shakeError.value = false, 500)
}

const triggerModalShake = () => {
  modalShake.value = true
  setTimeout(() => modalShake.value = false, 400)
}

// ─── FORGOT MODAL ───
const forgotPassword = () => {
  if (!identifier.value) {
    errorMessage.value = 'Enter your email or username first'
    return
  }
  forgotStep.value = 1
  forgotError.value = ''
  forgotMethod.value = ''
  otpDigits.forEach((_, i) => otpDigits[i] = '')
  newPassword.value = ''
  confirmNewPassword.value = ''
  showForgotModal.value = true
}

const closeForgotModal = () => {
  showForgotModal.value = false
  clearInterval(cooldownTimer)
  resendCooldown.value = 0
}

const selectMethod = async (method) => {
  forgotMethod.value = method
  forgotError.value = ''
  forgotLoading.value = true
  try {
    const res = await api.post('/auth/forgot-password', {
      identifier: identifier.value,
      method,
    })
    sentMessage.value = res.data.message
    forgotStep.value = 2
    startResendCooldown()
  } catch (err) {
    forgotError.value = err.response?.data?.message || 'Failed to send code'
    triggerModalShake()
  } finally {
    forgotLoading.value = false
  }
}

const startResendCooldown = () => {
  resendCooldown.value = 60
  clearInterval(cooldownTimer)
  cooldownTimer = setInterval(() => {
    resendCooldown.value--
    if (resendCooldown.value <= 0) clearInterval(cooldownTimer)
  }, 1000)
}

const resendOtp = async () => {
  otpDigits.forEach((_, i) => otpDigits[i] = '')
  forgotError.value = ''
  await selectMethod(forgotMethod.value)
}

// ─── OTP INPUT HANDLING ───
const onOtpInput = (i) => {
  otpDigits[i] = otpDigits[i].replace(/[^0-9]/g, '').slice(0, 1)
  if (otpDigits[i] && i < 5) {
    otpRefs.value[i + 1]?.focus()
  }
}

const onOtpBackspace = (i) => {
  if (!otpDigits[i] && i > 0) {
    otpDigits[i - 1] = ''
    otpRefs.value[i - 1]?.focus()
  }
}

const onOtpPaste = (e) => {
  const text = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
  text.split('').forEach((char, i) => { otpDigits[i] = char })
  otpRefs.value[Math.min(text.length, 5)]?.focus()
}

// ─── VERIFY OTP ───
const verifyOtp = async () => {
  forgotError.value = ''
  forgotLoading.value = true
  try {
    await api.post('/auth/verify-otp', {
      identifier: identifier.value,
      otp: otpDigits.join(''),
    })
    forgotStep.value = 3
  } catch (err) {
    forgotError.value = err.response?.data?.message || 'Invalid code'
    otpDigits.forEach((_, i) => otpDigits[i] = '')
    otpRefs.value[0]?.focus()
    triggerModalShake()
  } finally {
    forgotLoading.value = false
  }
}

// ─── SUBMIT NEW PASSWORD ───
const submitNewPassword = async () => {
  forgotError.value = ''
  if (!newPassword.value || newPassword.value.length < 8) {
    forgotError.value = 'Password must be at least 8 characters'
    return
  }
  if (newPassword.value !== confirmNewPassword.value) {
    forgotError.value = 'Passwords do not match'
    triggerModalShake()
    return
  }
  forgotLoading.value = true
  try {
    await api.post('/auth/reset-password', {
      identifier: identifier.value,
      otp: otpDigits.join(''),
      password: newPassword.value,
    })
    forgotStep.value = 4
  } catch (err) {
    forgotError.value = err.response?.data?.message || 'Failed to reset password'
    triggerModalShake()
  } finally {
    forgotLoading.value = false
  }
}

const loginWithGoogle = () => {
  window.location.href = 'http://172.16.2.31:3111/auth/google'
}
</script>

<style scoped>
/* ─── LAYOUT ─── */
.login-wrapper {
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
.login-card {
  width: 100%;
  max-width: 400px;
  background: #141416;
  border: 1px solid rgba(255,255,255,0.07);
  border-radius: 20px;
  padding: 36px 32px;
  position: relative;
  z-index: 1;
}

.shake {
  animation: shake 0.45s cubic-bezier(0.36, 0.07, 0.19, 0.97);
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  15%       { transform: translateX(-7px); }
  45%       { transform: translateX(7px); }
  65%       { transform: translateX(-4px); }
  85%       { transform: translateX(4px); }
}

/* ─── LOGO ─── */
.logo {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-bottom: 24px;
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

.divider-line {
  height: 1px;
  background: rgba(255,255,255,0.06);
  margin-bottom: 24px;
}

/* ─── ALERT ─── */
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

/* ─── FORM FIELDS ─── */
.form {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.field-label {
  font-size: 12px;
  font-weight: 500;
  color: #6b7280;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  transition: color 0.2s;
}

.field.focused .field-label { color: #818cf8; }

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

.field.focused .field-icon { color: #818cf8; }

.field-inner input {
  width: 100%;
  box-sizing: border-box;
  padding: 11px 40px 11px 40px;
  background: #1c1c1f;
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 10px;
  color: #f0f0f4;
  font-size: 14px;
  font-family: inherit;
  outline: none;
  transition: border-color 0.2s, background 0.2s;
}

.field-inner input::placeholder { color: transparent; }

.field-inner input:focus {
  border-color: rgba(99,102,241,0.5);
  background: #1e1e22;
}

.field-inner input:disabled {
  opacity: 0.5;
  cursor: not-allowed;
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

.eye-toggle:hover { color: #9ca3af; }

/* ─── FORM META ─── */
.form-meta {
  display: flex;
  justify-content: flex-end;
}

.link-btn {
  background: none;
  border: none;
  color: #6366f1;
  font-size: 12.5px;
  cursor: pointer;
  padding: 0;
  font-family: inherit;
  transition: color 0.2s;
}

.link-btn:hover { color: #818cf8; }
.link-btn:disabled { opacity: 0.4; cursor: not-allowed; }

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

.submit-btn:hover:not(:disabled) { opacity: 0.92; transform: translateY(-1px); }
.submit-btn:active:not(:disabled) { transform: translateY(0); }
.submit-btn:disabled { opacity: 0.6; cursor: not-allowed; }

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

/* ─── OR DIVIDER ─── */
.or-divider {
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 20px 0;
  color: #374151;
  font-size: 12px;
}

.or-divider::before,
.or-divider::after {
  content: '';
  flex: 1;
  height: 1px;
  background: rgba(255,255,255,0.06);
}

/* ─── GOOGLE BUTTON ─── */
.google-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  width: 100%;
  padding: 11px;
  background: #1c1c1f;
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 10px;
  color: #d1d5db;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  font-family: inherit;
  transition: background 0.2s, border-color 0.2s;
}

.google-btn:hover { background: #242428; border-color: rgba(255,255,255,0.13); }

/* ─── REGISTER PROMPT ─── */
.register-prompt {
  text-align: center;
  font-size: 13px;
  color: #6b7280;
  margin-top: 20px;
  margin-bottom: 0;
}

.register-link {
  color: #818cf8;
  text-decoration: none;
  font-weight: 500;
}

.register-link:hover { color: #a5b4fc; }

/* ─── FORGOT MODAL ─── */
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  backdrop-filter: blur(6px);
  padding: 24px;
}

.modal-box {
  background: #141416;
  border: 1px solid rgba(255,255,255,0.09);
  border-radius: 20px;
  padding: 28px;
  width: 100%;
  max-width: 400px;
}

.modal-box.shake {
  animation: shake 0.4s cubic-bezier(0.36, 0.07, 0.19, 0.97);
}

.modal-head {
  position: relative;
  margin-bottom: 20px;
}

.modal-head h3 {
  margin: 0 0 4px;
  font-size: 17px;
  font-weight: 700;
  color: #f0f0f4;
  padding-right: 28px;
}

.modal-head p {
  margin: 0;
  font-size: 13px;
  color: #6b7280;
}

.modal-close {
  position: absolute;
  top: 0;
  right: 0;
  background: none;
  border: none;
  color: #6b7280;
  font-size: 16px;
  cursor: pointer;
  padding: 2px 6px;
  border-radius: 6px;
  font-family: inherit;
  line-height: 1;
}

.modal-close:hover { color: #f0f0f4; background: rgba(255,255,255,0.06); }

/* ─── METHOD SELECTION ─── */
.method-options {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.method-btn {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px 16px;
  background: #1c1c1f;
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 12px;
  color: #f0f0f4;
  cursor: pointer;
  font-family: inherit;
  text-align: left;
  transition: all 0.2s;
  width: 100%;
}

.method-btn:hover:not(:disabled) { background: #242428; border-color: rgba(99,102,241,0.4); }
.method-btn:disabled { opacity: 0.5; cursor: not-allowed; }
.method-btn svg { color: #818cf8; flex-shrink: 0; }
.method-btn strong { display: block; font-size: 14px; font-weight: 600; margin-bottom: 2px; }
.method-btn span { font-size: 12px; color: #6b7280; }

/* ─── OTP INPUTS ─── */
.otp-inputs {
  display: flex;
  gap: 8px;
  justify-content: center;
  margin: 8px 0 16px;
}

.otp-box {
  width: 44px;
  height: 52px;
  text-align: center;
  font-size: 22px;
  font-weight: 700;
  background: #1c1c1f;
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 10px;
  color: #f0f0f4;
  outline: none;
  font-family: inherit;
  transition: border-color 0.2s;
}

.otp-box:focus { border-color: rgba(99,102,241,0.6); background: #1e1e22; }

/* ─── MODAL FIELDS ─── */
.modal-field {
  margin-bottom: 12px;
}

.modal-field label {
  display: block;
  font-size: 11px;
  font-weight: 500;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 6px;
}

.modal-input-wrap {
  position: relative;
}

.modal-input-wrap input {
  width: 100%;
  box-sizing: border-box;
  padding: 11px 40px 11px 14px;
  background: #1c1c1f;
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 10px;
  color: #f0f0f4;
  font-size: 14px;
  font-family: inherit;
  outline: none;
  transition: border-color 0.2s;
}

.modal-input-wrap input::placeholder { color: #3d3d42; }
.modal-input-wrap input:focus { border-color: rgba(99,102,241,0.5); background: #1e1e22; }

.modal-input-wrap .eye-toggle {
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
}

/* ─── MODAL ACTIONS ─── */
.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 16px;
}

.modal-error {
  font-size: 12.5px;
  color: #f87171;
  margin: 8px 0 0;
}

.resend-text {
  text-align: center;
  font-size: 12.5px;
  color: #6b7280;
  margin-top: 14px;
  margin-bottom: 0;
}

/* ─── SUCCESS STATE ─── */
.modal-success {
  text-align: center;
  padding: 8px 0;
}

.success-icon {
  width: 56px;
  height: 56px;
  background: rgba(52,211,153,0.12);
  border: 1px solid rgba(52,211,153,0.25);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 16px;
  color: #34d399;
}

.modal-success h3 {
  font-size: 18px;
  font-weight: 700;
  color: #f0f0f4;
  margin: 0 0 6px;
}

.modal-success p {
  font-size: 13px;
  color: #6b7280;
  margin: 0 0 20px;
}

/* ─── SHARED MODAL BUTTONS ─── */
.btn-ghost {
  background: transparent;
  border: 1px solid rgba(255,255,255,0.1);
  color: #6b7280;
  padding: 9px 16px;
  border-radius: 10px;
  font-size: 13px;
  cursor: pointer;
  font-family: inherit;
  transition: all 0.15s;
}

.btn-ghost:hover { background: rgba(255,255,255,0.05); color: #f0f0f4; }

.btn-primary {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: linear-gradient(135deg, #6366f1, #818cf8);
  color: white;
  border: none;
  padding: 9px 18px;
  border-radius: 10px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  font-family: inherit;
  transition: opacity 0.2s;
}

.btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
.btn-primary:hover:not(:disabled) { opacity: 0.9; }

.spinner-sm {
  width: 12px;
  height: 12px;
  border: 2px solid rgba(255,255,255,0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
  flex-shrink: 0;
}

/* ─── TRANSITIONS ─── */
.slide-down-enter-active,
.slide-down-leave-active { transition: all 0.25s ease; }
.slide-down-enter-from,
.slide-down-leave-to { opacity: 0; transform: translateY(-8px); }

.modal-fade-enter-active,
.modal-fade-leave-active { transition: all 0.25s ease; }
.modal-fade-enter-from,
.modal-fade-leave-to { opacity: 0; transform: scale(0.96); }
</style>