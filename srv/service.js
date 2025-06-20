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
  this.on('READ', Opportunity, async (req) => {
    try {
      console.log('=== Opportunity Request Debug ===');
      console.log('Request query:', JSON.stringify(req.query, null, 2));
      
      // Check if specific ID is requested
      const whereClause = req.query.SELECT.where;
      let requestedId = null;
      
      if (whereClause) {
        console.log('Where clause:', JSON.stringify(whereClause, null, 2));
        const idFilter = whereClause.find(w => w.ref?.[0] === 'ID');
        if (idFilter && idFilter.val) {
          requestedId = idFilter.val;
          console.log('Requested specific ID:', requestedId);
        }
      }
      
      console.log('Fetching opportunities from SAP CRM...');
      const opportunities = await fetchOpportunitiesFromCRM(CRM_CONFIG);
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
        }
        return opportunity ? [opportunity] : [];
      }
      
      console.log('Returning all opportunities:', opportunities.length);
      return opportunities;
    } catch (error) {
      console.error('Error fetching opportunities:', error.message);
      console.log('Falling back to mock data...');
      // Return mock data as fallback
      const mockData = getMockOpportunities();
      
      // If specific ID requested, filter mock data
      const whereClause = req.query.SELECT.where;
      if (whereClause) {
        const idFilter = whereClause.find(w => w.ref?.[0] === 'ID');
        if (idFilter && idFilter.val) {
          const requestedId = idFilter.val;
          const opportunity = mockData.find(o => o.ID === requestedId);
          return opportunity ? [opportunity] : [];
        }
      }
      
      return mockData;
    }
  });

  // Handler for reading risks - with filtering by opportunityID
  this.on('READ', Risk, async (req) => {
    // Check if filtering by opportunityID (for navigation)
    const opportunityFilter = req.query.SELECT.where?.find(
      w => w.ref?.[0] === 'opportunityID'
    );
    
    if (opportunityFilter) {
      console.log(`Filtering risks by opportunityID: ${opportunityFilter.val}`);
    }
    
    // Let default handler process the query
    return next();
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
        req.error(404, `Opportunity with ID ${opportunityID} not found`);
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
  async function fetchOpportunitiesFromCRM(config) {
    const fetch = require('node-fetch');
    
    try {
      const url = config.baseURL + config.endpoint;
      console.log(`Fetching from: ${url}`);
      console.log('Headers:', JSON.stringify(config.headers, null, 2));
      
      const fetchOptions = {
        method: 'GET',
        headers: config.headers
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
      console.log('Full response:', JSON.stringify(data, null, 2));
      console.log('Response type:', typeof data);
      console.log('Response keys:', Object.keys(data));
      
      // Check if this is just metadata or minimal data
      if (data['@odata.context'] && Object.keys(data).length <= 2) {
        console.log('⚠️  Response appears to be minimal/metadata only');
        console.log('This might indicate:');
        console.log('  - Wrong endpoint URL');
        console.log('  - Missing authentication');
        console.log('  - No data available');
        console.log('  - Wrong query parameters');
        console.log('Falling back to mock data...');
        return getMockOpportunities();
      }
      
      // Log first opportunity to see the structure
      if (data.d && data.d.results && data.d.results[0]) {
        console.log('First opportunity sample:', JSON.stringify(data.d.results[0], null, 2));
      } else if (data.value && data.value[0]) {
        console.log('First opportunity sample:', JSON.stringify(data.value[0], null, 2));
      } else if (Array.isArray(data) && data[0]) {
        console.log('First opportunity sample:', JSON.stringify(data[0], null, 2));
      }
      console.log('===============================');
      
      // Transform the data based on SAP CRM response structure
      const transformed = transformOpportunityData(data);
      
      // If no meaningful data was transformed, use mock data
      if (transformed.length === 0 || transformed.every(item => !item.Name || item.Name.startsWith('Opportunity '))) {
        console.log('⚠️  No meaningful data from SAP CRM, using mock data');
        return getMockOpportunities();
      }
      
      return transformed;
      
    } catch (error) {
      console.error('Fetch error:', error);
      console.log('Error details:', error.message);
      console.log('Using mock data as fallback...');
      // Return mock data for development/testing
      return getMockOpportunities();
    }
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
      console.log('Unexpected data structure or empty data, using mock data');
      console.log('Data keys:', Object.keys(data || {}));
      return getMockOpportunities();
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

  // Mock data for development/testing - simulating SAP CRM structure
  function getMockOpportunities() {
    return [
      {
        ID: '53397f8c-6355-4c4e-8b50-433ee99d1067', // Your actual ID from SAP CRM
        ObjectID: '53397f8c-6355-4c4e-8b50-433ee99d1067',
        OpportunityID: 'OPP-2025-001',
        Name: 'Enterprise Software Implementation',
        AccountID: 'ACC001',
        SalesStage: 'Qualification',
        ExpectedRevenueAmount: 150000.00,
        Currency: 'USD',
        CloseDate: '2025-09-15',
        CreatedOn: new Date().toISOString(),
        LastChangedOn: new Date().toISOString()
      },
      {
        ID: '12345678-1234-1234-1234-123456789012',
        ObjectID: '12345678-1234-1234-1234-123456789012',
        OpportunityID: 'OPP-2025-002',
        Name: 'Cloud Migration Project',
        AccountID: 'ACC002',
        SalesStage: 'Proposal',
        ExpectedRevenueAmount: 250000.00,
        Currency: 'USD',
        CloseDate: '2025-10-30',
        CreatedOn: new Date().toISOString(),
        LastChangedOn: new Date().toISOString()
      },
      {
        ID: 'abcdef12-3456-7890-abcd-ef1234567890',
        ObjectID: 'abcdef12-3456-7890-abcd-ef1234567890',
        OpportunityID: 'OPP-2025-003',
        Name: 'Digital Transformation Initiative',
        AccountID: 'ACC003',
        SalesStage: 'Negotiation',
        ExpectedRevenueAmount: 500000.00,
        Currency: 'USD',
        CloseDate: '2025-12-15',
        CreatedOn: new Date().toISOString(),
        LastChangedOn: new Date().toISOString()
      }
    ];
  }
});