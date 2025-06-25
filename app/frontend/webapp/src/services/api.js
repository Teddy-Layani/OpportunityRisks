// app/frontend/webapp/src/services/api.js - Using Vite environment variables
import axios from 'axios'

// Smart environment detection and configuration using Vite env vars
const getApiConfig = () => {
  const hostname = window.location.hostname
  
  // Check for various development environments
  const isDevelopment = (
    hostname === 'localhost' || 
    hostname === '127.0.0.1' ||
    hostname.includes('applicationstudio.cloud.sap') || // SAP BAS
    hostname.includes('gitpod.io') || // Gitpod
    hostname.includes('codespaces') || // GitHub Codespaces
    hostname.includes('preview') // Other cloud IDEs
  )
  
  if (isDevelopment) {
    console.log('🔧 Development environment detected:', hostname)
    return {
      baseURL: import.meta.env.VITE_API_BASE_URL || '/opportunity-risks',
      environment: import.meta.env.VITE_ENVIRONMENT || 'development'
    }
  }
  
  // Production: use environment variables
  console.log('🌐 Production environment detected:', hostname)
  return {
    baseURL: import.meta.env.VITE_API_BASE_URL || window.location.origin + '/opportunity-risks',
    environment: import.meta.env.VITE_ENVIRONMENT || 'production'
  }
}

const config = getApiConfig()

// Create axios instance with environment-based configuration
const api = axios.create({
  baseURL: config.baseURL,
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json'
  },
  timeout: 30000,
  // Use credentials only in development (same origin)
  withCredentials: config.environment === 'development'
})

// Enhanced request interceptor with environment info
api.interceptors.request.use(
  (config) => {
    const fullUrl = `${config.baseURL}${config.url}`
    console.log(`🚀 API Request [${getApiConfig().environment}]:`, config.method?.toUpperCase(), fullUrl)
    
    // Log environment variables in development
    if (import.meta.env.DEV) {
      console.log('🔧 Environment Variables:', {
        VITE_API_BASE_URL: import.meta.env.VITE_API_BASE_URL,
        VITE_ENVIRONMENT: import.meta.env.VITE_ENVIRONMENT,
        NODE_ENV: import.meta.env.NODE_ENV,
        MODE: import.meta.env.MODE
      })
    }
    
    return config
  },
  (error) => {
    console.error('❌ API Request Error:', error)
    return Promise.reject(error)
  }
)

// Enhanced response interceptor
api.interceptors.response.use(
  (response) => {
    console.log(`✅ API Response [${getApiConfig().environment}]:`, response.status, response.config.url)
    return response
  },
  (error) => {
    const fullUrl = `${error.config?.baseURL}${error.config?.url}`
    console.error(`❌ API Error [${getApiConfig().environment}]:`, {
      status: error.response?.status,
      message: error.message,
      url: fullUrl,
      data: error.response?.data
    })
    
    // Enhanced error handling with specific messages
    if (error.response?.status === 401) {
      console.error('🔐 Unauthorized - check backend authentication')
    } else if (error.response?.status === 404) {
      console.error('🔍 Not found - check if backend service is running at:', fullUrl)
    } else if (error.code === 'ERR_NETWORK' || !error.response) {
      console.error('🌐 Network error - check if backend is accessible at:', error.config?.baseURL)
      if (getApiConfig().environment === 'development') {
        console.error('💡 Make sure your backend is running: npm run cds-watch')
        console.error('💡 Check VITE_API_BASE_URL in .env files:', import.meta.env.VITE_API_BASE_URL)
      }
    } else if (error.response?.status >= 500) {
      console.error('🔥 Server error - backend service issue')
    } else if (error.message.includes('CORS')) {
      console.error('🚫 CORS error - check if Vite proxy is configured correctly')
    }
    
    return Promise.reject(error)
  }
)

// OPPORTUNITY OPERATIONS (READ-ONLY - Data comes from SAP CRM)
export const opportunityService = {
  // READ - Get all opportunities (from SAP CRM via CAP service)
  async getOpportunities() {
    try {
      const response = await api.get('/Opportunity')
      return response.data.value || response.data || []
    } catch (error) {
      console.error('Error fetching opportunities from SAP CRM:', error)
      throw error
    }
  },

  // READ - Get specific opportunity (from SAP CRM via CAP service)
  async getOpportunity(id) {
    try {
      console.log(`🔍 Fetching opportunity: ${id}`)
      const response = await api.get(`/Opportunity('${id}')`)
      return response.data
    } catch (error) {
      console.error(`Error fetching opportunity ${id} from SAP CRM:`, error)
      throw error
    }
  }
}

// RISK CRUD OPERATIONS (Full CRUD - Managed locally)
export const riskService = {
  // READ - Get risks for opportunity with multiple fallback methods
  async getOpportunityRisks(opportunityId) {
    try {
      console.log('🔍 Fetching risks for opportunity:', opportunityId)
      
      // Method 1: Try navigation first (what we've been testing)
      try {
        console.log('Method 1: Trying navigation endpoint...')
        let response = await api.get(`/Opportunity('${opportunityId}')/risks`)
        let risks = response.data.value || response.data || []
        console.log('Navigation returned:', risks.length, 'risks')
        
        if (risks.length > 0) {
          console.log('✅ Navigation successful, returning risks')
          return risks
        }
      } catch (navError) {
        console.log('Navigation failed:', navError.message)
      }
      
      // Method 2: Try direct Risk query with filter
      try {
        console.log('Method 2: Trying direct filter query...')
        const response = await api.get(`/Risk?$filter=opportunityID eq '${opportunityId}'`)
        const risks = response.data.value || response.data || []
        console.log('Filter query returned:', risks.length, 'risks')
        
        if (risks.length > 0) {
          console.log('✅ Filter query successful, returning risks')
          return risks
        }
      } catch (filterError) {
        console.log('Filter query failed:', filterError.message)
      }
      
      // Method 3: Get all risks and filter client-side
      try {
        console.log('Method 3: Trying get all + client filter...')
        const response = await api.get(`/Risk`)
        const allRisks = response.data.value || response.data || []
        console.log('Got', allRisks.length, 'total risks from database')
        
        const filteredRisks = allRisks.filter(risk => {
          console.log('Checking risk:', risk.ID, 'opportunityID:', risk.opportunityID, 'target:', opportunityId)
          return risk.opportunityID === opportunityId
        })
        console.log('Client filter found:', filteredRisks.length, 'matching risks')
        
        if (filteredRisks.length > 0) {
          console.log('✅ Client filter successful, returning risks')
        } else {
          console.log('⚠️ No risks found for this opportunity')
        }
        return filteredRisks
      } catch (allError) {
        console.log('Get all risks failed:', allError.message)
      }
      
      // If all methods fail, return empty array
      console.log('❌ All methods failed, returning empty array')
      return []
      
    } catch (error) {
      console.error(`❌ Error fetching risks for opportunity ${opportunityId}:`, error)
      return []
    }
  },

  // READ - Get specific risk
  async getRisk(riskId) {
    try {
      const response = await api.get(`/Risk('${riskId}')`)
      return response.data
    } catch (error) {
      console.error(`Error fetching risk ${riskId}:`, error)
      throw error
    }
  },

  // READ - Get all risks
  async getRisks() {
    try {
      const response = await api.get('/Risk')
      return response.data.value || response.data || []
    } catch (error) {
      console.error('Error fetching all risks:', error)
      throw error
    }
  },

  // CREATE - Add new risk to opportunity
  async createRisk(opportunityId, riskData, opportunityName = null) {
    try {
      // Include all fields that exist in the Risk entity schema
      const payload = {
        title: riskData.title,
        description: riskData.description,
        impact: riskData.impact || 'Medium',
        probability: riskData.probability || 'Medium',
        status: riskData.status || 'Open',
        owner: riskData.owner || null,
        mitigation: riskData.mitigation || null,
        dueDate: riskData.dueDate || null,
        opportunityID: opportunityId,
        opportunityName: opportunityName
      }
      
      console.log('Creating risk with payload:', payload)
      
      const response = await api.post('/Risk', payload)
      return response.data
    } catch (error) {
      console.error('Error creating risk:', error)
      throw error
    }
  },

  // UPDATE - Update existing risk
  async updateRisk(riskId, riskData) {
    try {
      // Include all fields that exist in the Risk entity schema
      const payload = {
        title: riskData.title,
        description: riskData.description,
        impact: riskData.impact,
        probability: riskData.probability,
        status: riskData.status,
        owner: riskData.owner,
        mitigation: riskData.mitigation,
        dueDate: riskData.dueDate,
        opportunityID: riskData.opportunityID,
        opportunityName: riskData.opportunityName
      }
      
      console.log(`Updating risk ${riskId} with payload:`, payload)
      
      const response = await api.patch(`/Risk('${riskId}')`, payload)
      return response.data
    } catch (error) {
      console.error(`Error updating risk ${riskId}:`, error)
      throw error
    }
  },

  // DELETE - Remove risk
  async deleteRisk(riskId) {
    try {
      console.log(`Deleting risk: ${riskId}`)
      const response = await api.delete(`/Risk('${riskId}')`)
      return response.data
    } catch (error) {
      console.error(`Error deleting risk ${riskId}:`, error)
      throw error
    }
  }
}

// UTILITY FUNCTIONS
export const apiUtils = {
  // Test connection to backend
  async testConnection() {
    try {
      const response = await api.get('/')
      return { success: true, data: response.data }
    } catch (error) {
      return { success: false, error: error.message }
    }
  },

  // Test specific endpoints
  async testEndpoints() {
    const tests = []
    
    try {
      await api.get('/Opportunity')
      tests.push({ endpoint: 'Opportunity', status: 'success' })
    } catch (error) {
      tests.push({ endpoint: 'Opportunity', status: 'failed', error: error.message })
    }
    
    try {
      await api.get('/Risk')
      tests.push({ endpoint: 'Risk', status: 'success' })
    } catch (error) {
      tests.push({ endpoint: 'Risk', status: 'failed', error: error.message })
    }
    
    return tests
  },

  // Format date for display
  formatDate(dateString) {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  },

  // Format date for input fields
  formatDateForInput(dateString) {
    if (!dateString) return ''
    return new Date(dateString).toISOString().split('T')[0]
  },

  // Format risk data for display
  formatRisk(risk) {
    return {
      ...risk,
      formattedCreatedAt: this.formatDate(risk.createdAt),
      formattedModifiedAt: this.formatDate(risk.modifiedAt),
      riskScore: this.calculateRiskScore(risk.impact, risk.probability)
    }
  },

  // Calculate risk score based on impact and probability
  calculateRiskScore(impact, probability) {
    const impactScore = this.getImpactScore(impact)
    const probabilityScore = this.getProbabilityScore(probability)
    return impactScore * probabilityScore
  },

  // Get numeric score for impact level
  getImpactScore(impact) {
    switch (impact?.toLowerCase()) {
      case 'high': return 3
      case 'medium': return 2
      case 'low': return 1
      default: return 1
    }
  },

  // Get numeric score for probability level
  getProbabilityScore(probability) {
    switch (probability?.toLowerCase()) {
      case 'high': return 3
      case 'medium': return 2
      case 'low': return 1
      default: return 1
    }
  },

  // Get risk level based on score
  getRiskLevel(score) {
    if (score >= 6) return 'Critical'
    if (score >= 4) return 'High'
    if (score >= 2) return 'Medium'
    return 'Low'
  },

  // Get status color for UI
  getStatusColor(status) {
    switch (status?.toLowerCase()) {
      case 'open': return 'red'
      case 'mitigated': return 'yellow'
      case 'closed': return 'green'
      default: return 'gray'
    }
  },

  // Get impact color for UI
  getImpactColor(impact) {
    switch (impact?.toLowerCase()) {
      case 'high': return 'red'
      case 'medium': return 'yellow'
      case 'low': return 'green'
      default: return 'gray'
    }
  },

  // Get probability color for UI
  getProbabilityColor(probability) {
    switch (probability?.toLowerCase()) {
      case 'high': return 'red'
      case 'medium': return 'yellow'
      case 'low': return 'green'
      default: return 'gray'
    }
  },

  // Validate risk data
  validateRisk(risk) {
    const errors = []
    
    if (!risk.title || risk.title.trim().length === 0) {
      errors.push('Title is required')
    }
    
    if (!risk.impact) {
      errors.push('Impact level is required')
    }
    
    if (!risk.probability) {
      errors.push('Probability is required')
    }
    
    return {
      isValid: errors.length === 0,
      errors
    }
  },

  // Filter risks by various criteria
  filterRisks(risks, filters) {
    return risks.filter(risk => {
      if (filters.status && risk.status !== filters.status) return false
      if (filters.impact && risk.impact !== filters.impact) return false
      if (filters.probability && risk.probability !== filters.probability) return false
      if (filters.opportunityId && risk.opportunityID !== filters.opportunityId) return false
      if (filters.search) {
        const searchTerm = filters.search.toLowerCase()
        return risk.title?.toLowerCase().includes(searchTerm) ||
               risk.description?.toLowerCase().includes(searchTerm) ||
               risk.opportunityName?.toLowerCase().includes(searchTerm)
      }
      return true
    })
  },

  // Sort risks by various criteria
  sortRisks(risks, sortBy, sortOrder = 'asc') {
    return [...risks].sort((a, b) => {
      let aValue = a[sortBy]
      let bValue = b[sortBy]
      
      // Handle dates
      if (sortBy === 'createdAt' || sortBy === 'modifiedAt') {
        aValue = new Date(aValue)
        bValue = new Date(bValue)
      }
      
      // Handle risk score
      if (sortBy === 'riskScore') {
        aValue = this.calculateRiskScore(a.impact, a.probability)
        bValue = this.calculateRiskScore(b.impact, b.probability)
      }
      
      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1
      return 0
    })
  }
}

// LEGACY EXPORTS for backward compatibility
export const getOpportunity = opportunityService.getOpportunity
export const getOpportunityRisks = riskService.getOpportunityRisks
export const createRisk = riskService.createRisk

// MAIN API SERVICE combining all services
export const apiService = {
  ...opportunityService,
  ...riskService,
  ...apiUtils
}

// Debug information with environment variables
console.log('🔧 API Service Environment:', config.environment)
console.log('🔧 API Base URL:', config.baseURL)
console.log('🔧 Current Location:', window.location.href)
console.log('🔧 Hostname:', window.location.hostname)
console.log('🔧 Vite Environment Variables:', {
  VITE_API_BASE_URL: import.meta.env.VITE_API_BASE_URL,
  VITE_ENVIRONMENT: import.meta.env.VITE_ENVIRONMENT,
  NODE_ENV: import.meta.env.NODE_ENV,
  MODE: import.meta.env.MODE,
  DEV: import.meta.env.DEV,
  PROD: import.meta.env.PROD
})

// Export axios instance for direct use if needed
export { api }

// Export configuration for debugging
export { config as apiConfig }

export default api