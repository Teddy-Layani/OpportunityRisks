const cds = require('@sap/cds');

module.exports = cds.service.impl(async function() {
  
  const { Risks, Opportunities, ImpactLevels, ProbabilityLevels, StatusTypes } = this.entities;
  
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
  this.on('READ', Opportunities, async (req) => {
    try {
      console.log('Fetching opportunities from SAP CRM...');
      const opportunities = await fetchOpportunitiesFromCRM(CRM_CONFIG);
      return opportunities;
    } catch (error) {
      console.error('Error fetching opportunities:', error.message);
      req.error(500, `Failed to fetch opportunities: ${error.message}`);
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

  // Handler for reading risks - with filtering by opportunityID
  this.on('READ', Risks, async (req) => {
    // Check if filtering by opportunityID
    const opportunityFilter = req.query.SELECT.where?.find(
      w => w.ref?.[0] === 'opportunityID'
    );
    
    if (opportunityFilter) {
      console.log(`Filtering risks by opportunityID: ${opportunityFilter.val}`);
    }
    
    // Let default handler process the query
    return next();
  });

  // Action to get risks by opportunity ID
  this.on('getRisksByOpportunity', async (req) => {
    const { opportunityID } = req.data;
    
    try {
      const risks = await SELECT.from(Risks).where({ opportunityID });
      return risks;
    } catch (error) {
      console.error('Error fetching risks for opportunity:', error.message);
      req.error(500, `Failed to fetch risks: ${error.message}`);
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
      const risk = await INSERT.into(Risks).entries({
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

  // Action to update a risk
  this.on('updateRisk', async (req) => {
    const { riskID, title, description, impact, probability, status } = req.data;
    
    try {
      const updatedRisk = await UPDATE(Risks)
        .set({
          title,
          description,
          impact,
          probability,
          status,
          modifiedAt: new Date().toISOString()
        })
        .where({ ID: riskID });

      if (updatedRisk === 0) {
        req.error(404, `Risk with ID ${riskID} not found`);
      }

      // Return the updated risk
      const risk = await SELECT.one.from(Risks).where({ ID: riskID });
      return risk;
    } catch (error) {
      console.error('Error updating risk:', error.message);
      req.error(500, `Failed to update risk: ${error.message}`);
    }
  });

  // Value Help handlers
  this.on('READ', ImpactLevels, () => [
    { code: 'High', text: 'High Impact' },
    { code: 'Medium', text: 'Medium Impact' },
    { code: 'Low', text: 'Low Impact' }
  ]);

  this.on('READ', ProbabilityLevels, () => [
    { code: 'High', text: 'High Probability' },
    { code: 'Medium', text: 'Medium Probability' },
    { code: 'Low', text: 'Low Probability' }
  ]);

  this.on('READ', StatusTypes, () => [
    { code: 'Open', text: 'Open' },
    { code: 'Mitigated', text: 'Mitigated' },
    { code: 'Closed', text: 'Closed' }
  ]);

  // Risk action handlers
  this.on('markAsMitigated', 'Risks', async (req) => {
    const { ID } = req.params[0];
    await UPDATE(Risks).set({ status: 'Mitigated' }).where({ ID });
    return SELECT.one.from(Risks).where({ ID });
  });

  this.on('markAsClosed', 'Risks', async (req) => {
    const { ID } = req.params[0];
    await UPDATE(Risks).set({ status: 'Closed' }).where({ ID });
    return SELECT.one.from(Risks).where({ ID });
  });

  // Function to fetch opportunities from SAP CRM
  async function fetchOpportunitiesFromCRM(config) {
    const fetch = require('node-fetch');
    
    try {
      const url = config.baseURL + config.endpoint;
      console.log(`Fetching from: ${url}`);
      
      const fetchOptions = {
        method: 'GET',
        headers: config.headers
      };

      // Add Basic Auth if configured
      if (config.auth) {
        const auth = Buffer.from(`${config.auth.username}:${config.auth.password}`).toString('base64');
        fetchOptions.headers['Authorization'] = `Basic ${auth}`;
      }
      
      const response = await fetch(url, fetchOptions);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('Raw response received from SAP CRM');
      
      // Transform the data based on SAP CRM response structure
      return transformOpportunityData(data);
      
    } catch (error) {
      console.error('Fetch error:', error);
      // Return mock data for development/testing
      return getMockOpportunities();
    }
  }

  // Transform SAP CRM data to match our model
  function transformOpportunityData(data) {
    // Handle different possible response structures
    let results = [];
    
    if (data && data.d && data.d.results) {
      results = data.d.results;
    } else if (data && Array.isArray(data)) {
      results = data;
    } else if (data && data.value) {
      results = data.value;
    } else {
      console.warn('Unexpected data structure, using mock data');
      return getMockOpportunities();
    }

    return results.map(item => ({
      ID: item.ObjectID || item.ID || cds.utils.uuid(),
      ObjectID: item.ObjectID,
      OpportunityID: item.OpportunityID || item.OpportunityID,
      Name: item.Name || item.Description,
      AccountID: item.AccountID,
      SalesStage: item.SalesStage || item.ProcessingStatusCodeText,
      ExpectedRevenueAmount: item.ExpectedRevenueAmount || item.ExpectedValue,
      Currency: item.Currency || item.CurrencyCodeText || 'USD',
      CloseDate: item.CloseDate || item.ExpectedClosingDate,
      CreatedOn: item.CreatedOn || item.CreationDateTime,
      LastChangedOn: item.LastChangedOn || item.LastChangeDateTime
    }));
  }

  // Mock data for development/testing
  function getMockOpportunities() {
    return [
      {
        ID: cds.utils.uuid(),
        ObjectID: 'OBJ001',
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
        ID: cds.utils.uuid(),
        ObjectID: 'OBJ002',
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
        ID: cds.utils.uuid(),
        ObjectID: 'OBJ003',
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