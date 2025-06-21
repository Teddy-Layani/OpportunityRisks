<template>
  <div class="space-y-6">
    <!-- Page Header with Opportunity Context -->
    <div class="bg-white rounded-lg shadow-sm border">
      <div class="px-6 py-6">
        <!-- Loading State for Opportunity -->
        <div v-if="opportunityLoading" class="animate-pulse">
          <div class="h-8 bg-gray-200 rounded w-3/4 mb-2"></div>
          <div class="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>

        <!-- Opportunity Header -->
        <div v-else-if="opportunity" class="flex justify-between items-start">
          <div class="flex-1">
            <div class="flex items-center space-x-3 mb-2">
              <h1 class="text-2xl font-bold text-gray-900">
                Risk Management
              </h1>
              <div class="bg-blue-50 border border-blue-200 rounded-lg px-2 py-1">
                <span class="text-blue-800 text-xs font-medium">SAP CRM</span>
              </div>
            </div>
            <h2 class="text-xl font-semibold text-gray-700 mb-1">
              {{ opportunity.name || 'Unnamed Opportunity' }}
            </h2>
            <p class="text-gray-600">
              {{ opportunity.description || 'No description available' }}
            </p>
          </div>
          <div class="ml-6 flex-shrink-0 flex items-center space-x-3">
            <span :class="getStatusClass(opportunity.status)" class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium">
              {{ opportunity.status || 'Active' }}
            </span>
          </div>
        </div>

        <!-- Error State for Opportunity -->
        <div v-else-if="opportunityError" class="bg-red-50 border border-red-200 rounded-lg p-4">
          <div class="flex">
            <div class="text-red-400">⚠️</div>
            <div class="ml-3">
              <h3 class="text-red-800 font-medium">Error loading opportunity from SAP CRM</h3>
              <p class="text-red-600 text-sm mt-1">{{ opportunityError }}</p>
              <p class="text-red-600 text-sm mt-1">Opportunity ID: <code class="bg-red-100 px-1 rounded">{{ id }}</code></p>
              <button @click="fetchOpportunity" class="mt-3 text-red-600 hover:text-red-800 underline text-sm">
                Retry
              </button>
            </div>
          </div>
        </div>

        <!-- Opportunity Metadata -->
        <div v-if="opportunity" class="mt-4 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div class="bg-gray-50 rounded-lg p-3">
            <dt class="text-xs font-medium text-gray-500 uppercase tracking-wide">Opportunity ID</dt>
            <dd class="mt-1 text-sm text-gray-900 font-mono">{{ opportunity.ID }}</dd>
          </div>
          <div class="bg-gray-50 rounded-lg p-3">
            <dt class="text-xs font-medium text-gray-500 uppercase tracking-wide">Created</dt>
            <dd class="mt-1 text-sm text-gray-900">{{ formatDate(opportunity.createdAt) }}</dd>
          </div>
          <div class="bg-gray-50 rounded-lg p-3">
            <dt class="text-xs font-medium text-gray-500 uppercase tracking-wide">Total Risks</dt>
            <dd class="mt-1 text-sm text-gray-900 font-semibold text-blue-600">{{ risks.length }}</dd>
          </div>
          <div class="bg-gray-50 rounded-lg p-3">
            <dt class="text-xs font-medium text-gray-500 uppercase tracking-wide">Open Risks</dt>
            <dd class="mt-1 text-sm text-gray-900 font-semibold text-red-600">{{ getOpenRisksCount() }}</dd>
          </div>
        </div>
      </div>
    </div>

    <!-- Risk Management Section -->
    <div class="bg-white rounded-lg shadow-sm border">
      <div class="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
        <div>
          <h3 class="text-lg font-semibold text-gray-900">Associated Risks</h3>
          <p class="text-gray-600 text-sm mt-1">Manage all risks for this opportunity</p>
        </div>
        <button
          @click="showCreateRiskModal = true"
          :disabled="!opportunity"
          class="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg font-medium flex items-center space-x-2 transition-colors"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
          </svg>
          <span>Add Risk</span>
        </button>
      </div>

      <!-- Risk Filters/Stats -->
      <div class="px-6 py-3 bg-gray-50 border-b border-gray-200">
        <div class="flex space-x-6 text-sm">
          <button
            @click="filterStatus = 'all'"
            :class="filterStatus === 'all' ? 'text-blue-600 font-medium' : 'text-gray-600 hover:text-gray-900'"
          >
            All ({{ risks.length }})
          </button>
          <button
            @click="filterStatus = 'Open'"
            :class="filterStatus === 'Open' ? 'text-red-600 font-medium' : 'text-gray-600 hover:text-gray-900'"
          >
            Open ({{ getStatusCount('Open') }})
          </button>
          <button
            @click="filterStatus = 'Mitigated'"
            :class="filterStatus === 'Mitigated' ? 'text-blue-600 font-medium' : 'text-gray-600 hover:text-gray-900'"
          >
            Mitigated ({{ getStatusCount('Mitigated') }})
          </button>
          <button
            @click="filterStatus = 'Closed'"
            :class="filterStatus === 'Closed' ? 'text-green-600 font-medium' : 'text-gray-600 hover:text-gray-900'"
          >
            Closed ({{ getStatusCount('Closed') }})
          </button>
        </div>
      </div>

      <!-- Risks Loading -->
      <div v-if="risksLoading" class="px-6 py-8 text-center">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p class="text-gray-500 mt-2">Loading risks...</p>
      </div>

      <!-- Risks List -->
      <div v-else-if="filteredRisks.length > 0" class="divide-y divide-gray-200">
        <div 
          v-for="risk in filteredRisks" 
          :key="risk.ID"
          class="px-6 py-5 hover:bg-gray-50 transition-colors"
        >
          <div class="flex justify-between items-start">
            <div class="flex-1">
              <div class="flex items-start justify-between">
                <div class="flex-1">
                  <h4 class="text-lg font-medium text-gray-900 mb-1">
                    {{ risk.title || 'Untitled Risk' }}
                  </h4>
                  <p class="text-gray-600 text-sm mb-3">
                    {{ risk.description || 'No description available' }}
                  </p>
                </div>
                <div class="flex items-center space-x-2 ml-4">
                  <button
                    @click="editRisk(risk)"
                    class="text-gray-600 hover:text-gray-800 text-sm font-medium flex items-center bg-gray-100 hover:bg-gray-200 px-3 py-1 rounded transition-colors"
                  >
                    <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                    </svg>
                    Edit
                  </button>
                  <button
                    @click="confirmDeleteRisk(risk)"
                    class="text-red-600 hover:text-red-800 text-sm font-medium flex items-center bg-red-50 hover:bg-red-100 px-3 py-1 rounded transition-colors"
                  >
                    <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                    </svg>
                    Delete
                  </button>
                </div>
              </div>
              
              <!-- Risk Metrics -->
              <div class="flex flex-wrap gap-4 mb-3">
                <div class="flex items-center">
                  <span class="text-xs text-gray-500 uppercase tracking-wide mr-2">Impact:</span>
                  <span :class="getImpactClass(risk.impact)" class="px-2 py-1 rounded text-xs font-medium">
                    {{ risk.impact || 'N/A' }}
                  </span>
                </div>
                <div class="flex items-center">
                  <span class="text-xs text-gray-500 uppercase tracking-wide mr-2">Probability:</span>
                  <span :class="getProbabilityClass(risk.probability)" class="px-2 py-1 rounded text-xs font-medium">
                    {{ risk.probability || 'N/A' }}
                  </span>
                </div>
                <div class="flex items-center">
                  <span class="text-xs text-gray-500 uppercase tracking-wide mr-2">Status:</span>
                  <span :class="getRiskStatusClass(risk.status)" class="px-2 py-1 rounded text-xs font-medium">
                    {{ risk.status || 'Open' }}
                  </span>
                </div>
                <div v-if="risk.owner" class="flex items-center">
                  <span class="text-xs text-gray-500 uppercase tracking-wide mr-2">Owner:</span>
                  <span class="text-xs text-gray-700 font-medium">{{ risk.owner }}</span>
                </div>
                <div v-if="risk.dueDate" class="flex items-center">
                  <span class="text-xs text-gray-500 uppercase tracking-wide mr-2">Due:</span>
                  <span class="text-xs text-gray-700 font-medium">{{ formatDate(risk.dueDate) }}</span>
                </div>
              </div>

              <!-- Risk Mitigation -->
              <div v-if="risk.mitigation" class="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm">
                <div class="flex items-start">
                  <svg class="w-4 h-4 text-blue-600 mt-0.5 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                  <div>
                    <span class="text-blue-800 font-medium">Mitigation Strategy:</span>
                    <p class="text-blue-700 mt-1">{{ risk.mitigation }}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- No Risks State -->
      <div v-else-if="!risksLoading" class="px-6 py-12 text-center">
        <div class="text-gray-400 text-5xl mb-4">⚠️</div>
        <h3 class="text-lg font-medium text-gray-900 mb-2">
          {{ filterStatus === 'all' ? 'No risks identified' : `No ${filterStatus.toLowerCase()} risks` }}
        </h3>
        <p class="text-gray-500 mb-6">
          {{ filterStatus === 'all' 
            ? 'This opportunity currently has no associated risks.' 
            : `There are no risks with ${filterStatus.toLowerCase()} status.` }}
        </p>
        <button
          v-if="filterStatus === 'all'"
          @click="showCreateRiskModal = true"
          :disabled="!opportunity"
          class="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-6 py-2 rounded-lg font-medium transition-colors"
        >
          Add First Risk
        </button>
        <button
          v-else
          @click="filterStatus = 'all'"
          class="text-blue-600 hover:text-blue-800 font-medium"
        >
          View All Risks
        </button>
      </div>
    </div>

    <!-- Risk Create/Edit Modal -->
    <RiskForm
      :is-visible="showCreateRiskModal || showEditRiskModal"
      :risk="selectedRisk"
      :opportunity-id="id"
      @close="closeRiskModal"
      @saved="handleRiskSaved"
    />

    <!-- Delete Risk Confirmation Modal -->
    <div v-if="showDeleteRiskModal" class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div class="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <div class="mt-3 text-center">
          <div class="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
            <svg class="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.864-.833-2.633 0L4.182 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
            </svg>
          </div>
          <h3 class="text-lg font-medium text-gray-900 mt-2">Delete Risk</h3>
          <div class="mt-2 px-7 py-3">
            <p class="text-sm text-gray-500">
              Are you sure you want to delete "{{ riskToDelete?.title }}"? This action cannot be undone.
            </p>
          </div>
          <div class="flex justify-center space-x-3 mt-4">
            <button
              @click="showDeleteRiskModal = false"
              class="px-4 py-2 bg-gray-300 text-gray-800 text-sm font-medium rounded-md hover:bg-gray-400 transition-colors"
            >
              Cancel
            </button>
            <button
              @click="deleteRisk"
              :disabled="deletingRisk"
              class="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-md hover:bg-red-700 disabled:opacity-50 transition-colors"
            >
              {{ deletingRisk ? 'Deleting...' : 'Delete' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { opportunityService, riskService, apiUtils } from '../services/api.js'
import RiskForm from '../components/RiskForm.vue'

export default {
  name: 'OpportunityRiskManager',
  components: {
    RiskForm
  },
  props: ['id'],
  data() {
    return {
      opportunity: null,
      risks: [],
      opportunityLoading: true,
      risksLoading: true,
      opportunityError: null,
      showCreateRiskModal: false,
      showEditRiskModal: false,
      showDeleteRiskModal: false,
      selectedRisk: null,
      riskToDelete: null,
      deletingRisk: false,
      filterStatus: 'all'
    }
  },
  computed: {
    filteredRisks() {
      if (this.filterStatus === 'all') {
        return this.risks
      }
      return this.risks.filter(risk => risk.status === this.filterStatus)
    }
  },
  async mounted() {
    await this.fetchOpportunity()
    await this.fetchRisks()
  },
  methods: {
    async fetchOpportunity() {
      this.opportunityLoading = true
      this.opportunityError = null
      
      try {
        this.opportunity = await opportunityService.getOpportunity(this.id)
      } catch (error) {
        console.error('Error fetching opportunity from SAP CRM:', error)
        this.opportunityError = error.response?.data?.error?.message || error.message || 'Failed to load opportunity from SAP CRM'
      } finally {
        this.opportunityLoading = false
      }
    },

    async fetchRisks() {
      this.risksLoading = true
      try {
        this.risks = await riskService.getOpportunityRisks(this.id)
      } catch (error) {
        console.warn('Could not load risks:', error)
        this.risks = []
      }
      this.risksLoading = false
    },

    formatDate(dateString) {
      return apiUtils.formatDate(dateString)
    },

    getStatusClass(status) {
      const statusClasses = {
        'Active': 'bg-green-100 text-green-800',
        'On Hold': 'bg-yellow-100 text-yellow-800',
        'Closed': 'bg-gray-100 text-gray-800',
        'Cancelled': 'bg-red-100 text-red-800'
      }
      return statusClasses[status] || 'bg-blue-100 text-blue-800'
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

    getRiskStatusClass(status) {
      const stat = (status || '').toLowerCase()
      if (stat === 'closed') return 'bg-green-100 text-green-800'
      if (stat === 'mitigated') return 'bg-blue-100 text-blue-800'
      if (stat === 'open') return 'bg-red-100 text-red-800'
      return 'bg-gray-100 text-gray-800'
    },

    getStatusCount(status) {
      return this.risks.filter(risk => risk.status === status).length
    },

    getOpenRisksCount() {
      return this.risks.filter(risk => risk.status === 'Open').length
    },

    editRisk(risk) {
      this.selectedRisk = risk
      this.showEditRiskModal = true
    },

    confirmDeleteRisk(risk) {
      this.riskToDelete = risk
      this.showDeleteRiskModal = true
    },

    async deleteRisk() {
      if (!this.riskToDelete) return
      
      this.deletingRisk = true
      try {
        await riskService.deleteRisk(this.riskToDelete.ID)
        await this.fetchRisks()
        this.showDeleteRiskModal = false
        this.riskToDelete = null
      } catch (error) {
        console.error('Error deleting risk:', error)
        alert('Failed to delete risk: ' + (error.response?.data?.error?.message || error.message))
      } finally {
        this.deletingRisk = false
      }
    },

    closeRiskModal() {
      this.showCreateRiskModal = false
      this.showEditRiskModal = false
      this.selectedRisk = null
    },

    async handleRiskSaved() {
      await this.fetchRisks()
    }
  },
  watch: {
    id() {
      this.fetchOpportunity()
      this.fetchRisks()
    }
  }
}
</script>