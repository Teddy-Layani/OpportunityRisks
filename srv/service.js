const cds = require('@sap/cds');

module.exports = cds.service.impl(async function() {
  
  const { Risk, Opportunity } = this.entities;
  
  // SAP CRM API Configuration
  const CRM_CONFIG = {
    baseURL: process.env.SAP_CRM_BASE_URL || 'https://my1001209.de1.demo.crm.cloud.sap',
    endpoint: '/sap/c4c/api/v1/opportunity-service/opportunities',
    headers: {
      'x-sap-crm-token': process.env.SAP_CRM_TOKEN || '',
      'config_authType': 'Basic',
      'config_packageName': 'SAPSalesServiceCloudV2',
      'config_actualUrl': process.env.SAP_CRM_BASE_URL || 'https://my1001209.de1.demo.crm.cloud.sap/',
      'config_urlPattern': 'https://{hostname}',
      'config_apiName': 'SalesSvcCloudV2_opportunity',
      'DataServiceVersion': '2.0',
      'Accept': 'application/json'
    },
    auth: process.env.SAP_CRM_USERNAME && process.env.SAP_CRM_PASSWORD ? {
      username: process.env.SAP_CRM_USERNAME,
      password: process.env.SAP_CRM_PASSWORD
    } : null
  };

  // Handler for reading opportunities from SAP CRM
  this.on('READ', Opportunity, async (req, next) => {
    try {
      console.log('=== OPPORTUNITY READ REQUEST ===');
      console.log('Full request:', JSON.stringify({
        query: req.query,
        params: req.params,
        path: req.path,
        headers: req.headers
      }, null, 2));
      
      // Better ID extraction from the request
      let requestedId = null;
      
      // Method 1: Check params (most reliable for key-based requests)
      if (req.params && req.params.length > 0 && req.params[0].ID) {
        requestedId = req.params[0].ID;
        console.log('Found ID in params:', requestedId);
      }
      
      // Method 2: Check where clause in SELECT
      if (!requestedId && req.query.SELECT?.from?.ref?.[0]?.where) {
        const whereClause = req.query.SELECT.from.ref[0].where;
        console.log('Parsing where clause:', JSON.stringify(whereClause, null, 2));
        
        // Where clause format: [{"ref":["ID"]}, "=", {"val":"the-id"}]
        if (Array.isArray(whereClause) && whereClause.length >= 3) {
          const fieldRef = whereClause[0];
          const operator = whereClause[1];
          const valueObj = whereClause[2];
          
          if (fieldRef.ref && fieldRef.ref[0] === 'ID' && operator === '=' && valueObj.val) {
            requestedId = valueObj.val;
            console.log('Found ID in where clause:', requestedId);
          }
        }
      }
      
      // Method 3: Check direct where clause
      if (!requestedId && req.query.SELECT?.where) {
        const whereClause = req.query.SELECT.where;
        console.log('Checking direct WHERE:', JSON.stringify(whereClause, null, 2));
        if (Array.isArray(whereClause)) {
          const idFilter = whereClause.find(w => w.ref?.[0] === 'ID');
          if (idFilter && idFilter.val) {
            requestedId = idFilter.val;
            console.log('Found ID in direct where:', requestedId);
          }
        }
      }
      
      console.log('Final requested ID:', requestedId);
      
      if (!requestedId) {
        console.log('No specific ID found, fetching all opportunities');
        const opportunities = await fetchAllOpportunities(CRM_CONFIG);
        return opportunities;
      }
      
      console.log(`Fetching specific opportunity: ${requestedId}`);
      // Try the individual API first with correct URL pattern
      try {
        const opportunity = await fetchSpecificOpportunity(CRM_CONFIG, requestedId);
        if (opportunity) {
          console.log('✅ Successfully found opportunity via individual API:', opportunity.Name || opportunity.ID);
          return [opportunity];
        }
      } catch (error) {
        console.log('Individual API failed, falling back to list filtering:', error.message);
      }
      
      // Fallback: fetch from the "all opportunities" and filter
      const allOpportunities = await fetchAllOpportunities(CRM_CONFIG);
      const opportunity = allOpportunities.find(o => 
        o.ID === requestedId || 
        o.ObjectID === requestedId ||
        o.OpportunityID === requestedId
      );
      
      if (opportunity) {
        console.log('✅ Successfully found opportunity via list filtering:', opportunity.Name || opportunity.ID);
        return [opportunity];
      } else {
        console.log('❌ Opportunity not found in either individual API or list');
        return [];
      }
    } catch (error) {
      console.error('Error fetching opportunities from SAP CRM:', error.message);
      req.error(502, `Failed to connect to SAP CRM: ${error.message}`);
    }
  });

  // Handler for reading risks - with filtering by opportunityID
  this.on('READ', Risk, async (req, next) => {
    try {
      console.log('=== Risk Request Debug ===');
      console.log('Request query:', JSON.stringify(req.query, null, 2));
      console.log('Request params:', req.params);
      console.log('Request path:', req.path);
      
      // Check if this is a navigation from Opportunity to Risks
      const isNavigation = req.path && req.path.includes('/risks');
      
      if (isNavigation) {
        console.log('Navigation request from Opportunity to Risks');
        
        // Extract opportunity ID from the path
        const pathMatch = req.path.match(/Opportunity\('([^']+)'\)/);
        if (pathMatch) {
          const opportunityId = pathMatch[1];
          console.log('Opportunity ID from navigation:', opportunityId);
          
          // Query risks for this specific opportunity from the database
          try {
            const risks = await SELECT.from(Risk).where({ opportunityID: opportunityId });
            console.log(`Found ${risks.length} risks for opportunity ${opportunityId}`);
            return risks;
          } catch (dbError) {
            console.log('Database query failed, returning empty array:', dbError.message);
            return [];
          }
        } else {
          console.log('Could not extract opportunity ID from path');
          return [];
        }
      }
      
      // For direct Risk queries, use default handler
      console.log('Direct risk query, using default handler');
      return next();
    } catch (error) {
      console.error('Error in Risk handler:', error);
      console.log('Returning empty array due to error');
      return [];
    }
  });

  // Action to refresh opportunities
  this.on('refreshOpportunities', async (req) => {
    try {
      const opportunities = await fetchAllOpportunities(CRM_CONFIG);
      return `Successfully refreshed ${opportunities.length} opportunities`;
    } catch (error) {
      console.error('Error refreshing opportunities:', error.message);
      req.error(500, `Failed to refresh opportunities: ${error.message}`);
    }
  });

  // Fetch specific opportunity by ID using correct SAP CRM API pattern
  async function fetchSpecificOpportunity(config, id) {
    const fetch = require('node-fetch');
    
    // Use the correct SAP CRM API pattern with query parameters
    const url = `${config.baseURL}${config.endpoint}/${id}?$exclude=snapshots,isPhaseProgressAllowed,worklistItems`;
    console.log(`Fetching specific opportunity from: ${url}`);
    
    try {
      const fetchOptions = {
        method: 'GET',
        headers: { ...config.headers },
        timeout: 30000
      };

      if (config.auth) {
        const auth = Buffer.from(`${config.auth.username}:${config.auth.password}`).toString('base64');
        fetchOptions.headers['Authorization'] = `Basic ${auth}`;
        console.log('✅ Basic Auth added');
      } else {
        console.log('⚠️  No authentication configured');
      }
      
      const response = await fetch(url, fetchOptions);
      console.log(`Response status: ${response.status}`);
      console.log('Response content-type:', response.headers.get('content-type'));
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${response.statusText}\nResponse: ${errorText}`);
      }

      const data = await response.json();
      console.log('=== SAP CRM Single Opportunity Response ===');
      console.log('Response type:', typeof data);
      console.log('Response keys:', Object.keys(data));
      
      // For single opportunity, data should be the opportunity object directly
      if (data && (data.id || data.ObjectID || data.ID)) {
        console.log('✅ Found opportunity data');
        console.log('Opportunity details:', {
          id: data.id || data.ObjectID || data.ID,
          name: data.name || data.Name || data.Description,
          displayId: data.displayId,
          status: data.status || data.statusDescription,
          expectedRevenue: data.expectedRevenueAmount?.content || 0
        });
        
        return transformSingleOpportunity(data, id);
      } else {
        console.log('❌ Unexpected response structure');
        console.log('Raw response:', JSON.stringify(data, null, 2));
        return null;
      }
      
    } catch (error) {
      console.error(`❌ Error fetching specific opportunity:`, error.message);
      throw error;
    }
  }

  // Action to create risk for a specific opportunity
  this.on('createRiskForOpportunity', async (req) => {
    const { opportunityID, title, description, impact, probability } = req.data;
    
    try {
      // First, try to get the specific opportunity to validate it exists
      let opportunity = null;
      try {
        opportunity = await fetchSpecificOpportunity(CRM_CONFIG, opportunityID);
      } catch (error) {
        console.log('Individual API failed, trying list method');
        const opportunities = await fetchAllOpportunities(CRM_CONFIG);
        opportunity = opportunities.find(opp => opp.ID === opportunityID || opp.OpportunityID === opportunityID);
      }
      
      if (!opportunity) {
        req.error(404, `Opportunity with ID ${opportunityID} not found in SAP CRM`);
      }

      // Create the risk
      const risk = await INSERT.into(Risk).entries({
        title,
        description,
        impact,
        probability,
        status: 'Open',
        opportunityID: opportunityID,
        opportunityName: opportunity.Name
      });

      return risk;
    } catch (error) {
      console.error('Error creating risk:', error.message);
      req.error(500, `Failed to create risk: ${error.message}`);
    }
  });

  // Fetch specific opportunity by ID using correct SAP CRM API pattern
  async function fetchSpecificOpportunity(config, id) {
    const fetch = require('node-fetch');
    
    // Use the correct SAP CRM API pattern with query parameters
    const url = `${config.baseURL}${config.endpoint}/${id}?$exclude=snapshots,isPhaseProgressAllowed,worklistItems`;
    console.log(`Fetching specific opportunity from: ${url}`);
    
    try {
      const fetchOptions = {
        method: 'GET',
        headers: { ...config.headers },
        timeout: 30000
      };

      if (config.auth) {
        const auth = Buffer.from(`${config.auth.username}:${config.auth.password}`).toString('base64');
        fetchOptions.headers['Authorization'] = `Basic ${auth}`;
        console.log('✅ Basic Auth added');
      } else {
        console.log('⚠️  No authentication configured');
      }
      
      const response = await fetch(url, fetchOptions);
      console.log(`Response status: ${response.status}`);
      console.log('Response content-type:', response.headers.get('content-type'));
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${response.statusText}\nResponse: ${errorText}`);
      }

      const data = await response.json();
      console.log('=== SAP CRM Single Opportunity Response ===');
      console.log('Response type:', typeof data);
      console.log('Response keys:', Object.keys(data));
      
      // For single opportunity, data should be the opportunity object directly
      if (data && (data.id || data.ObjectID || data.ID)) {
        console.log('✅ Found opportunity data');
        console.log('Opportunity details:', {
          id: data.id || data.ObjectID || data.ID,
          name: data.name || data.Name || data.Description,
          displayId: data.displayId,
          status: data.status || data.statusDescription,
          expectedRevenue: data.expectedRevenueAmount?.content || 0
        });
        
        return transformSingleOpportunity(data, id);
      } else {
        console.log('❌ Unexpected response structure');
        console.log('Raw response:', JSON.stringify(data, null, 2));
        return null;
      }
      
    } catch (error) {
      console.error(`❌ Error fetching specific opportunity:`, error.message);
      throw error;
    }
  }

  // Transform single opportunity from SAP CRM
  function transformSingleOpportunity(item, fallbackId) {
    return {
      ID: item.id || item.ObjectID || item.ID || item.OpportunityID || fallbackId,
      ObjectID: item.ObjectID || item.id || item.ID,
      OpportunityID: item.OpportunityID || item.displayId || item.OpportunityNumber,
      Name: item.name || item.Name || item.Description || item.title || 'Unnamed Opportunity',
      AccountID: item.account?.id || item.AccountID || item.Account,
      SalesStage: item.status || item.statusDescription || item.SalesStage || item.ProcessingStatusCodeText,
      ExpectedRevenueAmount: item.expectedRevenueAmount?.content || item.ExpectedRevenueAmount || item.ExpectedValue || item.Amount || 0,
      Currency: item.expectedRevenueAmount?.currencyCode || item.Currency || item.CurrencyCodeText || 'USD',
      CloseDate: item.closeDate || item.CloseDate || item.ExpectedClosingDate || item.ClosingDate,
      CreatedOn: item.adminData?.createdOn || item.CreatedOn || item.CreationDateTime || new Date().toISOString(),
      LastChangedOn: item.adminData?.updatedOn || item.LastChangedOn || item.LastChangeDateTime || new Date().toISOString(),
      rawData: item // Keep raw data for debugging
    };
  }

  // Fetch all opportunities (reliable method)
  async function fetchAllOpportunities(config) {
    const fetch = require('node-fetch');
    
    const url = config.baseURL + config.endpoint;
    console.log(`Fetching all opportunities from: ${url}`);
    
    const fetchOptions = {
      method: 'GET',
      headers: { ...config.headers },
      timeout: 30000
    };

    if (config.auth) {
      const auth = Buffer.from(`${config.auth.username}:${config.auth.password}`).toString('base64');
      fetchOptions.headers['Authorization'] = `Basic ${auth}`;
      console.log('✅ Basic Auth added');
    } else {
      console.log('⚠️  No authentication configured');
    }
    
    const response = await fetch(url, fetchOptions);
    console.log('Response status:', response.status);
    console.log('Response content-type:', response.headers.get('content-type'));
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${response.statusText}\nResponse: ${errorText}`);
    }

    const data = await response.json();
    console.log('=== SAP CRM Response Debug ===');
    console.log('Response structure:', {
      type: typeof data,
      keys: Object.keys(data),
      hasResults: !!(data.d?.results || data.value || Array.isArray(data))
    });
    
    // Extract results from different possible structures
    let results = [];
    if (data.d && data.d.results) {
      results = data.d.results;
      console.log('Using data.d.results structure');
    } else if (data.value) {
      results = data.value;
      console.log('Using data.value structure');
    } else if (Array.isArray(data)) {
      results = data;
      console.log('Using array structure');
    }
    
    console.log(`Found ${results.length} opportunities in SAP CRM`);
    
    // Log first opportunity structure for debugging (only first one to avoid spam)
    if (results.length > 0) {
      console.log('=== First Opportunity Raw Data ===');
      console.log('Keys available:', Object.keys(results[0]));
      console.log('Sample fields:', {
        id: results[0].id,
        ObjectID: results[0].ObjectID,
        ID: results[0].ID,
        name: results[0].name,
        Name: results[0].Name,
        displayId: results[0].displayId,
        status: results[0].status,
        statusDescription: results[0].statusDescription
      });
      console.log('===============================');
    }
    
    // Transform the data
    return transformOpportunityData({ value: results });
  }

  // Transform SAP CRM data to match our model
  function transformOpportunityData(data) {
    console.log('=== Transform Data Debug ===');
    
    let results = [];
    if (data && data.d && data.d.results) {
      results = data.d.results;
    } else if (data && Array.isArray(data)) {
      results = data;
    } else if (data && data.value) {
      results = data.value;
    } else {
      console.log('Unexpected data structure');
      throw new Error('Unexpected SAP CRM response structure');
    }

    console.log(`Transforming ${results.length} opportunities`);
    
    const transformed = results.map((item, index) => {
      // Only log first few to avoid spam
      if (index < 3) {
        console.log(`Raw opportunity ${index + 1} keys:`, Object.keys(item));
      }
      
      const result = {
        // Use the ID that actually exists in your SAP CRM data
        ID: item.id || item.ObjectID || item.ID || item.OpportunityID || cds.utils.uuid(),
        ObjectID: item.ObjectID || item.id || item.ID,
        OpportunityID: item.OpportunityID || item.displayId || item.OpportunityNumber,
        Name: item.name || item.Name || item.Description || item.title || `Opportunity ${index + 1}`,
        AccountID: item.account?.id || item.AccountID || item.Account,
        SalesStage: item.status || item.statusDescription || item.SalesStage || item.ProcessingStatusCodeText,
        ExpectedRevenueAmount: item.expectedRevenueAmount?.content || item.ExpectedRevenueAmount || item.ExpectedValue || item.Amount || 0,
        Currency: item.expectedRevenueAmount?.currencyCode || item.Currency || item.CurrencyCodeText || 'USD',
        CloseDate: item.closeDate || item.CloseDate || item.ExpectedClosingDate || item.ClosingDate,
        CreatedOn: item.adminData?.createdOn || item.CreatedOn || item.CreationDateTime || new Date().toISOString(),
        LastChangedOn: item.adminData?.updatedOn || item.LastChangedOn || item.LastChangeDateTime || new Date().toISOString()
      };
      
      // Only log first transformation to see the mapping
      if (index === 0) {
        console.log('First transformed opportunity:', JSON.stringify(result, null, 2));
      }
      
      return result;
    });
    
    console.log(`Successfully transformed ${transformed.length} opportunities`);
    return transformed;
  }
});