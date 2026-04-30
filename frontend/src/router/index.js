import { createRouter, createWebHistory } from 'vue-router'

import LoginView from '../views/LoginView.vue'
import ProfilesView from '../views/ProfilesView.vue'
import Dashboard from '../views/dashboard/Dashboard.vue'

const routes = [
  // =========================
  // LOGIN
  // =========================
  {
    path: '/',
    component: LoginView
  },

  // =========================
  // PROFILES
  // =========================
  {
    path: '/profiles',
    component: ProfilesView
  },

  // =========================
  // DASHBOARD (PARENT ROUTE)
  // =========================
  {
    path: '/dashboard',
    component: Dashboard,
    meta: { requiresAuth: true },
    children: [
      // DEFAULT REDIRECT
      {
        path: '',
        redirect: '/dashboard/monitoring'
      },

      // =========================
      // CHILD ROUTES (NO :team PARAM)
      // =========================

      {
        path: 'monitoring',
        component: () => import('../views/dashboard/Monitoring.vue'),
        meta: { team: 'Application' }
      },

      {
        path: 'daily-logs',
        component: () => import('../views/dashboard/DailyLogs.vue'),
        meta: { team: 'All' }
      },

      {
        path: 'troubleshooting',
        component: () => import('../views/dashboard/Troubleshooting.vue'),
        meta: { team: 'Technical' }
      },

      {
        path: 'cable',
        component: () => import('../views/dashboard/Cable.vue'),
        meta: { team: 'Technical' }
      },

      {
        path: 'kiosk',
        component: () => import('../views/dashboard/Kiosk.vue'),
        meta: { team: 'Application' }
      },

      {
        path: 'routers',
        component: () => import('../views/dashboard/Routers.vue'),
        meta: { team: 'Networks' }
      },

      {
        path: 'referral',
        component: () => import('../views/dashboard/Referral.vue'),
        meta: { team: 'Application' }
      },

      {
        path: 'pullout',
        component: () => import('../views/dashboard/Pullout.vue'),
        meta: { team: 'Technical' }
      },

      {
        path: 'change-pin',
        component: () => import('../views/dashboard/ChangePin.vue'),
        meta: { team: 'All' }
      },
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

/* =========================
   AUTH GUARD
========================= */
router.beforeEach((to) => {
  const user = localStorage.getItem('user')
  const activeProfile = localStorage.getItem('activeProfile')

  const isLoggedIn = !!user
  const hasProfile = !!activeProfile

  // protect dashboard
  if (to.path.startsWith('/dashboard')) {
    if (!isLoggedIn) return '/'
    if (!hasProfile) return '/profiles'
  }

  return true
})

export default router