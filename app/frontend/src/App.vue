<template>
  <div id="app" class="min-h-screen bg-gray-50">
    <!-- Navigation Header -->
    <nav class="bg-white shadow-sm border-b">
      <div class="container mx-auto px-4">
        <div class="flex justify-between items-center h-16">
          <div class="flex items-center space-x-4">
            <router-link to="/" class="text-xl font-bold text-blue-600 hover:text-blue-800">
              📊 Opportunity Risk Management
            </router-link>
            <div class="text-sm text-gray-500">
              {{ currentContext }}
            </div>
          </div>
          <div class="flex items-center space-x-3">
            <!-- Current URL Display -->
            <div class="text-xs text-gray-400 font-mono bg-gray-100 px-2 py-1 rounded">
              {{ currentPath }}
            </div>
            <!-- URL Format Indicator -->
            <div :class="urlFormatClass" class="rounded-lg px-2 py-1">
              <span class="text-xs font-medium">{{ urlFormatText }}</span>
            </div>
            <!-- SAP CRM Integration Badge -->
            <div class="bg-blue-50 border border-blue-200 rounded-lg px-2 py-1">
              <span class="text-blue-800 text-xs font-medium">🔗 SAP CRM</span>
            </div>
          </div>
        </div>
      </div>
    </nav>

    <!-- Breadcrumb Navigation -->
    <nav v-if="showBreadcrumb" class="bg-gray-50 border-b">
      <div class="container mx-auto px-4 py-2">
        <ol class="flex items-center space-x-2 text-sm">
          <li>
            <router-link to="/" class="text-blue-600 hover:text-blue-800">
              Home
            </router-link>
          </li>
          <li class="flex items-center">
            <svg class="flex-shrink-0 h-4 w-4 text-gray-400 mx-2" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd" />
            </svg>
            <span class="text-gray-700">Risk Management</span>
          </li>
          <li v-if="opportunityId" class="flex items-center">
            <svg class="flex-shrink-0 h-4 w-4 text-gray-400 mx-2" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd" />
            </svg>
            <span class="text-gray-500 font-mono text-xs">{{ opportunityId }}</span>
          </li>
        </ol>
      </div>
    </nav>

    <!-- Main Content -->
    <main class="container mx-auto px-4 py-6">
      <router-view />
    </main>

    <!-- Footer -->
    <footer class="bg-white border-t mt-12">
      <div class="container mx-auto px-4 py-6">
        <div class="flex justify-between items-center text-sm text-gray-500">
          <div>
            <span class="font-medium">Mashup Application:</span> 
            Opportunities from SAP CRM + Risk Management
          </div>
          <div class="flex items-center space-x-4">
            <span>Backend: /opportunity-risks/</span>
            <span>•</span>
            <span>Frontend: Vue 3 + Tailwind CSS</span>
            <span>•</span>
            <span :class="isNewUrlFormat ? 'text-green-600' : 'text-orange-600'">
              {{ isNewUrlFormat ? '✓ Query Parameter URL' : '⚠️ Legacy URL Format' }}
            </span>
          </div>
        </div>
      </div>
    </footer>
  </div>
</template>

<script>
export default {
  name: 'App',
  computed: {
    currentContext() {
      const route = this.$route
      
      // Handle new query parameter format
      if (route.name === 'opportunity-risks' && route.query.id) {
        return `Managing risks for opportunity: ${route.query.id}`
      }
      
      // Handle legacy path parameter format
      if (route.name === 'opportunity-risks-legacy' && route.params.id) {
        return `Managing risks for opportunity: ${route.params.id} (redirecting...)`
      }
      
      if (route.name === 'home') {
        return 'Application Home'
      }
      
      return 'SAP CRM Integration'
    },
    
    currentPath() {
      return this.$route.fullPath
    },
    
    showBreadcrumb() {
      return this.$route.name === 'opportunity-risks' || this.$route.name === 'opportunity-risks-legacy'
    },
    
    opportunityId() {
      // Support both query and path parameters
      return this.$route.query.id || this.$route.params.id
    },
    
    isNewUrlFormat() {
      return this.$route.name === 'opportunity-risks' && this.$route.query.id
    },
    
    urlFormatClass() {
      return this.isNewUrlFormat 
        ? 'bg-green-50 border border-green-200' 
        : 'bg-orange-50 border border-orange-200'
    },
    
    urlFormatText() {
      return this.isNewUrlFormat ? '✓ Query Params' : '⚠️ Legacy Format'
    }
  }
}
</script>