import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
const routes = [
  { path: '/',        name: 'Home',    component: HomeView },
  { path: '/result',  name: 'Result',  component: () => import('../views/ResultView.vue') },
  { path: '/visited', name: 'Visited', component: () => import('../views/VisitedView.vue') },
]
const router = createRouter({ history: createWebHistory(), routes })
export default router
