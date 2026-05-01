import { createRouter, createWebHistory } from 'vue-router'

import LoginView from '../views/LoginView.vue'
import RegisterView from '../views/RegisterView.vue'
import ProfilesView from '../views/ProfilesView.vue'

const routes = [
  {
    path: '/',
    name: 'login',
    component: LoginView,
  },
  {
    path: '/register',
    name: 'register',
    component: RegisterView,
  },
  {
    path: '/profiles',
    name: 'profiles',
    component: ProfilesView,
    meta: { requiresAuth: true },
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

/* 🔥 AUTH GUARD (CLEAN VERSION) */
router.beforeEach((to) => {
  const token = localStorage.getItem('token')

  const isLoggedIn =
    !!token &&
    token !== 'null' &&
    token !== 'undefined'

  // protect private routes
  if (to.meta.requiresAuth && !isLoggedIn) {
    return { name: 'login' }
  }

  // allow register ALWAYS
  if (to.name === 'register') {
    return true
  }

  // block login only if already logged in
  if (to.name === 'login' && isLoggedIn) {
    return { name: 'profiles' }
  }

  return true
})
export default router