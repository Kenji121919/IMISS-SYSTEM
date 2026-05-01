<template>
  <div class="register-wrapper">

    <div class="register-card">

      <h2>Create Account</h2>
      <p>Register a new IMISS account</p>

      <!-- ERROR -->
      <div v-if="errorMessage" class="error-box">
        {{ errorMessage }}
      </div>

      <!-- SUCCESS -->
      <div v-if="successMessage" class="success-box">
        {{ successMessage }}
      </div>

      <!-- FORM -->
      <input
        v-model="username"
        placeholder="Username"
        autocomplete="username"
      />

      <input
        v-model="email"
        placeholder="Email"
        autocomplete="email"
      />

      <input
        v-model="password"
        type="password"
        placeholder="Password"
        autocomplete="new-password"
      />

      <input
        v-model="confirmPassword"
        type="password"
        placeholder="Confirm Password"
        autocomplete="new-password"
      />

      <!-- BUTTON -->
      <button class="register-btn" @click="register" :disabled="loading">
        <span v-if="loading">Creating...</span>
        <span v-else>Register</span>
      </button>

      <!-- BACK TO LOGIN -->
      <p class="back">
        Already have an account?
        <span @click="router.push('/')">Login</span>
      </p>

    </div>

  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import api from '@/api/axios'

const router = useRouter()

const username = ref('')
const email = ref('')
const password = ref('')
const confirmPassword = ref('')

const loading = ref(false)
const errorMessage = ref('')
const successMessage = ref('')

/* ================= REGISTER ================= */
const register = async () => {
  errorMessage.value = ''
  successMessage.value = ''

  // validation
  if (!username.value || !email.value || !password.value) {
    errorMessage.value = 'Please fill all fields'
    return
  }

  if (password.value !== confirmPassword.value) {
    errorMessage.value = 'Passwords do not match'
    return
  }

  loading.value = true

  try {
    await api.post('/auth/register', {
      username: username.value,
      email: email.value,
      password: password.value,
    })

    // SUCCESS MESSAGE
    successMessage.value = 'Account created successfully! Redirecting...'

    // small delay before redirect
    setTimeout(() => {
      router.push('/')
    }, 1500)

  } catch (err) {
    errorMessage.value =
      err.response?.data?.message || 'Registration failed'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.register-wrapper {
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background: linear-gradient(135deg, #111, #222);
}

.register-card {
  width: 100%;
  max-width: 380px;
  background: white;
  padding: 30px;
  border-radius: 12px;
  text-align: center;
  box-shadow: 0 20px 60px rgba(0,0,0,0.4);
}

input {
  width: 100%;
  box-sizing: border-box;
  padding: 12px;
  margin: 8px 0;
  border: 1px solid #ddd;
  border-radius: 8px;
}

.register-btn {
  width: 100%;
  padding: 12px;
  margin-top: 10px;
  background: #1e90ff;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
}

.error-box {
  background: #ffe5e5;
  color: #d10000;
  padding: 10px;
  margin-bottom: 10px;
  border-radius: 8px;
}

.success-box {
  background: #e6ffed;
  color: #1a7f37;
  padding: 10px;
  margin-bottom: 10px;
  border-radius: 8px;
}

.back {
  margin-top: 12px;
  font-size: 13px;
}

.back span {
  color: #1e90ff;
  cursor: pointer;
}
</style>