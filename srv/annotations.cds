using { OpportunityRiskService } from './opportunity-service';

////////////////////////////////////////////////////////////////////////////
//
//	Risk List Page
//
annotate OpportunityRiskService.Risks with @(
	UI.LineItem: [
		{
			$Type: 'UI.DataField',
			Value: title,
			Label: 'Risk Title'
		},
		{
			$Type: 'UI.DataField',
			Value: impact,
			Label: 'Impact'
		},
		{
			$Type: 'UI.DataField',
			Value: probability,
			Label: 'Probability'
		},
		{
			$Type: 'UI.DataField',
			Value: status,
			Label: 'Status'
		},
		{
			$Type: 'UI.DataField',
			Value: opportunityName,
			Label: 'Opportunity'
		},
		{
			$Type: 'UI.DataField',
			Value: createdAt,
			Label: 'Created At'
		}
	],
	UI.SelectionFields: [
		status,
		impact,
		probability,
		opportunityID
	]
);

////////////////////////////////////////////////////////////////////////////
//
//	Risk Object Page
//
annotate OpportunityRiskService.Risks with @(
	UI.FieldGroup #GeneralInformation: {
		$Type: 'UI.FieldGroupType',
		Data: [
			{
				$Type: 'UI.DataField',
				Value: title,
				Label: 'Risk Title'
			},
			{
				$Type: 'UI.DataField',
				Value: description,
				Label: 'Description'
			},
			{
				$Type: 'UI.DataField',
				Value: opportunityName,
				Label: 'Opportunity'
			}
		]
	},
	UI.FieldGroup #RiskAssessment: {
		$Type: 'UI.FieldGroupType',
		Data: [
			{
				$Type: 'UI.DataField',
				Value: impact,
				Label: 'Impact Level'
			},
			{
				$Type: 'UI.DataField',
				Value: probability,
				Label: 'Probability'
			},
			{
				$Type: 'UI.DataField',
				Value: status,
				Label: 'Status'
			}
		]
	},
	UI.FieldGroup #Status: {
		$Type: 'UI.FieldGroupType',
		Data: [
			{
				$Type: 'UI.DataField',
				Value: status,
				Label: 'Current Status'
			},
			{
				$Type: 'UI.DataField',
				Value: createdAt,
				Label: 'Created At'
			},
			{
				$Type: 'UI.DataField',
				Value: modifiedAt,
				Label: 'Last Modified'
			}
		]
	},
	UI.Facets: [
		{
			$Type: 'UI.ReferenceFacet',
			ID: 'GeneralInformationFacet',
			Label: 'General Information',
			Target: '@UI.FieldGroup#GeneralInformation'
		},
		{
			$Type: 'UI.ReferenceFacet',
			ID: 'RiskAssessmentFacet',
			Label: 'Risk Assessment',
			Target: '@UI.FieldGroup#RiskAssessment'
		},
		{
			$Type: 'UI.ReferenceFacet',
			ID: 'StatusFacet',
			Label: 'Status Information',
			Target: '@UI.FieldGroup#Status'
		}
	]
);

////////////////////////////////////////////////////////////////////////////
//
//	Value Help and Input Validation
//
annotate OpportunityRiskService.Risks with {
	impact @(
		Common.ValueList: {
			$Type: 'Common.ValueListType',
			CollectionPath: 'ImpactLevels',
			Parameters: [
				{
					$Type: 'Common.ValueListParameterInOut',
					LocalDataProperty: impact,
					ValueListProperty: 'code'
				},
				{
					$Type: 'Common.ValueListParameterDisplayOnly',
					ValueListProperty: 'text'
				}
			]
		},
		Common.ValueListWithFixedValues: true
	);
	
	probability @(
		Common.ValueList: {
			$Type: 'Common.ValueListType',
			CollectionPath: 'ProbabilityLevels',
			Parameters: [
				{
					$Type: 'Common.ValueListParameterInOut',
					LocalDataProperty: probability,
					ValueListProperty: 'code'
				},
				{
					$Type: 'Common.ValueListParameterDisplayOnly',
					ValueListProperty: 'text'
				}
			]
		},
		Common.ValueListWithFixedValues: true
	);
	
	status @(
		Common.ValueList: {
			$Type: 'Common.ValueListType',
			CollectionPath: 'StatusTypes',
			Parameters: [
				{
					$Type: 'Common.ValueListParameterInOut',
					LocalDataProperty: status,
					ValueListProperty: 'code'
				},
				{
					$Type: 'Common.ValueListParameterDisplayOnly',
					ValueListProperty: 'text'
				}
			]
		},
		Common.ValueListWithFixedValues: true
	);
}

////////////////////////////////////////////////////////////////////////////
//
//	Page Header
//
annotate OpportunityRiskService.Risks with @(
	UI.HeaderInfo: {
		TypeName: 'Risk',
		TypeNamePlural: 'Risks',
		Title: {
			$Type: 'UI.DataField',
			Value: title
		},
		Description: {
			$Type: 'UI.DataField',
			Value: opportunityName
		}
	}
);

////////////////////////////////////////////////////////////////////////////
//
//	Field-level annotations (simplified)
//
annotate OpportunityRiskService.Risks with {
	impact @(
		Common.Text: impact,
		UI.TextArrangement: #TextOnly
	);
	
	status @(
		Common.Text: status,
		UI.TextArrangement: #TextOnly
	);
}