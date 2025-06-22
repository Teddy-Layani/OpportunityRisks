const cds = require('@sap/cds');

module.exports = cds.service.impl(async function() {
  
  const { Risk, Opportunity } = this.entities; // Note: singular names to match your service.cds
  
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
    // Add Basic Auth if needed
    auth: process.env.SAP_CRM_USERNAME && process.env.SAP_CRM_PASSWORD ? {
      username: process.env.SAP_CRM_USERNAME,
      password: process.env.SAP_CRM_PASSWORD
    } : null
  };

  // Handler for reading opportunities from SAP CRM
  this.on('READ', Opportunity, async (req, next) => {
    try {
      console.log('=== Opportunity Request Debug ===');
      console.log('Request query:', JSON.stringify(req.query, null, 2));
      
      // Check if specific ID is requested
      const whereClause = req.query.SELECT.where;
      let requestedId = null;
      
      if (whereClause) {
        console.log('Where clause:', JSON.stringify(whereClause, null, 2));
        // Handle different where clause structures
        if (Array.isArray(whereClause)) {
          const idFilter = whereClause.find(w => w.ref?.[0] === 'ID');
          if (idFilter && idFilter.val) {
            requestedId = idFilter.val;
          }
        } else if (whereClause.ref && whereClause.ref[0] === 'ID') {
          requestedId = whereClause.val;
        }
        
        if (requestedId) {
          console.log('Requested specific ID:', requestedId);
        }
      }
      
      console.log('Fetching opportunities from SAP CRM...');
      const opportunities = await fetchOpportunitiesFromCRM(CRM_CONFIG, requestedId);
      console.log(`Fetched ${opportunities.length} opportunities`);
      
      if (requestedId) {
        const opportunity = opportunities.find(o => 
          o.ID === requestedId || 
          o.ObjectID === requestedId ||
          o.OpportunityID === requestedId
        );
        console.log('Found opportunity for ID:', opportunity ? 'YES' : 'NO');
        if (opportunity) {
          console.log('Opportunity data:', JSON.stringify(opportunity, null, 2));
          return [opportunity];
        } else {
          console.log('Opportunity not found, returning empty array');
          return [];
        }
      }
      
      console.log('Returning all opportunities:', opportunities.length);
      return opportunities;
    } catch (error) {
      console.error('Error fetching opportunities from SAP CRM:', error.message);
      // Return error instead of mock data
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
      // Return empty array instead of throwing error
      console.log('Returning empty array due to error');
      return [];
    }
  });

  // Action to refresh opportunities
  this.on('refreshOpportunities', async (req) => {
    try {
      const opportunities = await fetchOpportunitiesFromCRM(CRM_CONFIG);
      return `Successfully refreshed ${opportunities.length} opportunities`;
    } catch (error) {
      console.error('Error refreshing opportunities:', error.message);
      req.error(500, `Failed to refresh opportunities: ${error.message}`);
    }
  });

  // Action to create risk for a specific opportunity
  this.on('createRiskForOpportunity', async (req) => {
    const { opportunityID, title, description, impact, probability } = req.data;
    
    try {
      // First, get the opportunity details to validate it exists
      const opportunities = await fetchOpportunitiesFromCRM(CRM_CONFIG);
      const opportunity = opportunities.find(opp => opp.ID === opportunityID || opp.OpportunityID === opportunityID);
      
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

  // Function to fetch opportunities from SAP CRM
  async function fetchOpportunitiesFromCRM(config, specificId = null) {
    const fetch = require('node-fetch');
    
    let url = config.baseURL + config.endpoint;
    
    // Add specific ID filter to SAP CRM query if requested
    if (specificId) {
      // Try different SAP CRM API patterns
      const patterns = [
        `?$filter=ObjectID eq '${specificId}'`,
        `?$filter=ID eq '${specificId}'`,
        `?$filter=OpportunityID eq '${specificId}'`,
        `('${specificId}')`
      ];
      
      // Use the first pattern for now - adjust based on your SAP CRM API
      url += patterns[0];
      console.log(`Fetching specific opportunity from: ${url}`);
    } else {
      console.log(`Fetching all opportunities from: ${url}`);
    }
    
    console.log('Headers:', JSON.stringify(config.headers, null, 2));
    
    const fetchOptions = {
      method: 'GET',
      headers: config.headers,
      // Increase timeout to 30 seconds
      timeout: 30000
    };

    // Add Basic Auth if configured
    if (config.auth) {
      const auth = Buffer.from(`${config.auth.username}:${config.auth.password}`).toString('base64');
      fetchOptions.headers['Authorization'] = `Basic ${auth}`;
      console.log('Added Basic Auth');
    }
    
    const response = await fetch(url, fetchOptions);
    console.log('Response status:', response.status);
    console.log('Response headers:', JSON.stringify([...response.headers.entries()], null, 2));

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    console.log('=== SAP CRM Response Debug ===');
    console.log('Response type:', typeof data);
    console.log('Response keys:', Object.keys(data));
    
    // Don't log full response to avoid cluttering - just log structure
    if (data.d && data.d.results) {
      console.log(`Found ${data.d.results.length} opportunities in data.d.results`);
    } else if (data.value) {
      console.log(`Found ${data.value.length} opportunities in data.value`);
    } else if (Array.isArray(data)) {
      console.log(`Found ${data.length} opportunities in array`);
    }
    
    // Check if this is just metadata or minimal data
    if (data['@odata.context'] && Object.keys(data).length <= 2) {
      console.log('⚠️  Response appears to be minimal/metadata only');
      throw new Error('SAP CRM returned minimal/metadata response - check endpoint URL and authentication');
    }
    
    // For single opportunity request, handle single object response
    if (specificId && !Array.isArray(data) && !data.d?.results && !data.value) {
      console.log('Single opportunity response detected');
      const transformed = transformOpportunityData({ value: [data] });
      return transformed;
    }
    
    console.log('===============================');
    
    // Transform the data based on SAP CRM response structure
    const transformed = transformOpportunityData(data);
    
    // If no meaningful data was transformed, throw error
    if (transformed.length === 0) {
      throw new Error('No opportunities found in SAP CRM response');
    }
    
    return transformed;
  }

  // Transform SAP CRM data to match our model
  function transformOpportunityData(data) {
    console.log('=== Transform Data Debug ===');
    console.log('Input data:', JSON.stringify(data, null, 2));
    
    // Handle different possible response structures
    let results = [];
    
    if (data && data.d && data.d.results) {
      results = data.d.results;
      console.log('Using data.d.results structure');
    } else if (data && Array.isArray(data)) {
      results = data;
      console.log('Using array structure');
    } else if (data && data.value) {
      results = data.value;
      console.log('Using data.value structure');
    } else {
      console.log('Unexpected data structure or empty data');
      console.log('Data keys:', Object.keys(data || {}));
      throw new Error('Unexpected SAP CRM response structure');
    }

    console.log(`Processing ${results.length} opportunities from SAP CRM`);
    
    const transformed = results.map((item, index) => {
      console.log(`Processing opportunity ${index + 1}:`, JSON.stringify(item, null, 2));
      
      const transformed = {
        // Try different possible ID fields from SAP CRM
        ID: item.ObjectID || item.ID || item.OpportunityID || cds.utils.uuid(),
        ObjectID: item.ObjectID || item.ID,
        OpportunityID: item.OpportunityID || item.OpportunityNumber,
        Name: item.Name || item.Description || item.Title || `Opportunity ${index + 1}`,
        AccountID: item.AccountID || item.Account,
        SalesStage: item.SalesStage || item.ProcessingStatusCodeText || item.Status,
        ExpectedRevenueAmount: item.ExpectedRevenueAmount || item.ExpectedValue || item.Amount || 0,
        Currency: item.Currency || item.CurrencyCodeText || 'USD',
        CloseDate: item.CloseDate || item.ExpectedClosingDate || item.ClosingDate,
        CreatedOn: item.CreatedOn || item.CreationDateTime || new Date().toISOString(),
        LastChangedOn: item.LastChangedOn || item.LastChangeDateTime || new Date().toISOString()
      };
      
      console.log(`Transformed opportunity ${index + 1}:`, JSON.stringify(transformed, null, 2));
      return transformed;
    });
    
    console.log('===========================');
    return transformed;
  }
});