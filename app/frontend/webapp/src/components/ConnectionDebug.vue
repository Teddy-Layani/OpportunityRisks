<!-- src/components/ConnectionDebug.vue -->
<template>
  <div class="bg-white rounded-lg shadow-sm border p-6">
    <div class="flex justify-between items-center mb-4">
      <h3 class="text-lg font-semibold text-gray-900">🔧 Backend Connection Debug</h3>
      <button
        @click="runFullDiagnostic"
        :disabled="testing"
        class="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg font-medium transition-colors"
      >
        {{ testing ? 'Testing...' : 'Run Diagnostic' }}
      </button>
    </div>

    <!-- Connection Status -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      <div class="bg-gray-50 rounded-lg p-4">
        <div class="text-sm font-medium text-gray-500">Frontend</div>
        <div class="flex items-center mt-1">
          <div class="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
          <span class="text-sm text-gray-900">Port 3002 (Running)</span>
        </div>
      </div>
      
      <div class="bg-gray-50 rounded-lg p-4">
        <div class="text-sm font-medium text-gray-500">Proxy Target</div>
        <div class="flex items-center mt-1">
          <div :class="connectionStatus.success ? 'bg-green-500' : 'bg-red-500'" class="w-2 h-2 rounded-full mr-2"></div>
          <span class="text-sm text-gray-900">Port 4004</span>
        </div>
      </div>
      
      <div class="bg-gray-50 rounded-lg p-4">
        <div class="text-sm font-medium text-gray-500">Backend Service</div>
        <div class="flex items-center mt-1">
          <div :class="backendStatus.success ? 'bg-green-500' : 'bg-red-500'" class="w-2 h-2 rounded-full mr-2"></div>
          <span class="text-sm text-gray-900">{{ backendStatus.success ? 'Available' : 'Unavailable' }}</span>
        </div>
      </div>
    </div>

    <!-- Test Results -->
    <div v-if="testResults.length > 0" class="space-y-4">
      <h4 class="font-medium text-gray-900">Test Results:</h4>
      
      <div class="space-y-2">
        <div 
          v-for="(result, index) in testResults" 
          :key="index"
          class="border rounded-lg p-3"
          :class="result.success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'"
        >
          <div class="flex items-start justify-between">
            <div class="flex-1">
              <div class="flex items-center">
                <span :class="result.success ? 'text-green-600' : 'text-red-600'" class="text-sm font-medium">
                  {{ result.success ? '✅' : '❌' }} {{ result.test }}
                </span>
              </div>
              <div class="text-xs text-gray-600 mt-1">{{ result.description }}</div>
              <div v-if="result.details" class="text-xs text-gray-500 mt-1 font-mono">
                {{ result.details }}
              </div>
            </div>
            <div v-if="result.status" class="text-xs font-medium px-2 py-1 rounded"
                 :class="result.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'">
              {{ result.status }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Configuration Display -->
    <div class="mt-6 p-4 bg-gray-50 rounded-lg">
      <h4 class="font-medium text-gray-900 mb-2">Current Configuration:</h4>
      <div class="text-xs text-gray-600 space-y-1 font-mono">
        <div>Frontend URL: {{ frontendUrl }}</div>
        <div>Backend Target: {{ backendTarget }}</div>
        <div>API Base Path: {{ apiBasePath }}</div>
        <div>Proxy Path: /opportunity-risks → {{ backendTarget }}/opportunity-risks</div>
      </div>
    </div>

    <!-- Quick Actions -->
    <div class="mt-6 flex flex-wrap gap-2">
      <button
        @click="testBasicConnection"
        :disabled="testing"
        class="bg-gray-600 hover:bg-gray-700 disabled:bg-gray-400 text-white px-3 py-1 rounded text-sm transition-colors"
      >
        Test Connection
      </button>
      <button
        @click="testOpportunityEndpoint"
        :disabled="testing"
        class="bg-gray-600 hover:bg-gray-700 disabled:bg-gray-400 text-white px-3 py-1 rounded text-sm transition-colors"
      >
        Test Opportunities
      </button>
      <button
        @click="testRiskEndpoint"
        :disabled="testing"
        class="bg-gray-600 hover:bg-gray-700 disabled:bg-gray-400 text-white px-3 py-1 rounded text-sm transition-colors"
      >
        Test Risks
      </button>
      <button
        @click="clearResults"
        class="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm transition-colors"
      >
        Clear Results
      </button>
    </div>

    <!-- Troubleshooting Guide -->
    <div class="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
      <h4 class="font-medium text-yellow-900 mb-2">🛠️ Troubleshooting Guide:</h4>
      <ul class="text-sm text-yellow-800 space-y-1">
        <li>• Ensure CAP backend is running: <code class="bg-yellow-100 px-1 rounded">cds watch</code></li>
        <li>• Check if port 4004 is accessible from your workspace</li>
        <li>• Verify proxy configuration in vite.config.js</li>
        <li>• Check browser console for detailed error messages</li>
        <li>• Try accessing backend directly: <a :href="directBackendUrl" target="_blank" class="underline">{{ directBackendUrl }}</a></li>
      </ul>
    </div>
  </div>
</template>

<script>
import { connectionUtils, opportunityService, riskService } from '../services/api.js'

export default {
  name: 'ConnectionDebug',
  data() {
    return {
      testing: false,
      testResults: [],
      connectionStatus: { success: false },
      backendStatus: { success: false },
      frontendUrl: window.location.origin,
      backendTarget: 'https://port4004-workspaces-ws-8dilk.ap10.applicationstudio.cloud.sap',
      apiBasePath: '/opportunity-risks'
    }
  },
  computed: {
    directBackendUrl() {
      return this.backendTarget + this.apiBasePath
    }
  },
  async mounted() {
    await this.testBasicConnection()
  },
  methods: {
    addResult(test, success, description, details = null, status = null) {
      this.testResults.push({
        test,
        success,
        description,
        details,
        status,
        timestamp: new Date().toLocaleTimeString()
      })
    },

    async testBasicConnection() {
      this.testing = true
      try {
        const result = await connectionUtils.testConnection()
        this.connectionStatus = result
        this.addResult(
          'Basic Connection',
          result.success,
          result.success ? 'Backend is reachable' : 'Cannot connect to backend',
          result.error || result.url,
          result.status
        )
      } catch (error) {
        this.addResult('Basic Connection', false, 'Connection test failed', error.message)
      }
      this.testing = false
    },

    async testOpportunityEndpoint() {
      this.testing = true
      try {
        const opportunities = await opportunityService.getOpportunities()
        this.addResult(
          'Opportunity Endpoint',
          true,
          `Retrieved ${opportunities.length} opportunities`,
          `/Opportunity endpoint working`,
          '200'
        )
      } catch (error) {
        this.addResult(
          'Opportunity Endpoint',
          false,
          'Failed to fetch opportunities',
          error.message
        )
      }
      this.testing = false
    },

    async testRiskEndpoint() {
      this.testing = true
      try {
        // Test with a sample opportunity ID
        const sampleId = '598e38c8-44fe-11f0-be69-7fb6bd09c2a6'
        const risks = await riskService.getOpportunityRisks(sampleId)
        this.addResult(
          'Risk Endpoint',
          true,
          `Retrieved ${risks.length} risks for sample opportunity`,
          `/Risk endpoint working`,
          '200'
        )
      } catch (error) {
        this.addResult(
          'Risk Endpoint',
          false,
          'Failed to fetch risks',
          error.message
        )
      }
      this.testing = false
    },

    async runFullDiagnostic() {
      this.clearResults()
      this.testing = true

      // Test 1: Basic Connection
      await this.testBasicConnection()

      // Test 2: Metadata
      try {
        const metadata = await connectionUtils.getServiceMetadata()
        this.addResult(
          'Service Metadata',
          metadata.success,
          metadata.success ? 'OData metadata accessible' : 'Metadata not available',
          metadata.error,
          metadata.success ? '200' : null
        )
      } catch (error) {
        this.addResult('Service Metadata', false, 'Metadata test failed', error.message)
      }

      // Test 3: Individual Endpoints
      const endpoints = [
        { path: '/Opportunity', name: 'Opportunities' },
        { path: '/Risk', name: 'Risks' },
        { path: '/$metadata', name: 'Metadata' }
      ]

      for (const endpoint of endpoints) {
        try {
          const result = await connectionUtils.testEndpoint(endpoint.path)
          this.addResult(
            endpoint.name,
            result.success,
            result.success ? `${endpoint.name} endpoint accessible` : `${endpoint.name} endpoint failed`,
            result.error,
            result.status
          )
        } catch (error) {
          this.addResult(endpoint.name, false, `${endpoint.name} test failed`, error.message)
        }
      }

      // Update backend status
      this.backendStatus.success = this.testResults.some(r => r.success)
      this.testing = false
    },

    clearResults() {
      this.testResults = []
    }
  }
}
</script>