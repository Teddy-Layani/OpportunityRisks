using { OpportunityRisks } from '../db/schema';

@path: '/opportunity-risks'
service OpportunityRisksService {
  
  // Risk management entities
  entity Risk as projection on OpportunityRisks.Risk;
  
  // External opportunities from SAP CRM (read-only) with navigation to risks
  @readonly
  entity Opportunity as projection on OpportunityRisks.Opportunity {
    *,
    // Navigation property to get risks for this opportunity
    risks : Association to many Risk on risks.opportunityID = $self.ID
  };
  
  // Actions
  action refreshOpportunities() returns String;
  action createRiskForOpportunity(opportunityID: String, title: String, description: String, impact: String, probability: String) returns Risk;
}