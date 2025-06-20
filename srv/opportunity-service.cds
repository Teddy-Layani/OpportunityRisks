using { OpportunityRisks } from '../db/schema';

@path: '/sap-crm-integration'
service OpportunityRiskService {
  
  // Risk management entities with full CRUD and UI annotations
  @odata.draft.enabled
  entity Risks as projection on OpportunityRisks.Risk actions {
    action markAsMitigated() returns Risks;
    action markAsClosed() returns Risks;
  };
  
  // External opportunities from SAP CRM (read-only)
  @readonly
  entity Opportunities as projection on OpportunityRisks.Opportunity;
  
  // Value Help entities
  @readonly
  entity ImpactLevels as projection on OpportunityRisks.ImpactLevels;
  
  @readonly
  entity ProbabilityLevels as projection on OpportunityRisks.ProbabilityLevels;
  
  @readonly
  entity StatusTypes as projection on OpportunityRisks.StatusTypes;
  
  // Actions for opportunity-specific risk management
  action refreshOpportunities() returns String;
  action getRisksByOpportunity(opportunityID: String) returns array of Risks;
  action createRiskForOpportunity(opportunityID: String, title: String, description: String, impact: String, probability: String) returns Risks;
  action updateRisk(riskID: String, title: String, description: String, impact: String, probability: String, status: String) returns Risks;
  action deleteRisk(riskID: String) returns String;
}