<template>
  <div class="login-wrapper">

    <div class="login-card" :class="{ shake: shakeError }">

      <!-- HEADER -->
      <div class="logo">
        <h1>IMISS</h1>
        <p>Daily Logs System</p>
      </div>

      <!-- ERROR MESSAGE (INSIDE CARD) -->
      <div v-if="errorMessage" class="error-box">
        {{ errorMessage }}
      </div>

      <!-- FORM -->
      <form class="form" @submit.prevent="login">

        <!-- USERNAME -->
        <input
          v-model="username"
          type="text"
          placeholder="Username"
          autocomplete="username"
        />

        <!-- PASSWORD -->
        <div class="password-wrapper">

          <input
            v-model="password"
            :type="showPassword ? 'text' : 'password'"
            placeholder="Password"
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

    </div>

  </div>
</template>

<script setup>
import { ref } from 'vue'
import api from '@/api/axios'

const username = ref('')
const password = ref('')

const loading = ref(false)
const showPassword = ref(false)
const shakeError = ref(false)
const errorMessage = ref('')

const login = async () => {
  loading.value = true
  errorMessage.value = ''
  shakeError.value = false

  try {
    const res = await api.post('/auth/login', {
      username: username.value,
      password: password.value,
    })

    // ✅ STORE TOKEN
    localStorage.setItem('token', res.data.access_token)

    // ✅ STORE USER
    localStorage.setItem(
      'user',
      JSON.stringify(res.data.user)
    )

    // go to profiles
    window.location.href = '/profiles'

  } catch (err) {
    console.error(err)

    errorMessage.value = 'Invalid username or password'
    shakeError.value = true

    username.value = ''
    password.value = ''

    setTimeout(() => (shakeError.value = false), 500)
    setTimeout(() => (errorMessage.value = ''), 3000)

  } finally {
    loading.value = false
  }
}
</script>

<style>
/* BACKGROUND */
.login-wrapper {
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background: linear-gradient(135deg, #111, #222);
}

/* CARD */
.login-card {
  width: 100%;
  max-width: 360px;
  background: white;
  padding: 30px;
  border-radius: 12px;
  box-shadow: 0 20px 60px rgba(0,0,0,0.4);
  text-align: center;
}

/* SHAKE */
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

/* LOGO */
.logo h1 {
  margin: 0;
  font-size: 28px;
}

.logo p {
  margin: 5px 0 20px;
  color: gray;
  font-size: 13px;
}

/* ERROR BOX */
.error-box {
  background: #ffe5e5;
  color: #d10000;
  padding: 10px;
  border-radius: 8px;
  font-size: 13px;
  margin-bottom: 12px;
  border: 1px solid #ffb3b3;
  animation: fadeIn 0.2s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-5px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* FORM */
.form {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

/* INPUT */
input {
  width: 100%;
  box-sizing: border-box;
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 8px;
  outline: none;
}

/* PASSWORD WRAPPER */
.password-wrapper {
  position: relative;
  width: 100%;
}

.password-wrapper input {
  padding-right: 40px;
}

/* EYE ICON */
.eye-icon {
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);

  border: none;
  background: transparent;
  cursor: pointer;
  font-size: 14px;
  color: #555;
}

/* LOGIN BUTTON */
.login-btn {
  padding: 12px;
  background: #1e90ff;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: bold;

  display: flex;
  justify-content: center;
  align-items: center;
}

/* SPINNER */
.spinner {
  width: 16px;
  height: 16px;
  border: 2px solid white;
  border-top: 2px solid transparent;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>