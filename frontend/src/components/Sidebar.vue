<template>
  <div class="sidebar" :class="{ collapsed }">

    <!-- TOP -->
    <div class="top">
      <h2 v-if="!collapsed" class="logo">IMISS</h2>

      <button class="toggle" @click="$emit('toggle')">
      <Menu />
      </button>
    </div>

    <!-- MENU -->
    <ul class="menu">

      <li>
        <router-link to="/dashboard/monitoring" class="link" active-class="active">
          <Activity class="icon" />
          <span v-if="!collapsed">Monitoring</span>
        </router-link>
      </li>

      <li>
        <router-link to="/dashboard/daily-logs" class="link" active-class="active">
          <ClipboardList class="icon" />
          <span v-if="!collapsed">Daily Logs</span>
        </router-link>
      </li>

      <li>
        <router-link to="/dashboard/troubleshooting" class="link" active-class="active">
          <Wrench class="icon" />
          <span v-if="!collapsed">Troubleshooting</span>
        </router-link>
      </li>

      <li>
        <router-link to="/dashboard/cable" class="link" active-class="active">
          <Cable class="icon" />
          <span v-if="!collapsed">Cable</span>
        </router-link>
      </li>

      <li>
        <router-link to="/dashboard/kiosk" class="link" active-class="active">
          <Monitor class="icon" />
          <span v-if="!collapsed">Kiosk</span>
        </router-link>
      </li>

      <li>
        <router-link to="/dashboard/routers" class="link" active-class="active">
          <Wifi class="icon" />
          <span v-if="!collapsed">Routers</span>
        </router-link>
      </li>

      <li>
        <router-link to="/dashboard/referral" class="link" active-class="active">
          <Link class="icon" />
          <span v-if="!collapsed">Referral</span>
        </router-link>
      </li>

      <li>
        <router-link to="/dashboard/pullout" class="link" active-class="active">
          <Upload class="icon" />
          <span v-if="!collapsed">Pullout</span>
        </router-link>
      </li>

      <li>
        <router-link to="/dashboard/change-pin" class="link" active-class="active">
          <Lock class="icon" />
          <span v-if="!collapsed">Change PIN</span>
        </router-link>
      </li>

    </ul>

    <!-- LOGOUT -->
    <div class="logout">
      <button @click="logout">
        <LogOut class="icon" />
        <span v-if="!collapsed">Logout</span>
      </button>
    </div>

  </div>
</template>

<script setup>
import {
  Activity,
  ClipboardList,
  Wrench,
  Cable,
  Monitor,
  Wifi,
  Link,
  Upload,
  Lock,
  LogOut,
  Menu

} from 'lucide-vue-next'

defineProps({
  collapsed: Boolean
})

const logout = () => {
  localStorage.clear()
  window.location.href = '/'
}
</script>

<style>
/* SIDEBAR */
.sidebar {
  width: 240px;
  height: 100vh;
  background: #111;
  color: white;
  display: flex;
  flex-direction: column;
  transition: 0.3s ease;
  overflow: hidden;
}

.sidebar.collapsed {
  width: 70px;
}

/* TOP */
.top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
}

/* MENU */
.menu {
  flex: 1;
  list-style: none;
  padding: 15px;
  margin: 0;
}

/* LINK */
.link {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  color: white;
  text-decoration: none;
  border-radius: 8px;
  transition: 0.3s;
  position: relative;
}

.toggle {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px;
  color: white;
  background-color: black;
  text-decoration: none;
  border-radius: 8px;
  transition: 0.3s;
  position: relative;
}
.toggle:hover {
  background: #222;
  transform: translateX(3px);
}
/* HOVER ANIMATION */
.link:hover {
  background: #222;
  transform: translateX(3px);
}

/* ACTIVE GLOW */
.link.active {
  background: #1e90ff;
  box-shadow: 0 0 12px #1e90ff;
}

/* ICON */
.icon {
  width: 22px;
  height: 22px;
}

/* COLLAPSED CENTER */
.sidebar.collapsed .link {
  justify-content: center;
}


/* TOOLTIP WHEN COLLAPSED */
.sidebar.collapsed .link:hover::after {
  content: attr(data-tooltip);
  position: absolute;
  left: 80px;
  background: black;
  padding: 5px 10px;
  border-radius: 6px;
  white-space: nowrap;
  font-size: 12px;
}

/* LOGOUT */
.logout {
  padding: 10px;
}

.logout button {
  width: 100%;
  background: red;
  border: none;
  color: white;
  padding: 10px;
  cursor: pointer;
  display: flex;
  gap: 10px;
  justify-content: center;
}
</style>