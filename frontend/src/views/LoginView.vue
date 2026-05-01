<template>
  <div class="login-wrapper">

    <div class="login-card" :class="{ shake: shakeError }">

      <!-- LOGO -->
      <div class="logo">
        <h1>IMISS</h1>
        <p>Daily Logs System</p>
      </div>

      <!-- ERROR -->
      <div v-if="errorMessage" class="error-box">
        {{ errorMessage }}
      </div>

      <!-- FORM -->
      <form class="form" @submit.prevent="login">

        <!-- USERNAME OR EMAIL -->
        <input
          v-model="identifier"
          placeholder="Username or Email"
          :disabled="loading"
          autocomplete="username"
        />

        <!-- PASSWORD -->
        <div class="password-wrapper">
          <input
            v-model="password"
            :type="showPassword ? 'text' : 'password'"
            placeholder="Password"
            :disabled="loading"
            autocomplete="current-password"
          />

          <button
            type="button"
            class="eye-icon"
            @click="showPassword = !showPassword"
          >
            👁
          </button>
        </div>

        <!-- LOGIN BUTTON -->
        <button type="submit" class="login-btn" :disabled="loading">
          <span v-if="loading" class="spinner"></span>
          <span v-else>Login</span>
        </button>

      </form>

      <!-- FORGOT PASSWORD -->
      <p class="forgot" @click="forgotPassword">
        Forgot Password?
      </p>

      <!-- DIVIDER -->
      <div class="divider">or</div>

      <!-- GOOGLE LOGIN -->
      <button class="google-btn" @click="loginWithGoogle">
        Continue with Google
      </button>

      <!-- REGISTER -->
      <p class="register">
        Don’t have an account?
        <router-link to="/register" class="link">
        Register
        </router-link>
      </p>

    </div>

  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import api from '@/api/axios'

const router = useRouter()

const identifier = ref('')
const password = ref('')
const loading = ref(false)
const showPassword = ref(false)
const errorMessage = ref('')
const shakeError = ref(false)

/* =========================
   AUTO REDIRECT IF LOGGED IN
========================= */
onMounted(() => {
  const token = localStorage.getItem('token')
  const route = router.currentRoute.value.name

  if (token && route === 'login') {
    router.replace('/profiles')
  }
})

/* =========================
   LOGIN
========================= */
const login = async () => {
  errorMessage.value = ''
  shakeError.value = false

  if (!identifier.value || !password.value) {
    errorMessage.value = 'Please fill all fields'
    shakeError.value = true
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
    errorMessage.value =
      err.response?.data?.message || 'Invalid credentials'

    shakeError.value = true

    identifier.value = ''
    password.value = ''

    setTimeout(() => (shakeError.value = false), 500)

  } finally {
    loading.value = false
  }
}

/* =========================
   FORGOT PASSWORD
========================= */
const forgotPassword = async () => {
  if (!identifier.value) {
    errorMessage.value = 'Enter email or username first'
    return
  }

  try {
    await api.post('/auth/forgot-password', {
      identifier: identifier.value,
    })

    alert('Reset link sent if account exists')

  } catch (err) {
    errorMessage.value = 'Failed to process request'
  }
}

/* =========================
   GOOGLE LOGIN
========================= */
const loginWithGoogle = () => {
  window.location.href = 'http://localhost:3000/auth/google'
}

/* =========================
   REGISTER (FIXED)
========================= */
const goRegister = () => {
  console.log('REGISTER CLICKED')
  router.push('/register')
}
</script>

<style scoped>
.login-wrapper {
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background: linear-gradient(135deg, #111, #222);
}

.login-card {
  width: 100%;
  max-width: 360px;
  background: white;
  padding: 30px;
  border-radius: 12px;
  box-shadow: 0 20px 60px rgba(0,0,0,0.4);
  text-align: center;
}

.shake {
  animation: shake 0.4s ease;
}

@keyframes shake {
  0% { transform: translateX(0); }
  25% { transform: translateX(-6px); }
  50% { transform: translateX(6px); }
  75% { transform: translateX(-6px); }
  100% { transform: translateX(0); }
}

.logo h1 {
  margin: 0;
  font-size: 28px;
}

.logo p {
  margin: 5px 0 20px;
  color: gray;
  font-size: 13px;
}

.error-box {
  background: #ffe5e5;
  color: #d10000;
  padding: 10px;
  border-radius: 8px;
  font-size: 13px;
  margin-bottom: 12px;
}

.form {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

input {
  width: 100%;
  box-sizing: border-box;
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 8px;
  outline: none;
}

.password-wrapper {
  position: relative;
}

.eye-icon {
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  border: none;
  background: transparent;
  cursor: pointer;
}

.login-btn {
  padding: 12px;
  background: #1e90ff;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: bold;
}

.forgot {
  margin-top: 10px;
  font-size: 12px;
  color: #1e90ff;
  cursor: pointer;
}

.register-link {
  color: #1e90ff;
  cursor: pointer;
  font-weight: bold;
}

.spinner {
  width: 16px;
  height: 16px;
  border: 2px solid white;
  border-top: 2px solid transparent;
  border-radius: 50%;
  display: inline-block;
  animation: spin 0.7s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>