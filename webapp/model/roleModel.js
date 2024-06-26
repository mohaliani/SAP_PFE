sap.ui.define([
    "sap/ui/model/json/JSONModel"
], function (JSONModel) {
    "use strict";

    return {
        createCSVModel: function () {
            var oModel = new JSONModel({
                allusers: [],  // Tableau pour stocker les données du CSV
                returnmessage: [
                ]
            });
            return oModel;
        }
    };
});

