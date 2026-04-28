<template>
    
  <div style="text-align:center; margin-top:200px;">
    <h1>Who's using the system?</h1>

    <!-- PROFILE LIST -->
     <br>
     <br>
    <div style="display:flex; gap:20px; justify-content:center; flex-wrap:wrap; margin-top:30px;">
      <div
        v-for="p in profiles"
        :key="p.id"
        @click="openModal(p)"
        style="width:180px; padding:20px; border:1px solid #ccc; cursor:pointer; border-radius:10px;"
      >
        <h3>{{ p.name }}</h3>
      </div>
    </div>

    <!-- 🔥 MODAL -->
    <div v-if="showModal" class="modal-overlay">
      <div class="modal-box">
        <h1>{{ selectedProfile?.name }}</h1>

        <input

            v-model="pin"
            type="text"
            maxlength="4"
            inputmode="numeric"
            @input="pin = pin.replace(/[^0-9]/g, '').slice(0, 4)"
            placeholder="Enter PIN"
            style="text-align:center; font-size:20px; letter-spacing:4px; width:120px;"
        
        />

        <br /><br />

        <button @click="verifyPin">Continue</button>
        <button @click="closeModal" style="margin-left:10px;">Cancel</button>
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

// 🔵 LOAD PROFILES
onMounted(async () => {
  const userId = localStorage.getItem('userId')

  const res = await axios.get(
    `http://localhost:3000/profiles/${userId}`
  )

  profiles.value = res.data
})

// 🟡 OPEN MODAL
const openModal = (profile) => {
  selectedProfile.value = profile
  pin.value = ''
  showModal.value = true
}

// ❌ CLOSE MODAL
const closeModal = () => {
  showModal.value = false
  selectedProfile.value = null
  pin.value = ''
}

// 🔐 VERIFY PIN
const verifyPin = () => {
  if (pin.value === selectedProfile.value.pin) {
    localStorage.setItem('profile', JSON.stringify(selectedProfile.value))

    window.location.href = '/dashboard'
  } else {
    alert('Wrong PIN ❌')
    pin.value = ''
  }
}
</script>

<style>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0,0,0,0.6);
  display: flex;
  justify-content: center;
  align-items: center;
}

.modal-box {
  background: white;
  padding: 30px;
  border-radius: 10px;
  width: 300px;
}
</style>