<template>
  <div class="max-w-4xl mx-auto space-y-8">
    <!-- Header -->
    <div class="text-center">
      <h1 class="text-4xl font-bold text-gray-900 mb-4">
        🎯 Opportunity Risk Management
      </h1>
      <p class="text-xl text-gray-600">
        SAP CRM Integration + Risk Management Mashup
      </p>
    </div>

    <!-- NEW URL Structure Notice -->
    <div class="bg-green-50 border border-green-200 rounded-lg p-6">
      <div class="flex items-start space-x-3">
        <div class="flex-shrink-0">
          <div class="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
            <span class="text-green-600 font-bold">✓</span>
          </div>
        </div>
        <div>
          <h3 class="text-lg font-semibold text-green-900 mb-2">Updated URL Structure</h3>
          <p class="text-green-800 mb-3">
            The application now uses <strong>query parameters</strong> instead of path parameters for better flexibility and RESTful design.
          </p>
          <div class="bg-white border border-green-300 rounded-lg p-4">
            <div class="grid md:grid-cols-2 gap-4 text-sm">
              <div>
                <div class="text-red-700 font-medium mb-1">❌ Old Format:</div>
                <code class="text-red-600 text-xs break-all">/opportunity/{id}/risks</code>
              </div>
              <div>
                <div class="text-green-700 font-medium mb-1">✅ New Format:</div>
                <code class="text-green-600 text-xs break-all">/opportunityRisks?id={id}</code>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Navigation Helper -->
    <div class="bg-white rounded-lg shadow-sm border p-6">
      <h3 class="text-lg font-semibold text-gray-900 mb-4">🧭 Quick Navigation</h3>
      
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
          <div class="mb-2">Sample Opportunity IDs for testing:</div>
          <div class="grid grid-cols-1 gap-1">
            <button
              v-for="sampleId in sampleIds"
              :key="sampleId"
              @click="opportunityId = sampleId"
              class="text-left font-mono text-blue-600 hover:text-blue-800 cursor-pointer hover:bg-blue-50 px-2 py-1 rounded text-xs"
            >
              {{ sampleId }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Instructions Card -->
    <div class="bg-white rounded-lg shadow-sm border p-8">
      <div class="flex items-start space-x-4">
        <div class="flex-shrink-0">
          <div class="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
            <svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path>
            </svg>
          </div>
        </div>
        <div>
          <h2 class="text-2xl font-semibold text-gray-900 mb-4">How to Use This Application</h2>
          <div class="space-y-4 text-gray-600">
            <p>
              This application provides risk management capabilities for opportunities stored in SAP CRM. 
              To access the risk management interface for a specific opportunity, use the following URL pattern:
            </p>
            
            <div class="bg-gray-50 border-l-4 border-blue-500 p-4 rounded-r-lg">
              <p class="font-mono text-sm text-gray-800">
                <strong>NEW URL Pattern:</strong><br>
                <span class="text-blue-600">/opportunityRisks?id={OPPORTUNITY_ID}</span>
              </p>
              <p class="text-xs text-gray-600 mt-2">
                <em>Legacy format still supported with automatic redirect</em>
              </p>
            </div>

            <div class="grid md:grid-cols-2 gap-6 mt-6">
              <div>
                <h3 class="font-semibold text-gray-900 mb-2">📊 What You Can Do:</h3>
                <ul class="space-y-1 text-sm">
                  <li>• View opportunity details from SAP CRM</li>
                  <li>• Add new risks to opportunities</li>
                  <li>• Edit existing risk details</li>
                  <li>• Delete risks with confirmation</li>
                  <li>• Filter risks by status</li>
                  <li>• Track risk mitigation strategies</li>
                  <li>• Set risk owners and due dates</li>
                </ul>
              </div>
              <div>
                <h3 class="font-semibold text-gray-900 mb-2">🔗 Data Sources:</h3>
                <ul class="space-y-1 text-sm">
                  <li>• <strong>Opportunities:</strong> SAP CRM (read-only)</li>
                  <li>• <strong>Risks:</strong> Local database (full CRUD)</li>
                  <li>• <strong>Integration:</strong> CAP backend service</li>
                  <li>• <strong>URL Format:</strong> Query parameters</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Example Usage -->
    <div class="bg-blue-50 border border-blue-200 rounded-lg p-6">
      <h3 class="text-lg font-semibold text-blue-900 mb-3">📋 Example Usage</h3>
      <p class="text-blue-800 mb-4">
        To manage risks for a specific opportunity, construct the URL with the opportunity ID as a query parameter:
      </p>
      
      <div class="space-y-3">
        <!-- New Format Examples -->
        <div class="bg-white border border-blue-300 rounded-lg p-4">
          <div class="text-blue-700 font-medium mb-2">✅ Current Format (Recommended):</div>
          <div class="font-mono text-sm text-blue-600 break-all mb-2">
            {{ newExampleUrl }}
          </div>
          <button 
            @click="testNewUrl" 
            class="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm font-medium transition-colors"
          >
            Test This URL
          </button>
        </div>

        <!-- Legacy Format -->
        <div class="bg-gray-50 border border-gray-300 rounded-lg p-4">
          <div class="text-gray-700 font-medium mb-2">⚠️ Legacy Format (Auto-redirects):</div>
          <div class="font-mono text-sm text-gray-600 break-all">
            {{ legacyExampleUrl }}
          </div>
        </div>
      </div>
      
      <p class="text-blue-700 text-sm mt-3">
        Replace the opportunity ID with your actual SAP CRM opportunity identifier.
      </p>
    </div>

    <!-- URL Benefits -->
    <div class="bg-purple-50 border border-purple-200 rounded-lg p-6">
      <h3 class="text-lg font-semibold text-purple-900 mb-3">🚀 Query Parameter Benefits</h3>
      <div class="grid md:grid-cols-2 gap-4 text-sm text-purple-800">
        <div>
          <h4 class="font-medium mb-2">✅ Advantages:</h4>
          <ul class="space-y-1">
            <li>• More flexible URL structure</li>
            <li>• Easier to add additional parameters</li>
            <li>• Better for bookmarking and sharing</li>
            <li>• RESTful API alignment</li>
            <li>• Cleaner route definitions</li>
          </ul>
        </div>
        <div>
          <h4 class="font-medium mb-2">🔧 Implementation:</h4>
          <ul class="space-y-1">
            <li>• Vue Router query prop binding</li>
            <li>• Backward compatibility maintained</li>
            <li>• Automatic redirects from legacy URLs</li>
            <li>• Enhanced breadcrumb navigation</li>
            <li>• CSP headers for iframe support</li>
          </ul>
        </div>
      </div>
    </div>

    <!-- Technical Details -->
    <div class="bg-gray-50 rounded-lg p-6">
      <h3 class="text-lg font-semibold text-gray-900 mb-3">⚙️ Technical Details</h3>
      <div class="grid md:grid-cols-2 gap-6 text-sm text-gray-600">
        <div>
          <h4 class="font-medium text-gray-900 mb-2">Backend Integration:</h4>
          <ul class="space-y-1">
            <li>• CAP service: <code class="bg-gray-200 px-1 rounded">/opportunity-risks/</code></li>
            <li>• Opportunity data from SAP CRM</li>
            <li>• Risk data stored locally</li>
            <li>• RESTful API endpoints</li>
            <li>• Enhanced error handling</li>
          </ul>
        </div>
        <div>
          <h4 class="font-medium text-gray-900 mb-2">Frontend Technology:</h4>
          <ul class="space-y-1">
            <li>• Vue 3 with Composition API</li>
            <li>• Vue Router query parameters</li>
            <li>• Tailwind CSS styling</li>
            <li>• Axios for HTTP requests</li>
            <li>• Responsive design + CSP support</li>
          </ul>
        </div>
      </div>
    </div>

    <!-- Status Indicator -->
    <div class="text-center">
      <div class="inline-flex items-center space-x-2 bg-green-50 border border-green-200 rounded-full px-4 py-2 text-green-800">
        <div class="w-2 h-2 bg-green-500 rounded-full"></div>
        <span class="text-sm font-medium">Application Ready - Query Parameter URL Structure</span>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'Home',
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
    newExampleUrl() {
      const baseUrl = window.location.origin
      return `${baseUrl}/opportunityRisks?id=598e38c8-44fe-11f0-be69-7fb6bd09c2a6`
    },
    
    legacyExampleUrl() {
      const baseUrl = window.location.origin
      return `${baseUrl}/opportunity/598e38c8-44fe-11f0-be69-7fb6bd09c2a6/risks`
    },
    
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
    },
    
    testNewUrl() {
      // Navigate to the new URL format for testing
      this.$router.push({
        name: 'opportunity-risks',
        query: { id: '598e38c8-44fe-11f0-be69-7fb6bd09c2a6' }
      })
    }
  }
}
</script>