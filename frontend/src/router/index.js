import { createRouter, createWebHistory } from 'vue-router'

import LoginView from '../views/LoginView.vue'
import ProfilesView from '../views/ProfilesView.vue'
import Dashboard from '../views/dashboard/Dashboard.vue'

const routes = [
  {
    path: '/',
    component: LoginView
  },
  {
    path: '/profiles',
    component: ProfilesView
  },
  {
    path: '/dashboard',
    component: Dashboard,
    children: [
      { path: 'monitoring', component: () => import('../views/dashboard/Monitoring.vue') },
      { path: 'daily-logs', component: () => import('../views/dashboard/DailyLogs.vue') },
      { path: 'troubleshooting', component: () => import('../views/dashboard/Troubleshooting.vue') },
      { path: 'cable', component: () => import('../views/dashboard/Cable.vue') },
      { path: 'kiosk', component: () => import('../views/dashboard/Kiosk.vue') },
      { path: 'routers', component: () => import('../views/dashboard/Routers.vue') },
      { path: 'referral', component: () => import('../views/dashboard/Referral.vue') },
      { path: 'pullout', component: () => import('../views/dashboard/Pullout.vue') },
      { path: 'change-pin', component: () => import('../views/dashboard/ChangePin.vue') },
    ]
  }
]

export default createRouter({
  history: createWebHistory(),
  routes
})