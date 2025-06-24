// frontend/src/services/api.js - Updated version with new fields
import axios from 'axios'

// Use relative URLs to leverage Vite proxy
const API_BASE_URL = '/opportunity-risks'

// Create axios instance with proxy-friendly configuration
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json'
  },
  timeout: 30000 // Increased timeout to match backend
})

// Add request interceptor for debugging
api.interceptors.request.use(
  (config) => {
    console.log('API Request:', config.method?.toUpperCase(), config.url)
    return config
  },
  (error) => {
    console.error('API Request Error:', error)
    return Promise.reject(error)
  }
)

// Add response interceptor for debugging
api.interceptors.response.use(
  (response) => {
    console.log('API Response:', response.status, response.config.url)
    return response
  },
  (error) => {
    console.error('API Response Error:', error.response?.status, error.response?.data)
    // Better error handling
    if (error.response?.status === 401) {
      console.error('Unauthorized - check backend authentication')
    } else if (error.response?.status === 404) {
      console.error('Not found - check if backend service is running')
    } else if (error.code === 'ERR_NETWORK') {
      console.error('Network error - check if backend is accessible')
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
  // READ - Get risks for opportunity
  async getOpportunityRisks(opportunityId) {
    try {
      console.log('🔍 Fetching risks for opportunity:', opportunityId)
      
      // Try multiple approaches to get the risks
      
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
  // Test connection
  async testConnection() {
    try {
      const response = await api.get('/')
      return { success: true, data: response.data }
    } catch (error) {
      return { success: false, error: error.message }
    }
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
  }
}

// Legacy exports for backward compatibility
export const getOpportunity = opportunityService.getOpportunity
export const getOpportunityRisks = riskService.getOpportunityRisks
export const createRisk = riskService.createRisk

export default api