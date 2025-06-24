<template>
  <div v-if="isVisible" class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
    <div class="relative top-10 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white max-h-screen overflow-y-auto">
      <!-- Modal Header -->
      <div class="flex justify-between items-center pb-3">
        <h3 class="text-lg font-bold text-gray-900">
          {{ isEdit ? 'Edit Risk' : 'Add New Risk' }}
        </h3>
        <button @click="closeModal" class="text-gray-400 hover:text-gray-600">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
          </svg>
        </button>
      </div>

      <!-- Form -->
      <form @submit.prevent="submitForm" class="space-y-4">
        <!-- Title Field -->
        <div>
          <label for="title" class="block text-sm font-medium text-gray-700 mb-1">
            Risk Title *
          </label>
          <input
            id="title"
            v-model="formData.title"
            type="text"
            required
            class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            placeholder="Enter risk title"
          />
        </div>

        <!-- Description Field -->
        <div>
          <label for="description" class="block text-sm font-medium text-gray-700 mb-1">
            Description
          </label>
          <textarea
            id="description"
            v-model="formData.description"
            rows="3"
            class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            placeholder="Describe the risk in detail"
          ></textarea>
        </div>

        <!-- Impact and Probability Row -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <!-- Impact Field -->
          <div>
            <label for="impact" class="block text-sm font-medium text-gray-700 mb-1">
              Impact Level
            </label>
            <select
              id="impact"
              v-model="formData.impact"
              class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
            </select>
          </div>

          <!-- Probability Field -->
          <div>
            <label for="probability" class="block text-sm font-medium text-gray-700 mb-1">
              Probability
            </label>
            <select
              id="probability"
              v-model="formData.probability"
              class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
            </select>
          </div>
        </div>

        <!-- Status and Owner Row -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <!-- Status Field -->
          <div>
            <label for="status" class="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              id="status"
              v-model="formData.status"
              class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="Open">Open</option>
              <option value="Mitigated">Mitigated</option>
              <option value="Closed">Closed</option>
            </select>
          </div>

          <!-- Owner Field -->
          <div>
            <label for="owner" class="block text-sm font-medium text-gray-700 mb-1">
              Risk Owner
            </label>
            <input
              id="owner"
              v-model="formData.owner"
              type="text"
              class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="Who is responsible for this risk?"
            />
          </div>
        </div>

        <!-- Mitigation Field -->
        <div>
          <label for="mitigation" class="block text-sm font-medium text-gray-700 mb-1">
            Mitigation Strategy
          </label>
          <textarea
            id="mitigation"
            v-model="formData.mitigation"
            rows="3"
            class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            placeholder="How will this risk be mitigated?"
          ></textarea>
        </div>

        <!-- Due Date Field -->
        <div>
          <label for="dueDate" class="block text-sm font-medium text-gray-700 mb-1">
            Due Date
          </label>
          <input
            id="dueDate"
            v-model="formData.dueDate"
            type="date"
            class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <!-- Error Display -->
        <div v-if="error" class="bg-red-50 border border-red-200 rounded-md p-3">
          <p class="text-red-600 text-sm">{{ error }}</p>
        </div>

        <!-- Form Actions -->
        <div class="flex justify-end space-x-3 pt-4">
          <button
            type="button"
            @click="closeModal"
            class="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500"
          >
            Cancel
          </button>
          <button
            type="submit"
            :disabled="loading || !formData.title.trim()"
            class="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span v-if="loading">
              <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white inline" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              {{ isEdit ? 'Updating...' : 'Adding...' }}
            </span>
            <span v-else>
              {{ isEdit ? 'Update Risk' : 'Add Risk' }}
            </span>
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script>
import { riskService } from '../services/api.js'
import { apiUtils } from '../services/api.js'

export default {
  name: 'RiskForm',
  props: {
    isVisible: {
      type: Boolean,
      default: false
    },
    risk: {
      type: Object,
      default: null
    },
    opportunityId: {
      type: String,
      required: true
    }
  },
  emits: ['close', 'saved'],
  data() {
    return {
      formData: {
        title: '',
        description: '',
        impact: 'Medium',
        probability: 'Medium',
        status: 'Open',
        owner: '',
        mitigation: '',
        dueDate: ''
      },
      loading: false,
      error: null
    }
  },
  computed: {
    isEdit() {
      return !!this.risk
    }
  },
  watch: {
    isVisible(newVal) {
      if (newVal) {
        this.resetForm()
        if (this.risk) {
          this.loadRiskData()
        }
      }
    }
  },
  methods: {
    resetForm() {
      this.formData = {
        title: '',
        description: '',
        impact: 'Medium',
        probability: 'Medium',
        status: 'Open',
        owner: '',
        mitigation: '',
        dueDate: ''
      }
      this.error = null
      this.loading = false
    },
    loadRiskData() {
      if (this.risk) {
        this.formData = {
          title: this.risk.title || '',
          description: this.risk.description || '',
          impact: this.risk.impact || 'Medium',
          probability: this.risk.probability || 'Medium',
          status: this.risk.status || 'Open',
          owner: this.risk.owner || '',
          mitigation: this.risk.mitigation || '',
          dueDate: apiUtils.formatDateForInput(this.risk.dueDate) || ''
        }
      }
    },
    async submitForm() {
      this.loading = true
      this.error = null

      try {
        if (this.isEdit) {
          // Update existing risk
          await riskService.updateRisk(this.risk.ID, this.formData)
        } else {
          // Create new risk
          await riskService.createRisk(this.opportunityId, this.formData)
        }
        
        this.$emit('saved')
        this.closeModal()
      } catch (error) {
        console.error('Error saving risk:', error)
        this.error = error.response?.data?.error?.message || error.message || 'Failed to save risk'
      } finally {
        this.loading = false
      }
    },
    closeModal() {
      this.$emit('close')
    }
  }
}
</script>
