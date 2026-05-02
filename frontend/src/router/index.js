import { createRouter, createWebHistory } from 'vue-router'

import LoginView from '../views/LoginView.vue'
import RegisterView from '../views/RegisterView.vue'
import ProfilesView from '../views/ProfilesView.vue'

// Dashboard Layout
import DashboardLayout from '../views/dashboard/Dashboard.vue'

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

  /* =========================
     DASHBOARD (DYNAMIC SYSTEM)
  ========================= */
  {
    path: '/dashboard',
    component: DashboardLayout,
    meta: { requiresAuth: true },
    children: [
      {
        path: '',
        name: 'dashboard-home',
        component: () => import('@/views/dashboard/Home.vue')
      },
      {
        path: 'manage-profiles',
        name: 'manage-profiles',
        component: () => import('@/views/admin/ManageProfiles.vue')
      },
      {
        path: 'manage-modules',
        name: 'manage-modules',
        component: () => import('@/views/admin/ManageModules.vue')
      },
      {
        path: 'module/:id',
        name: 'dynamic-module',
        component: () => import('@/views/modules/DynamicModule.vue'),
        props: true
      }
    ]
  },

  /* =========================
     FALLBACK (OPTIONAL BUT GOOD)
  ========================= */
  {
    path: '/:pathMatch(.*)*',
    redirect: '/'
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

/* =========================
   AUTH GUARD
========================= */
router.beforeEach((to) => {
  const token = localStorage.getItem('token')
  const switching = localStorage.getItem('switchingProfile')

  const isLoggedIn = !!token && token !== 'null'

  // allow profile page ALWAYS (even during switch)
  if (to.name === 'profiles') {
    localStorage.removeItem('switchingProfile')
    return true
  }

  if (!isLoggedIn && to.name !== 'login') {
    return { name: 'login' }
  }

  if (isLoggedIn && !localStorage.getItem('activeProfile') && !switching) {
    return { name: 'profiles' }
  }

  return true
})

export default router