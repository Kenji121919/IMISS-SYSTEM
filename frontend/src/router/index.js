import { createRouter, createWebHistory } from 'vue-router'

import LoginView from '../views/LoginView.vue'
import RegisterView from '../views/RegisterView.vue'
import ProfilesView from '../views/ProfilesView.vue'
import DashboardLayout from '../views/dashboard/Dashboard.vue'
import AuthCallback from '../views/AuthCallback.vue'
import.meta.env.VITE_API_URL

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

  {
  path: '/auth/callback',
  name: 'auth-callback',
  component: AuthCallback,
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
        // Admin-only dynamic dashboard (auto-charts across all modules)
        path: 'analytics',
        name: 'dynamic-dashboard',
        component: () => import('@/views/admin/dynamicdshbrd.vue')
      },
      {
        // Per-user dashboard (tabs per assigned module)
        path: 'my-dashboard',
        name: 'user-dashboard',
        component: () => import('@/views/dashboard/UserDashboard.vue')
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
        path: 'audit-trail',
        name: 'audit-trail',
        component: () => import('@/views/admin/AuditTrail.vue')
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
     FALLBACK
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

const publicRoutes = ['login', 'register', 'auth-callback']
const noProfileRequired = ['profiles', 'audit-trail']

// Routes only admins can access
const adminOnlyRoutes = ['dashboard-home', 'dynamic-dashboard', 'manage-profiles', 'manage-modules', 'audit-trail']

router.beforeEach((to) => {
  const token = localStorage.getItem('token')
  const switching = localStorage.getItem('switchingProfile')
  const isLoggedIn = !!token && token !== 'null'
  
   if (isLoggedIn && publicRoutes.includes(to.name)) {
    return { name: 'profiles' }
  }

  if (to.name === 'profiles') {
    localStorage.removeItem('switchingProfile')
    return true
  }

  if (!isLoggedIn && !publicRoutes.includes(to.name)) {
    return { name: 'login' }
  }

  if (
    isLoggedIn &&
    !localStorage.getItem('activeProfile') &&
    !switching &&
    !noProfileRequired.includes(to.name)
  ) {
    return { name: 'profiles' }
  }

  if (isLoggedIn && localStorage.getItem('activeProfile')) {
    const activeProfile = JSON.parse(localStorage.getItem('activeProfile') || '{}')
    const isAdmin =
      activeProfile?.team?.toLowerCase() === 'admin' ||
      activeProfile?.name?.toLowerCase() === 'admin'

    if (!isAdmin && adminOnlyRoutes.includes(to.name)) {
      const user = JSON.parse(localStorage.getItem('user') || '{}')
      const firstModuleId = user.moduleId || null
      return firstModuleId
        ? { name: 'dynamic-module', params: { id: firstModuleId } }
        : { name: 'profiles' }
    }

    // Non-admins hitting dashboard root → send to their own dashboard
    if (!isAdmin && to.name === 'dashboard-home') {
      return { name: 'user-dashboard' }
    }
  }

  return true
})

export default router