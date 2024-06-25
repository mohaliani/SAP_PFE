sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageToast"
], function (Controller, JSONModel, MessageToast) {
    "use strict";

    return Controller.extend("project1.controller.Main", {
        onInit: function () {
            var oUserModel = new JSONModel({
                allusers: [],
                userreturn: []
            });
            this.getView().setModel(oUserModel, "userModel");
        },

        onFileUpload: function (oEvent) {
            var oFile = oEvent.getParameter("files")[0];
            var that = this;

            if (oFile && window.FileReader) {
                var reader = new FileReader();
                reader.onload = function (e) {
                    var sCSV = e.target.result;
                    var aLines = sCSV.split("\n");

                    // Skip the first line (header)
                    var aUsers = aLines.slice(1).map(function (line) {
                        var aFields = line.split(",");
                        return {
                            userid: aFields[0],
                            firstname: aFields[1],
                            lastname: aFields[2],
                            email: aFields[3],
                            password: aFields[4],
                            langup: aFields[5],
                            datefrom: that._formatDate(aFields[6]),
                            dateto: that._formatDate(aFields[7]),
                            usergrp: aFields[8],
                            spld: aFields[9],
                            commtype: aFields[10],
                            dcpfm: aFields[11],
                            company: aFields[12]
                        };
                    });

                    that.getView().getModel("userModel").setProperty("/allusers", aUsers);
                };
                reader.readAsText(oFile);
            }
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
            this._sendRequest("Create");
        },

        onUpdate: function () {
            this._sendRequest("Update");
        },

        onDelete: function () {
            this._sendRequest("Delete");
        },

        _sendRequest: function (sAction) {
            var oModel = this.getView().getModel("userModel");
            
            // Clear the userreturn property before sending the request
            oModel.setProperty("/userreturn", []);

            var oData = {
                id: sAction,
                allusers: oModel.getProperty("/allusers"),
                userreturn: oModel.getProperty("/userreturn")
            };

            // Log the JSON payload to the console
            console.log("Payload sent to backend:", JSON.stringify(oData, null, 2));

            var oODataModel = this.getView().getModel();
            var that = this;
            oODataModel.create("/usersSet", oData, {
                success: function (response) {
                    var formattedUserReturn = response.userreturn.results.map(function (item) {
                        return {
                            ...item,
                            datefrom: that._formatDateFromBackend(item.datefrom), // Format date here
                            dateto: that._formatDateFromBackend(item.dateto) // Format date here
                        };
                    });
                    oModel.setProperty("/userreturn", formattedUserReturn);
                    MessageToast.show("Operation successful");

                    // Log userreturn to console
                    console.log("Response from backend:", formattedUserReturn);
                },
                error: function () {
                    MessageToast.show("Error in backend communication");
                }
            });
        },

        _formatDateFromBackend: function (sDate) {
            // Assuming sDate is in the format returned from backend
            if (sDate) {
                var oDate = new Date(sDate);
                var sFormattedDate = oDate.getFullYear() + "-" + this._padZero(oDate.getMonth() + 1) + "-" + this._padZero(oDate.getDate());
                return sFormattedDate;
            } else {
                return null; // Return null or some default value if the date is invalid
            }
        },

        _padZero: function (value) {
            return value.toString().padStart(2, '0');
        }
    });
});
