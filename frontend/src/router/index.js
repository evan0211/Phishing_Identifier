import { createRouter, createWebHistory } from "vue-router";
import HomeView from '../views/HomeView.vue'
import DemoHomeView from "../views/HomeView.vue";
 
const routes = [
  {
    path: '/',
    name: 'HomeView',
    component: HomeView
  }, 
  {
    path: '/visited',
    name: 'Visited',
    component: () => import('../views/VisitedView.vue')
  }
]
 
const router = createRouter({
  history: createWebHistory(),
  routes
})
 
export default router