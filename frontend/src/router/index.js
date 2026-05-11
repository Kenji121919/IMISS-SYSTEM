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

// Add any future public routes here
const publicRoutes = ['login', 'register']

router.beforeEach((to) => {
  const token = localStorage.getItem('token')
  const switching = localStorage.getItem('switchingProfile')
  const isLoggedIn = !!token && token !== 'null'

  // Allow profile page always (even during switch)
  if (to.name === 'profiles') {
    localStorage.removeItem('switchingProfile')
    return true
  }

  // Allow public routes without auth
  if (!isLoggedIn && !publicRoutes.includes(to.name)) {
    return { name: 'login' }
  }

  // If logged in but no active profile selected, go to profiles
  if (isLoggedIn && !localStorage.getItem('activeProfile') && !switching) {
    return { name: 'profiles' }
  }

  // ✅ ADD THIS: Role-based redirect after profile is selected
  if (isLoggedIn && localStorage.getItem('activeProfile')) {
    const activeProfile = JSON.parse(localStorage.getItem('activeProfile') || '{}')
    const isAdmin = activeProfile?.team?.toLowerCase() === 'admin' || activeProfile?.name?.toLowerCase() === 'admin'

    // Block non-admins from admin-only routes
    const adminOnlyRoutes = ['dashboard-home', 'manage-profiles', 'manage-modules']
    if (!isAdmin && adminOnlyRoutes.includes(to.name)) {
      // Redirect to their first module, or a fallback
      const user = JSON.parse(localStorage.getItem('user') || '{}')
      const firstModuleId = user.moduleId || null  // adjust this to however you store it

      if (firstModuleId) {
        return { name: 'dynamic-module', params: { id: firstModuleId } }
      } else {
        return { name: 'profiles' }  // fallback if no module found
      }
    }
  }

  return true
})

export default router