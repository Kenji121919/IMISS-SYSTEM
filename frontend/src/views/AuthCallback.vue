<script setup>
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

onMounted(() => {
  const params = new URLSearchParams(window.location.search)
  const token = params.get('token')
  const userRaw = params.get('user')

  if (!token || !userRaw) {
    router.replace('/')
    return
  }

  localStorage.setItem('token', token)
  localStorage.setItem('user', JSON.stringify(JSON.parse(decodeURIComponent(userRaw))))
  router.replace('/profiles')
})
</script>

<template>
  <div style="display:flex;align-items:center;justify-content:center;height:100vh;color:#818cf8">
    Signing you in…
  </div>
</template>