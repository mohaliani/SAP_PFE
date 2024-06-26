sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/m/MessageToast",
    "sap/ui/model/json/JSONModel",
    "sap/ui/unified/FileUploader"
], function (Controller, MessageToast, JSONModel) {
    "use strict";

    return Controller.extend("project1.controller.Roles", {

        onInit: function () {
            var oRoleModel = new JSONModel({
                allusers: [],
                returnmessage: []
                
            });
            this.getView().setModel(oRoleModel, "roleModel");
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
            
            var oODataModel = this.getView().getModel("ZODATA_ROLES_MGT_SRV");
            var that = this;
            // oODataModel.create("/headerSet", oData, {
            //     success: function (response) {
            //         oModel.setProperty("/returnmessage", response.returnmessage.results);
            //         MessageToast.show("Operation successful");
 
            //         // Log userreturn to console
            //         console.log("Response from backend:", response.returnmessage.results);
            //     },
            //     error: function () {
            //         MessageToast.show("Error in backend communication");
            //     }
            // });

            oODataModel.create("/headerSet", oData, {
                success: function (response) {
                    var formattedRoleReturn = response.returnmessage.results.map(function (item) {
                        var formattedDateFrom = that._formatDateFromBackend(item.Datefrom);
                        var formattedDateTo = that._formatDateFromBackend(item.Dateto);

                        // Log formatted dates from backend
                        console.log("Formatted datefrom from backend:", formattedDateFrom);
                        console.log("Formatted dateto from backend:", formattedDateTo);

                        return {
                            ...item,
                            Datefrom: that._formatDateFromBackend(item.Datefrom), // Format date here
                            Dateto: that._formatDateFromBackend(item.Dateto) // Format date here
                        };

                    });
                    debugger;
                    oModel.setProperty("/returnmessage", formattedRoleReturn);
                    MessageToast.show("Operation successful");

                    // Log rolereturn to console
                    console.log("Response from backend:", formattedRoleReturn);
                },
                error: function () {
                    MessageToast.show("Error in backend communication");
                }
            });
        },

        // _formatDateFromBackend: function (sDate) {
        //     // Assuming sDate is in the format returned from backend
        //     if (sDate) {
        //         var oDate = new Date(sDate);
        //         var sFormattedDate = oDate.getFullYear() + "-" + this._padZero(oDate.getMonth() + 1) + "-" + this._padZero(oDate.getDate());
        //         return sFormattedDate;
        //     } else {
        //         return null; // Return null or some default value if the date is invalid
        //     }
        // },

        _formatDateFromBackend: function (sDate) {
            // Log the date received from backend
            console.log("Date received from backend (in _formatDateFromBackend):", sDate);
        
            if (sDate) {
                var oDate = new Date(sDate);
                var sFormattedDate = oDate.getFullYear() + "-" + this._padZero(oDate.getMonth() + 1) + "-" + this._padZero(oDate.getDate());
        
                // Log formatted date from backend
                console.log("Formatted date from backend (in _formatDateFromBackend):", sFormattedDate);
        
                return sFormattedDate;
            } else {
                return null;
            }
        },

        _padZero: function (value) {
            return value.toString().padStart(2, '0');
        }
        
    });
});
     
