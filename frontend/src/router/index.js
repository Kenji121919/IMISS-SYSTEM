import { createRouter, createWebHistory } from 'vue-router';
import LoginView from '../views/LoginView.vue';
import ProfilesView from '../views/ProfilesView.vue';

const routes = [
  { path: '/', component: LoginView },
  { path: '/profiles', component: ProfilesView },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;