import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import { resultState } from '../composables/useResult.js'

const routes = [
  { path: '/',        name: 'Home',    component: HomeView },
  { path: '/result',  name: 'Result',  component: () => import('../views/ResultView.vue') },
  { path: '/visited',    name: 'Visited',    component: () => import('../views/VisitedView.vue') },
  { path: '/ai',       name: 'Ai',       component: () => import('../views/AiView.vue') },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior: () => ({ top: 0 }),
})

// 刷新時若無分析資料，非首頁一律導回首頁
router.beforeEach((to) => {
  if (to.path !== '/' && !resultState.data) {
    return { path: '/' }
  }
})

export default router
