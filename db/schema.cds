namespace OpportunityRisks;

entity Opportunity
{
    key ID : UUID;
    title : String(200);
    description : String(1000);
    status : String(20);
    owner : String(100);
    createdAt : Timestamp;
    risks : Composition of many Risk on risks.opportunity = $self;
}

entity Risk
{
    key ID : UUID;
    title : String(200);
    description : String(100);
    probability : String(20);
    riskScore : Integer;
    mitigationStrategy : String(1000);
    status : String(30);
    createdAt : Timestamp;
    opportunity : Association to one Opportunity;
}
