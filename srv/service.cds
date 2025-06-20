using {OpportunityRisks as my} from '../db/schema.cds';

@path: '/service/OpportunityRisksService'
service OpportunityRisksService {
    @odata.draft.enabled
    entity Opportunity as projection on my.Opportunity;

    entity Risk        as projection on my.Risk;
}

annotate OpportunityRisksService with @requires: ['authenticated-user'];
