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
                <strong>URL Pattern:</strong><br>
                <span class="text-blue-600">/opportunity/{OPPORTUNITY_ID}/risks</span>
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
                </ul>
              </div>
              <div>
                <h3 class="font-semibold text-gray-900 mb-2">🔗 Data Sources:</h3>
                <ul class="space-y-1 text-sm">
                  <li>• <strong>Opportunities:</strong> SAP CRM (read-only)</li>
                  <li>• <strong>Risks:</strong> Local database (full CRUD)</li>
                  <li>• <strong>Integration:</strong> CAP backend service</li>
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
        To manage risks for a specific opportunity, construct the URL with the opportunity ID:
      </p>
      
      <div class="bg-white border border-blue-300 rounded-lg p-4 font-mono text-sm">
        <div class="text-gray-600 mb-2">Example URL:</div>
        <div class="text-blue-600 break-all">
          {{ exampleUrl }}
        </div>
      </div>
      
      <p class="text-blue-700 text-sm mt-3">
        Replace the opportunity ID with your actual SAP CRM opportunity identifier.
      </p>
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
          </ul>
        </div>
        <div>
          <h4 class="font-medium text-gray-900 mb-2">Frontend Technology:</h4>
          <ul class="space-y-1">
            <li>• Vue 3 with Composition API</li>
            <li>• Tailwind CSS styling</li>
            <li>• Axios for HTTP requests</li>
            <li>• Responsive design</li>
          </ul>
        </div>
      </div>
    </div>

    <!-- Status Indicator -->
    <div class="text-center">
      <div class="inline-flex items-center space-x-2 bg-green-50 border border-green-200 rounded-full px-4 py-2 text-green-800">
        <div class="w-2 h-2 bg-green-500 rounded-full"></div>
        <span class="text-sm font-medium">Application Ready</span>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'Home',
  computed: {
    exampleUrl() {
      const baseUrl = window.location.origin
      return `${baseUrl}/opportunity/53397f8c-6355-4c4e-8b50-433ee99d1067/risks`
    }
  }
}
</script>