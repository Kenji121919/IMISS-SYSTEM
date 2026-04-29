<template>
  <div class="profile-wrapper">

    <!-- TITLE -->
    <div class="title">
      <h1>Who's using the system?</h1>
      <p>Select a profile to continue</p>
    </div>

    <!-- PROFILE GRID -->
    <div class="profile-grid">

      <div
        v-for="p in profiles"
        :key="p.id"
        class="profile-card"
        @click="openModal(p)"
      >
        <div class="avatar">
          {{ p.name.charAt(0).toUpperCase() }}
        </div>

        <h3>{{ p.name }}</h3>
      </div>

    </div>

    <!-- MODAL -->
    <div v-if="showModal" class="modal-backdrop">

      <div class="modal-card" :class="{ shake: shakeError }">

        <h2>{{ selectedProfile?.name }}</h2>
        <p>Enter your PIN to continue</p>

        <!-- ERROR MESSAGE -->
        <div v-if="errorMessage" class="error-box">
          {{ errorMessage }}
        </div>

        <input
          v-model="pin"
          type="password"
          maxlength="4"
          inputmode="numeric"
          placeholder="••••"
          class="pin-input"
          @input="pin = pin.replace(/[^0-9]/g, '').slice(0, 4)"
        />

        <div class="modal-actions">

          <button class="btn-primary" @click="verifyPin">
            Continue
          </button>

          <button class="btn-danger" @click="closeModal">
            Cancel
          </button>

        </div>

      </div>

    </div>

  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import axios from 'axios'

const profiles = ref([])
const selectedProfile = ref(null)
const pin = ref('')
const showModal = ref(false)

const errorMessage = ref('')
const shakeError = ref(false)

// LOAD
onMounted(async () => {
  const userId = localStorage.getItem('userId')

  const res = await axios.get(
    `http://localhost:3000/profiles/${userId}`
  )

  profiles.value = res.data
})

// OPEN MODAL
const openModal = (profile) => {
  selectedProfile.value = profile
  pin.value = ''
  errorMessage.value = ''
  showModal.value = true
}

// CLOSE MODAL
const closeModal = () => {
  showModal.value = false
  selectedProfile.value = null
  pin.value = ''
  errorMessage.value = ''
}

// VERIFY PIN
const verifyPin = () => {
  if (pin.value === selectedProfile.value.pin) {
    localStorage.setItem('profile', JSON.stringify(selectedProfile.value))
    window.location.href = '/dashboard'
  } else {
    errorMessage.value = 'Incorrect PIN'

    shakeError.value = true
    setTimeout(() => (shakeError.value = false), 400)

    pin.value = ''
  }
}
</script>

<style>
/* WRAPPER */
.profile-wrapper {
  min-height: 100vh;
  background: linear-gradient(135deg, #111, #222);
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 60px 20px;
}

/* TITLE */
.title {
  text-align: center;
  color: white;
  margin-bottom: 40px;
}

.title p {
  color: #aaa;
  font-size: 14px;
}

/* GRID */
.profile-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 20px;
  width: 100%;
  max-width: 600px;
}

/* CARD */
.profile-card {
  background: white;
  padding: 20px;
  border-radius: 12px;
  text-align: center;
  cursor: pointer;
  transition: 0.2s;
}

.profile-card:hover {
  transform: translateY(-5px);
}

/* AVATAR */
.avatar {
  width: 50px;
  height: 50px;
  background: #1e90ff;
  color: white;
  border-radius: 50%;
  display: flex;
  justify-content: center;
  align-items: center;
  margin: 0 auto 10px;
  font-size: 20px;
  font-weight: bold;
}

/* MODAL */
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.75);
  backdrop-filter: blur(4px);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 9999;
}

/* MODAL CARD */
.modal-card {
  background: white;
  width: 90%;
  max-width: 320px;
  padding: 25px;
  border-radius: 14px;
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

/* ERROR BOX */
.error-box {
  background: #ffe5e5;
  color: #d10000;
  padding: 8px;
  border-radius: 8px;
  font-size: 13px;
  margin: 10px 0;
}

/* PIN INPUT */
.pin-input {
  width: 120px;
  padding: 12px;
  margin: 15px auto 0;
  display: block;
  border: 1px solid #ddd;
  border-radius: 10px;
  text-align: center;
  font-size: 20px;
  letter-spacing: 6px;
}

/* BUTTONS */
.modal-actions {
  display: flex;
  gap: 10px;
  margin-top: 15px;
}

.btn-primary,
.btn-danger {
  flex: 1;
  padding: 10px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  color: white;
}

.btn-primary {
  background: #1e90ff;
}

.btn-danger {
  background: #ff4d4d;
}
</style>