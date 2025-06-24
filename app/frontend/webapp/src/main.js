// frontend/src/main.js - Corrected routing for SAP Fiori Launchpad compatibility
import { createApp } from 'vue'
import { createRouter, createWebHashHistory } from 'vue-router'
import App from './App.vue'
import OpportunityRiskManager from './views/OpportunityRiskManager.vue'
import './style.css'

const routes = [
  // Primary route for opportunity risk management with query parameters
  {
    path: '/opportunityRisks',
    name: 'opportunity-risks',
    component: OpportunityRiskManager,
    // Pass query parameter 'id' as a prop
    props: route => ({ 
      id: route.query.id || route.query.opportunityId 
    })
  },
  
  // Alternative route handling for different query parameter names
  {
    path: '/risks',
    name: 'risks-alt',
    component: OpportunityRiskManager,
    props: route => ({ 
      id: route.query.id || route.query.opportunityId 
    })
  },

  // LEGACY: Keep old route for backward compatibility
  {
    path: '/opportunity/:id/risks',
    name: 'opportunity-risks-legacy',
    component: OpportunityRiskManager,
    props: true,
    // Redirect to new format
    beforeEnter: (to, from, next) => {
      next({ 
        name: 'opportunity-risks', 
        query: { id: to.params.id } 
      })
    }
  },

  // Root route - show instructions or redirect based on query params
  {
    path: '/',
    name: 'home',
    component: () => import('./views/Home.vue'),
    // Handle cases where query params are passed to root
    beforeEnter: (to, from, next) => {
      if (to.query.id || to.query.opportunityId) {
        next({ 
          name: 'opportunity-risks', 
          query: to.query 
        })
      } else {
        next()
      }
    }
  },

  // Handle hash-based navigation from Fiori Launchpad
  {
    path: '/Shell-home',
    name: 'shell-home',
    beforeEnter: (to, from, next) => {
      // Extract parameters from Fiori shell navigation
      const params = new URLSearchParams(to.hash?.substring(1) || '')
      const id = params.get('id') || params.get('opportunityId')
      
      if (id) {
        next({ 
          name: 'opportunity-risks', 
          query: { id } 
        })
      } else {
        next({ name: 'home' })
      }
    }
  },

  // Catch-all route
  {
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    component: () => import('./views/Home.vue')
  }
]

const router = createRouter({
  // Use hash history for Fiori Launchpad compatibility
  history: createWebHashHistory(),
  routes,
  
  // Handle initial navigation from Fiori Launchpad
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) {
      return savedPosition
    }
    return { top: 0 }
  }
})

// Handle Fiori Launchpad navigation parameters
router.beforeEach((to, from, next) => {
  // Check if we're being launched from Fiori Launchpad with startup parameters
  if (window.location.search || window.location.hash) {
    const urlParams = new URLSearchParams(window.location.search)
    const hashParams = new URLSearchParams(window.location.hash.substring(1))
    
    // Look for opportunity ID in various parameter formats
    const opportunityId = urlParams.get('id') || 
                         urlParams.get('opportunityId') || 
                         hashParams.get('id') || 
                         hashParams.get('opportunityId')
    
    if (opportunityId && to.name === 'home') {
      next({ 
        name: 'opportunity-risks', 
        query: { id: opportunityId } 
      })
      return
    }
  }
  
  next()
})

// Handle browser back/forward navigation
router.afterEach((to, from) => {
  // Update document title for better UX
  if (to.name === 'opportunity-risks' && to.query.id) {
    document.title = `Opportunity ${to.query.id} - Risk Manager`
  } else {
    document.title = 'Opportunity Risk Manager'
  }
})

const app = createApp(App)
app.use(router)

// Make router available globally for debugging
if (process.env.NODE_ENV === 'development') {
  window.__router = router
}

app.mount('#app')