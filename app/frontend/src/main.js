// frontend/src/main.js - Updated routing with query parameters
import { createApp } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'
import App from './App.vue'
import OpportunityRiskManager from './views/OpportunityRiskManager.vue'
import './style.css'

const routes = [
  // NEW: Query parameter route for opportunity risk management
  { 
    path: '/opportunityRisks', 
    name: 'opportunity-risks', 
    component: OpportunityRiskManager,
    // Pass query parameter 'id' as a prop
    props: route => ({ id: route.query.id })
  },
  // LEGACY: Keep old route for backward compatibility (optional)
  { 
    path: '/opportunity/:id/risks', 
    name: 'opportunity-risks-legacy', 
    component: OpportunityRiskManager, 
    props: true,
    // Redirect to new format
    beforeEnter: (to, from, next) => {
      next({ name: 'opportunity-risks', query: { id: to.params.id } })
    }
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