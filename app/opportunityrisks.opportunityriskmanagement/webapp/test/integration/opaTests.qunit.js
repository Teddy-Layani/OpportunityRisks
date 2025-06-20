sap.ui.require(
    [
        'sap/fe/test/JourneyRunner',
        'opportunityrisks/opportunityriskmanagement/test/integration/FirstJourney',
		'opportunityrisks/opportunityriskmanagement/test/integration/pages/RiskList',
		'opportunityrisks/opportunityriskmanagement/test/integration/pages/RiskObjectPage'
    ],
    function(JourneyRunner, opaJourney, RiskList, RiskObjectPage) {
        'use strict';
        var JourneyRunner = new JourneyRunner({
            // start index.html in web folder
            launchUrl: sap.ui.require.toUrl('opportunityrisks/opportunityriskmanagement') + '/index.html'
        });

       
        JourneyRunner.run(
            {
                pages: { 
					onTheRiskList: RiskList,
					onTheRiskObjectPage: RiskObjectPage
                }
            },
            opaJourney.run
        );
    }
);