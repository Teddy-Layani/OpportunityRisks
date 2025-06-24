<template>
  <div class="space-y-6">
    <!-- Breadcrumb -->
    <nav class="flex" aria-label="Breadcrumb">
      <ol class="flex items-center space-x-4">
        <li>
          <router-link to="/" class="text-blue-600 hover:text-blue-800">
            Opportunities
          </router-link>
        </li>
        <li class="flex items-center">
          <svg class="flex-shrink-0 h-4 w-4 text-gray-400 mx-2" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd" />
          </svg>
          <span class="text-gray-500">{{ id }}</span>
        </li>
      </ol>
    </nav>

    <!-- Loading State -->
    <div v-if="loading" class="flex justify-center py-12">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="bg-red-50 border border-red-200 rounded-lg p-4">
      <div class="flex">
        <div class="text-red-400">⚠️</div>
        <div class="ml-3">
          <h3 class="text-red-800 font-medium">Error loading opportunity</h3>
          <p class="text-red-600 text-sm mt-1">{{ error }}</p>
          <button @click="fetchData" class="mt-3 text-red-600 hover:text-red-800 underline text-sm">
            Try again
          </button>
        </div>
      </div>
    </div>

    <!-- Opportunity Details -->
    <div v-else-if="opportunity" class="space-y-6">
      <!-- Opportunity Header -->
      <div class="bg-white rounded-lg shadow-sm border">
        <div class="px-6 py-8">
          <div class="flex justify-between items-start">
            <div class="flex-1">
              <h1 class="text-3xl font-bold text-gray-900 mb-2">
                {{ opportunity.name || 'Unnamed Opportunity' }}
              </h1>
              <p class="text-gray-600 text-lg">
                {{ opportunity.description || 'No description available' }}
              </p>
            </div>
            <div class="ml-6 flex-shrink-0">
              <span class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                {{ opportunity.status || 'Active' }}
              </span>
            </div>
          </div>

          <!-- Opportunity Metadata -->
          <div class="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div class="bg-gray-50 rounded-lg p-4">
              <dt class="text-sm font-medium text-gray-500">Opportunity ID</dt>
              <dd class="mt-1 text-sm text-gray-900 font-mono">{{ opportunity.ID }}</dd>
            </div>
            <div class="bg-gray-50 rounded-lg p-4">
              <dt class="text-sm font-medium text-gray-500">Created</dt>
              <dd class="mt-1 text-sm text-gray-900">{{ formatDate(opportunity.createdAt) }}</dd>
            </div>
            <div class="bg-gray-50 rounded-lg p-4">
              <dt class="text-sm font-medium text-gray-500">Total Risks</dt>
              <dd class="mt-1 text-sm text-gray-900 font-semibold">{{ risks.length }}</dd>
            </div>
          </div>
        </div>
      </div>

      <!-- Risks Section -->
      <div class="bg-white rounded-lg shadow-sm border">
        <div class="px-6 py-4 border-b border-gray-200">
          <h2 class="text-xl font-semibold text-gray-900">Associated Risks</h2>
          <p class="text-gray-600 text-sm mt-1">Manage risks for this opportunity</p>
        </div>

        <!-- Risks Loading -->
        <div v-if="risksLoading" class="px-6 py-8 text-center">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p class="text-gray-500 mt-2">Loading risks...</p>
        </div>

        <!-- Risks List -->
        <div v-else-if="risks.length > 0" class="divide-y divide-gray-200">
          <div 
            v-for="risk in risks" 
            :key="risk.ID"
            class="px-6 py-4 hover:bg-gray-50 transition-colors"
          >
            <div class="flex justify-between items-start">
              <div class="flex-1">
                <h3 class="text-lg font-medium text-gray-900">
                  {{ risk.title || 'Untitled Risk' }}
                </h3>
                <p class="text-gray-600 mt-1">
                  {{ risk.description || 'No description available' }}
                </p>
                
                <!-- Risk Metrics -->
                <div class="flex space-x-4 mt-3">
                  <div class="flex items-center">
                    <span class="text-sm text-gray-500">Impact:</span>
                    <span :class="getImpactClass(risk.impact)" class="ml-2 px-2 py-1 rounded text-xs font-medium">
                      {{ risk.impact || 'N/A' }}
                    </span>
                  </div>
                  <div class="flex items-center">
                    <span class="text-sm text-gray-500">Probability:</span>
                    <span :class="getProbabilityClass(risk.probability)" class="ml-2 px-2 py-1 rounded text-xs font-medium">
                      {{ risk.probability || 'N/A' }}
                    </span>
                  </div>
                </div>
              </div>
              
              <div class="ml-4 flex-shrink-0">
                <span :class="getStatusClass(risk.status)" class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium">
                  {{ risk.status || 'Open' }}
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- No Risks State -->
        <div v-else class="px-6 py-8 text-center">
          <div class="text-gray-400 text-4xl mb-3">⚠️</div>
          <h3 class="text-lg font-medium text-gray-900 mb-2">No risks identified</h3>
          <p class="text-gray-500">This opportunity currently has no associated risks.</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios'

export default {
  name: 'OpportunityDetail',
  props: ['id'],
  data() {
    return {
      opportunity: null,
      risks: [],
      loading: true,
      risksLoading: true,
      error: null
    }
  },
  async mounted() {
    await this.fetchData()
  },
  methods: {
    async fetchData() {
      this.loading = true
      this.error = null
      
      try {
        // Fetch opportunity details
        const oppResponse = await axios.get(`/opportunity-risks/Opportunity('${this.id}')`)
        this.opportunity = oppResponse.data
        this.loading = false
        
        // Fetch associated risks
        this.risksLoading = true
        try {
          const risksResponse = await axios.get(`/opportunity-risks/Opportunity('${this.id}')/risks`)
          this.risks = risksResponse.data.value || risksResponse.data || []
        } catch (risksError) {
          console.warn('Could not load risks:', risksError)
          this.risks = []
        }
        this.risksLoading = false
        
      } catch (error) {
        console.error('Error fetching opportunity:', error)
        this.error = error.response?.data?.error?.message || error.message || 'Failed to load opportunity'
        this.loading = false
        this.risksLoading = false
      }
    },
    formatDate(dateString) {
      if (!dateString) return 'N/A'
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      })
    },
    getImpactClass(impact) {
      const level = (impact || '').toLowerCase()
      if (level === 'high') return 'bg-red-100 text-red-800'
      if (level === 'medium') return 'bg-yellow-100 text-yellow-800'
      if (level === 'low') return 'bg-green-100 text-green-800'
      return 'bg-gray-100 text-gray-800'
    },
    getProbabilityClass(probability) {
      const level = (probability || '').toLowerCase()
      if (level === 'high') return 'bg-red-100 text-red-800'
      if (level === 'medium') return 'bg-yellow-100 text-yellow-800'
      if (level === 'low') return 'bg-green-100 text-green-800'
      return 'bg-gray-100 text-gray-800'
    },
    getStatusClass(status) {
      const stat = (status || '').toLowerCase()
      if (stat === 'closed') return 'bg-green-100 text-green-800'
      if (stat === 'mitigated') return 'bg-blue-100 text-blue-800'
      if (stat === 'open') return 'bg-red-100 text-red-800'
      return 'bg-gray-100 text-gray-800'
    }
  },
  watch: {
    id() {
      this.fetchData()
    }
  }
}
</script>
