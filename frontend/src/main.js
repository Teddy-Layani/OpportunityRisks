// frontend/src/main.js - Simplified routing
import { createApp } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'
import App from './App.vue'
import OpportunityRiskManager from './views/OpportunityRiskManager.vue'
import './style.css'

const routes = [
  // Direct route to opportunity risk management
  { 
    path: '/opportunity/:id/risks', 
    name: 'opportunity-risks', 
    component: OpportunityRiskManager, 
    props: true 
  },
  // Root route - show instructions
  { 
    path: '/', 
    name: 'home',
    component: () => import('./views/Home.vue')
  },
  // Catch-all route
  {
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    component: () => import('./views/Home.vue')
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

const app = createApp(App)
app.use(router)
app.mount('#app')