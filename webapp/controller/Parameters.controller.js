sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/ui/export/Spreadsheet",
    "sap/m/MessageToast",
    "sap/m/BusyDialog" ,
    "sap/ui/model/Sorter" 
], function (Controller, JSONModel, Spreadsheet, MessageToast, BusyDialog) {
    "use strict";

    return Controller.extend("project1.controller.Params", {
        onInit: function () {
            var oParamModel = new JSONModel({
                allparams: [],
                paramreturn: []
            });
            this.getView().setModel(oParamModel, "paramModel");
            this._oBusyDialog = this.byId("busyDialog");
            this._bSortAsccending = false; // Default sort order
        },
        onFileUpload: function (oEvent) {
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
                        var sHeader = aHeaders[j].trim();
                        var sData = aData[j].trim();
                        oRow[sHeader] = sData;
                    }
                    aResult.push(oRow);
                }
            }

            this.getView().getModel("paramModel").setProperty("/allparams", aResult);
        },

        onCreate: function () {
            this._sendRequest("Create");
        },

        onUpdate: function () {
            this._sendRequest("Update");
        },

        onDelete: function () {
            this._sendRequest("Delete");
        },

        _sendRequest: function (sAction) {
            var oModel = this.getView().getModel("paramModel");

            // Clear the params property before sending the request
            oModel.setProperty("/paramreturn", []);

            var oData = {
                id: sAction,
                allparams: oModel.getProperty("/allparams"),
                paramreturn: oModel.getProperty("/paramreturn")

            };

            // Log the JSON payload to the console
            console.log("Payload sent to backend:", JSON.stringify(oData, null, 2));
            this._oBusyDialog.open();
            var oODataModel = this.getView().getModel("Z_CSV_PARAMS_MAINTENANCE_SRV");
            var that = this;
            oODataModel.create("/parametersSet", oData, {
                success: function (response) {
                    oModel.setProperty("/paramreturn", response.paramreturn.results);
                    MessageToast.show("Operation successful");

                    // Log params to console
                    console.log("Response from backend:", response.paramreturn.results);
                    that._oBusyDialog.close();
                },
                error: function () {
                    MessageToast.show("Error in backend communication");
                    that._oBusyDialog.close();
                }
            });
        },

        onExport: function() {
            var oTable = this.byId("csvTable_r");
            var oModel = oTable.getModel("paramModel");
            var aData = oModel.getProperty("/paramreturn");
      
            var aCols = [
              { label: "User ID", property: "userid", type: "string" },
              { label: "Param ID", property: "parid", type: "string" },
              { label: "Param value", property: "parva", type: "string" },
              { label: "Message", property: "message", type: "string" }
            ];
      
            var oSettings = {
              workbook: { columns: aCols },
              dataSource: aData,
              fileName: "Param_Data.xlsx"
            };
      
            var oSheet = new Spreadsheet(oSettings);
            oSheet.build().then(function() {
              sap.m.MessageToast.show("Spreadsheet export has finished");
            }).finally(function() {
              oSheet.destroy();
            });
          },
          onSearch: function (oEvent) {
            var sQuery = oEvent.getParameter("query");
            var aFilters = [];
        
            if (sQuery) {
                var aFilterFields = ["userid", "parid", "parva", "message"];
                var aSubFilters = aFilterFields.map(function(field) {
                    return new sap.ui.model.Filter(field, sap.ui.model.FilterOperator.Contains, sQuery);
                });
        
                aFilters = new sap.ui.model.Filter({
                    filters: aSubFilters,
                    and: false
                });
            }
        
            var oTable = this.byId("csvTable_r");
            var oBinding = oTable.getBinding("items");
            oBinding.filter(aFilters);
        },
        onOpenSortDialog: function () {
            this.byId("sortDialog").open();
        },
        onCloseSortDialog: function () {
            this.byId("sortDialog").close();
        },

        onSortButtonPress: function () {
            var oTable = this.byId("csvTable_r");
            var oBinding = oTable.getBinding("items");
            var oSelect = this.byId("sortSelect");
            var sSortField = oSelect.getSelectedKey();

            console.log("Selected Sort Field:", sSortField); // Log the selected sort field

            if (sSortField && oBinding) {
                this._bSortAscending = !this._bSortDescending;
                var oSorter = new sap.ui.model.Sorter(sSortField, this._bSortDescending);
                oBinding.sort(oSorter);
            } else {
                console.error("No binding found for the table or selected sort field.");
            }

            this.byId("sortDialog").close();
        }

    });
});
