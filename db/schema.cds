using { cuid, managed } from '@sap/cds/common';

namespace OpportunityRisks;

entity Risk : cuid, managed {
  title         : String(100) @title: 'Risk Title' @mandatory;
  description   : String(500) @title: 'Description';
  impact        : String(20) @title: 'Impact Level' @mandatory; // High, Medium, Low
  probability   : String(20) @title: 'Probability' @mandatory; // High, Medium, Low
  status        : String(20) @title: 'Status' @mandatory @default: 'Open'; // Open, Mitigated, Closed
  
  // Additional risk management fields
  owner         : String(100) @title: 'Risk Owner';
  mitigation    : String(1000) @title: 'Mitigation Strategy';
  dueDate       : Date @title: 'Due Date';
  
  // Link to external opportunity
  opportunityID   : String(50) @title: 'Opportunity ID';
  opportunityName : String(200) @title: 'Opportunity Name';
}

// View entity for external opportunities (read-only)
@cds.persistence.skip
entity Opportunity : cuid {
  ObjectID              : String(50) @title: 'Object ID';
  OpportunityID         : String(50) @title: 'Opportunity ID';
  Name                  : String(200) @title: 'Opportunity Name';
  AccountID             : String(50) @title: 'Account ID';
  SalesStage            : String(50) @title: 'Sales Stage';
  ExpectedRevenueAmount : Decimal(15,2) @title: 'Expected Revenue';
  Currency              : String(3) @title: 'Currency';
  CloseDate             : Date @title: 'Close Date';
  CreatedOn             : DateTime @title: 'Created On';
  LastChangedOn         : DateTime @title: 'Last Changed';
  
  // Navigation to associated risks
  risks                 : Association to many Risk on risks.opportunityID = $self.ID;
}

// Value Help entities
@cds.persistence.skip
entity ImpactLevels {
  key code : String(20);
  text : String(50);
}

@cds.persistence.skip
entity ProbabilityLevels {
  key code : String(20);
  text : String(50);
}

@cds.persistence.skip
entity StatusTypes {
  key code : String(20);
  text : String(50);
}