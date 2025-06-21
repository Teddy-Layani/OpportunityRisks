<template>
  <div id="app" class="min-h-screen bg-gray-50">
    <!-- Simple Navigation Header -->
    <nav class="bg-white shadow-sm border-b">
      <div class="container mx-auto px-4">
        <div class="flex justify-between items-center h-16">
          <div class="flex items-center space-x-4">
            <h1 class="text-xl font-bold text-blue-600">
              📊 Opportunity Risk Management
            </h1>
            <div class="text-sm text-gray-500">
              {{ currentContext }}
            </div>
          </div>
          <div class="flex items-center space-x-3">
            <!-- Current URL Display -->
            <div class="text-xs text-gray-400 font-mono bg-gray-100 px-2 py-1 rounded">
              {{ currentPath }}
            </div>
            <!-- SAP CRM Integration Badge -->
            <div class="bg-blue-50 border border-blue-200 rounded-lg px-2 py-1">
              <span class="text-blue-800 text-xs font-medium">🔗 SAP CRM</span>
            </div>
          </div>
        </div>
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
      if (route.name === 'opportunity-risks' && route.params.id) {
        return `Managing risks for opportunity: ${route.params.id}`
      }
      if (route.name === 'home') {
        return 'Application Home'
      }
      return 'SAP CRM Integration'
    },
    currentPath() {
      return this.$route.fullPath
    }
  }
}
</script>