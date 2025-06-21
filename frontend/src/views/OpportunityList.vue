<template>
  <div class="space-y-6">
    <!-- Page Header -->
    <div class="flex justify-between items-center">
      <div>
        <h1 class="text-3xl font-bold text-gray-900">Opportunities</h1>
        <p class="text-gray-600 mt-1">Manage your business opportunities and their associated risks</p>
      </div>
      <div class="text-sm text-gray-500">
        {{ opportunities.length }} opportunities found
      </div>
    </div>

    <!-- Connection Test -->
    <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
      <div class="flex items-center">
        <div class="text-blue-400">ℹ️</div>
        <div class="ml-3">
          <p class="text-blue-800 text-sm">
            Backend URL: <code class="bg-blue-100 px-1 rounded">{{ backendUrl }}</code>
          </p>
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="flex justify-center py-12">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="bg-red-50 border border-red-200 rounded-lg p-4">
      <div class="flex">
        <div class="text-red-400">⚠️</div>
        <div class="ml-3">
          <h3 class="text-red-800 font-medium">Error loading opportunities</h3>
          <p class="text-red-600 text-sm mt-1">{{ error }}</p>
          <details class="mt-2 text-xs text-red-500">
            <summary class="cursor-pointer">Show technical details</summary>
            <pre class="mt-2 bg-red-100 p-2 rounded text-xs overflow-auto">{{ technicalError }}</pre>
          </details>
          <button @click="fetchOpportunities" class="mt-3 text-red-600 hover:text-red-800 underline text-sm">
            Try again
          </button>
          <button @click="testConnection" class="mt-3 ml-4 text-red-600 hover:text-red-800 underline text-sm">
            Test Backend Connection
          </button>
        </div>
      </div>
    </div>

    <!-- Connection Test Result -->
    <div v-if="connectionTest" class="bg-gray-50 border border-gray-200 rounded-lg p-4">
      <h4 class="font-medium text-gray-900">Connection Test Result:</h4>
      <pre class="mt-2 text-sm text-gray-600 overflow-auto">{{ JSON.stringify(connectionTest, null, 2) }}</pre>
    </div>

    <!-- Opportunities Grid -->
    <div v-else class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      <div 
        v-for="opportunity in opportunities" 
        :key="opportunity.ID"
        class="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow cursor-pointer"
        @click="goToOpportunity(opportunity.ID)"
      >
        <div class="p-6">
          <div class="flex items-start justify-between">
            <div class="flex-1">
              <h3 class="text-lg font-semibold text-gray-900 mb-2">
                {{ opportunity.name || 'Unnamed Opportunity' }}
              </h3>
              <p class="text-gray-600 text-sm mb-4 line-clamp-2">
                {{ opportunity.description || 'No description available' }}
              </p>
            </div>
            <div class="ml-4 flex-shrink-0">
              <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                {{ opportunity.status || 'Active' }}
              </span>
            </div>
          </div>
          
          <div class="flex items-center justify-between pt-4 border-t border-gray-100">
            <div class="text-sm text-gray-500">
              <span class="font-medium">{{ opportunity.riskCount || 0 }}</span> risks
            </div>
            <div class="flex items-center text-blue-600 text-sm font-medium">
              View Details
              <svg class="ml-1 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
              </svg>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div v-if="!loading && !error && opportunities.length === 0" class="text-center py-12">
      <div class="text-gray-400 text-6xl mb-4">📋</div>
      <h3 class="text-lg font-medium text-gray-900 mb-2">No opportunities found</h3>
      <p class="text-gray-500">Get started by creating your first business opportunity.</p>
    </div>
  </div>
</template>

<script>
import { opportunityService } from '../services/api.js'

export default {
  name: 'OpportunityList',
  data() {
    return {
      opportunities: [],
      loading: true,
      error: null,
      technicalError: null,
      connectionTest: null,
      backendUrl: 'https://port4004-workspaces-ws-8dilk.ap10.applicationstudio.cloud.sap/opportunity-risks'
    }
  },
  async mounted() {
    await this.fetchOpportunities()
  },
  methods: {
    async fetchOpportunities() {
      this.loading = true
      this.error = null
      this.technicalError = null
      
      try {
        this.opportunities = await opportunityService.getOpportunities()
        
        // Optionally enhance data with risk counts
        for (let opportunity of this.opportunities) {
          try {
            const risks = await opportunityService.getOpportunityRisks(opportunity.ID)
            opportunity.riskCount = risks.length
          } catch (e) {
            opportunity.riskCount = 0
          }
        }
      } catch (error) {
        console.error('Error fetching opportunities:', error)
        this.error = error.response?.data?.error?.message || error.message || 'Failed to load opportunities'
        this.technicalError = {
          status: error.response?.status,
          statusText: error.response?.statusText,
          url: error.config?.url,
          method: error.config?.method,
          data: error.response?.data,
          message: error.message
        }
      } finally {
        this.loading = false
      }
    },
    async testConnection() {
      this.connectionTest = null
      try {
        this.connectionTest = await opportunityService.testConnection()
      } catch (error) {
        this.connectionTest = { success: false, error: error.message }
      }
    },
    goToOpportunity(id) {
      this.$router.push(`/opportunity/${id}`)
    }
  }
}
</script>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
code {
  font-family: 'Monaco', 'Menlo', 'Consolas', monospace;
  font-size: 0.875em;
}
</style>