// frontend/src/services/api.js - Fixed to use proxy (RELATIVE URLs)
import axios from 'axios'

// Use relative URLs to leverage Vite proxy - THIS IS CRITICAL!
const API_BASE_URL = '/opportunity-risks'

// Create axios instance with proxy-friendly configuration
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json'
  },
  timeout: 10000
})

// Add request interceptor for debugging
api.interceptors.request.use(
  (config) => {
    console.log('API Request:', config.method?.toUpperCase(), `${API_BASE_URL}${config.url}`)
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
  async getOpportunities() {
    try {
      const response = await api.get('/Opportunity')
      return response.data.value || response.data || []
    } catch (error) {
      console.error('Error fetching opportunities from SAP CRM:', error)
      throw error
    }
  },

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
  async getOpportunityRisks(opportunityId) {
    try {
      const response = await api.get(`/Opportunity('${opportunityId}')/risks`)
      return response.data.value || response.data || []
    } catch (error) {
      console.error(`Error fetching risks for opportunity ${opportunityId}:`, error)
      throw error
    }
  },

  async getRisk(riskId) {
    try {
      const response = await api.get(`/Risk('${riskId}')`)
      return response.data
    } catch (error) {
      console.error(`Error fetching risk ${riskId}:`, error)
      throw error
    }
  },

  async createRisk(opportunityId, riskData) {
    try {
      const response = await api.post('/Risk', {
        ID: riskData.ID || this.generateUUID(),
        title: riskData.title,
        description: riskData.description,
        impact: riskData.impact || 'Medium',
        probability: riskData.probability || 'Medium',
        status: riskData.status || 'Open',
        mitigation: riskData.mitigation,
        owner: riskData.owner,
        dueDate: riskData.dueDate,
        opportunityId: opportunityId,
        createdAt: new Date().toISOString(),
        modifiedAt: new Date().toISOString()
      })
      return response.data
    } catch (error) {
      console.error('Error creating risk:', error)
      throw error
    }
  },

  async updateRisk(riskId, riskData) {
    try {
      const response = await api.patch(`/Risk('${riskId}')`, {
        title: riskData.title,
        description: riskData.description,
        impact: riskData.impact,
        probability: riskData.probability,
        status: riskData.status,
        mitigation: riskData.mitigation,
        owner: riskData.owner,
        dueDate: riskData.dueDate,
        modifiedAt: new Date().toISOString()
      })
      return response.data
    } catch (error) {
      console.error(`Error updating risk ${riskId}:`, error)
      throw error
    }
  },

  async deleteRisk(riskId) {
    try {
      const response = await api.delete(`/Risk('${riskId}')`)
      return response.data
    } catch (error) {
      console.error(`Error deleting risk ${riskId}:`, error)
      throw error
    }
  },

  generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }
}

// UTILITY FUNCTIONS
export const apiUtils = {
  async testConnection() {
    try {
      const response = await api.get('/')
      return { success: true, data: response.data }
    } catch (error) {
      return { success: false, error: error.message }
    }
  },

  formatDate(dateString) {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  },

  formatDateForInput(dateString) {
    if (!dateString) return ''
    return new Date(dateString).toISOString().split('T')[0]
  }
}

export default api
