<template>
  <div style="text-align:center; margin-top:200px;">
    <h1>IMISS DAILY LOGS</h1>

    <input v-model="username" placeholder="Username" />
    <br /><br />

    <input v-model="password" type="password" placeholder="Password" />
    <br /><br />

    <button @click="login">Login</button>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import axios from 'axios'

const username = ref('')
const password = ref('')

const login = async () => {
  try {
    const res = await axios.post('http://localhost:3000/auth/login', {
      username: username.value,
      password: password.value,
    })

    localStorage.setItem('userId', res.data.userId)

    window.location.href = '/profiles'
  } catch (err) {
    alert('Login failed')

    // 🔥 CLEAR INPUTS AFTER FAILED LOGIN
    username.value = ''
    password.value = ''

    console.log(err)
  }
}
</script>