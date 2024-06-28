sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/m/MessageToast",
    "sap/ui/export/Spreadsheet",
    "sap/ui/model/json/JSONModel",
    "sap/ui/unified/FileUploader",
    "sap/m/BusyDialog",
    "sap/ui/model/Sorter" 
    
], function (Controller, MessageToast,Spreadsheet, JSONModel) {
    "use strict";

    return Controller.extend("project1.controller.Roles", {

        onInit: function () {
            var oRoleModel = new JSONModel({
                allusers: [],
                returnmessage: []
                
            });
            this.getView().setModel(oRoleModel, "roleModel");
            this._bSortAsccending = false; // Default sort order

            this._oBusyDialog = this.byId("busyDialog");
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
                        var sHeader = aHeaders[j].trim();
                        var sData = aData[j].trim();
                        if (sHeader === "Datefrom" || sHeader === "Dateto") {
                            
                           sData = this._formatDate(sData);
                        }

                        oRow[sHeader] = sData;
                    }
                    aResult.push(oRow);
                }
            }

            this.getView().getModel("roleModel").setProperty("/allusers", aResult);
        },

        _formatDate: function (sDate) {
            // Check if the date is defined and has the correct length
            if (sDate && sDate.length === 8) {
                var sYear = sDate.substring(0, 4);
                var sMonth = sDate.substring(4, 6);
                var sDay = sDate.substring(6, 8);
                return sYear + "-" + sMonth + "-" + sDay + "T00:00:00";
            } else {
                return null; // Return null or some default value if the date is invalid
            }
        },

        onCreate: function () {
            this._sendRequest("Assign_r");
        },
 
        onUpdate: function () {
            this._sendRequest("Replace_r");
        },
 
        onDelete: function () {
            this._sendRequest("Delete_r");
        },
        
        _sendRequest: function (sAction) {
            var oModel = this.getView().getModel("roleModel");
            oModel.setProperty("/returnmessage", []);
            // var oModel = new sap.ui.model.oODataModel("/sap/opu/odata/sap/ZODATA_ROLES_MGT_SRV/headerSet");
            

            var oData = {
                id: sAction,
                allusers: oModel.getProperty("/allusers"),
                returnmessage: oModel.getProperty("/returnmessage")
            };
 
            // Log the JSON payload to the console
            console.log("Payload sent to backend:", JSON.stringify(oData, null, 2));
            this._oBusyDialog.open();
            var oODataModel = this.getView().getModel("ZODATA_ROLES_MGT_SRV");
            var that = this;
            
            oODataModel.create("/headerSet", oData, {
                success: function (response) {
                    var formattedRoleReturn = response.returnmessage.results.map(function (item) {
                        

                        return {
                            ...item,
                            Datefrom: that._formatDateFromBackend(item.Datefrom), // Format date here
                            Dateto: that._formatDateFromBackend(item.Dateto) // Format date here
                        };

                    });
                    
                    oModel.setProperty("/returnmessage", formattedRoleReturn);
                    MessageToast.show("Operation successful");

                    // Log rolereturn to console
                    console.log("Response from backend:", formattedRoleReturn);
                    that._oBusyDialog.close();
                },
                error: function () {
                    MessageToast.show("Error in backend communication");
                }
            });
        },

        _formatDateFromBackend: function (sDate) {
        
            if (sDate) {
                var oDate = new Date(sDate);
                var sFormattedDate = oDate.getFullYear() + "-" + this._padZero(oDate.getMonth() + 1) + "-" + this._padZero(oDate.getDate());
        
                
        
                return sFormattedDate;
            } else {
                return null;
            }
        },

        _padZero: function (value) {
            return value.toString().padStart(2, '0');
        },

        onExport: function() {
            var oTable = this.byId("csvTable_r");
            var oModel = oTable.getModel("roleModel");
            var aData = oModel.getProperty("/returnmessage");
      
            var aCols = [
              { label: "User ID", property: "Userid", type: "string" },
              { label: "Role Name", property: "Role", type: "string" },
              { label: "Date From", property: "Datefrom", type: "string" },
              { label: "Date To", property: "Dateto", type: "string" },
              { label: "Message", property: "Message", type: "string" }
            ];
      
            var oSettings = {
              workbook: { columns: aCols },
              dataSource: aData,
              fileName: "Role_Data.xlsx"
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
                var aFilterFields = ["Userid", "Role", "Datefrom", "Dateto", "Message"];
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
        },
    });
});
     
