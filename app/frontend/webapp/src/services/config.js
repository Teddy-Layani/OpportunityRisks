// Alternative approach: Create a static config file in your webapp

// app/frontend/webapp/public/config.js
window.APP_CONFIG = {
    development: {
      backendUrl: 'http://localhost:4004',
      servicePath: '/opportunity-risks'
    },
    production: {
      backendUrl: 'https://abra-information-technologies-ltd-ts4tvklvn0st2fz4-dev-6786453b.cfapps.ap10.hana.ondemand.com',
      servicePath: '/opportunity-risks'
    }
  }
  
  // Then load this in your index.html
  // <script src="/config.js"></script>
  
  // And use it in your API service:
  const getApiConfig = () => {
    const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    const env = isLocalhost ? 'development' : 'production'
    
    if (window.APP_CONFIG && window.APP_CONFIG[env]) {
      const config = window.APP_CONFIG[env]
      return {
        baseURL: config.backendUrl + config.servicePath,
        environment: env
      }
    }
    
    // Fallback
    return {
      baseURL: '/opportunity-risks',
      environment: 'fallback'
    }
  }