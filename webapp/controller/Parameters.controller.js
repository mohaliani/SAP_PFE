sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/m/MessageToast",
    "sap/ui/model/json/JSONModel",
    "sap/ui/unified/FileUploader"
], function (Controller, MessageToast, JSONModel) {
    "use strict";

    return Controller.extend("project1.controller.Parameters", {
        onInit: function () {
            var oModel = new JSONModel({
                selectedFile: null,
                csvData: []
            });
            this.getView().setModel(oModel);
        },

        onFileChange: function (oEvent) {
            var oFile = oEvent.getParameter("files") && oEvent.getParameter("files")[0];
            
            if (oFile) {
                var reader = new FileReader();
                reader.onload = function (e) {
                    var sContent = e.target.result;
                    this._parseCSV(sContent);
                    MessageToast.show("File uploaded successfully");
                }.bind(this);
                reader.readAsText(oFile);
            }
        },

        _parseCSV: function (sCSV) {
            var aLines = sCSV.split(/\r?\n/);
            var aResult = [];
            var aHeaders = aLines[0].split(',');

            for (var i = 1; i < aLines.length; i++) {
                if (aLines[i].trim() !== "") {
                    var aData = aLines[i].split(',');
                    var oRow = {};
                    for (var j = 0; j < aHeaders.length; j++) {
                        oRow[aHeaders[j].trim()] = aData[j].trim();
                    }
                    aResult.push(oRow);
                }
            }

            this.getView().getModel().setProperty("/csvData", aResult);
        }
    });
});
