using OpportunityRisksService as service from '../../srv/service';
annotate service.Risk with @(
    UI.FieldGroup #GeneratedGroup : {
        $Type : 'UI.FieldGroupType',
        Data : [
            {
                $Type : 'UI.DataField',
                Value : title,
            },
            {
                $Type : 'UI.DataField',
                Value : description,
            },
            {
                $Type : 'UI.DataField',
                Value : impact,
            },
            {
                $Type : 'UI.DataField',
                Value : probability,
            },
            {
                $Type : 'UI.DataField',
                Value : status,
            },
            {
                $Type : 'UI.DataField',
                Value : opportunityID,
            },
            {
                $Type : 'UI.DataField',
                Value : opportunityName,
            },
        ],
    },
    UI.Facets : [
        {
            $Type : 'UI.ReferenceFacet',
            ID : 'GeneratedFacet1',
            Label : 'General Information',
            Target : '@UI.FieldGroup#GeneratedGroup',
        },
    ],
    UI.LineItem : [
        {
            $Type : 'UI.DataField',
            Value : title,
        },
        {
            $Type : 'UI.DataField',
            Value : description,
        },
        {
            $Type : 'UI.DataField',
            Value : impact,
        },
        {
            $Type : 'UI.DataField',
            Value : probability,
        },
        {
            $Type : 'UI.DataField',
            Value : status,
        },
    ],
);

