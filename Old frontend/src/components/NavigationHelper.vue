<!-- Create this as src/components/NavigationHelper.vue -->
<template>
  <div class="bg-white rounded-lg shadow-sm border p-4">
    <h3 class="text-lg font-semibold text-gray-900 mb-4">🧭 Navigation Helper</h3>
    
    <!-- Quick Access Form -->
    <div class="space-y-4">
      <div>
        <label for="opportunityId" class="block text-sm font-medium text-gray-700 mb-2">
          Enter Opportunity ID:
        </label>
        <div class="flex space-x-2">
          <input
            id="opportunityId"
            v-model="opportunityId"
            type="text"
            placeholder="e.g., 598e38c8-44fe-11f0-be69-7fb6bd09c2a6"
            class="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
          />
          <button
            @click="navigateToRisks"
            :disabled="!opportunityId.trim()"
            class="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-md font-medium text-sm transition-colors"
          >
            Go to Risks
          </button>
        </div>
      </div>
      
      <!-- URL Preview -->
      <div v-if="opportunityId.trim()" class="bg-gray-50 rounded-lg p-3">
        <div class="text-xs text-gray-500 mb-1">Generated URL:</div>
        <div class="font-mono text-sm text-blue-600 break-all">
          {{ generatedUrl }}
        </div>
      </div>
      
      <!-- Sample Opportunity IDs -->
      <div class="text-xs text-gray-500">
        <div class="mb-1">Sample Opportunity IDs for testing:</div>
        <div class="space-y-1">
          <button
            v-for="sampleId in sampleIds"
            :key="sampleId"
            @click="opportunityId = sampleId"
            class="block font-mono text-blue-600 hover:text-blue-800 cursor-pointer"
          >
            {{ sampleId }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'NavigationHelper',
  data() {
    return {
      opportunityId: '',
      sampleIds: [
        '598e38c8-44fe-11f0-be69-7fb6bd09c2a6',
        '53397f8c-6355-4c4e-8b50-433ee99d1067',
        '7a8b9c0d-1234-5678-9abc-def012345678'
      ]
    }
  },
  computed: {
    generatedUrl() {
      if (!this.opportunityId.trim()) return ''
      const baseUrl = window.location.origin
      return `${baseUrl}/opportunityRisks?id=${this.opportunityId.trim()}`
    }
  },
  methods: {
    navigateToRisks() {
      if (!this.opportunityId.trim()) return
      
      this.$router.push({
        name: 'opportunity-risks',
        query: { id: this.opportunityId.trim() }
      })
    }
  }
}
</script>