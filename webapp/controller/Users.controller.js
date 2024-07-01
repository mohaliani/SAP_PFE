sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/ui/export/Spreadsheet",
    "sap/m/MessageToast",
    "sap/m/BusyDialog",
    "sap/ui/model/Sorter"
], function (Controller, JSONModel, Spreadsheet, MessageToast, BusyDialog) {
    "use strict";

    return Controller.extend("project1.controller.Main", {
        onInit: function () {
            var oUserModel = new JSONModel({
                allusers: [],
                userreturn: []
            });
            this.getView().setModel(oUserModel, "userModel");
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
                        if (sHeader === "datefrom" || sHeader === "dateto") {
                            
                           sData = this._formatDate(sData);
                        }

                        oRow[sHeader] = sData;
                    }
                    aResult.push(oRow);
                }
            }
            this.getView().getModel("userModel").setProperty("/allusers", aResult);
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
            this._oBusyDialog.open();
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
                    that._oBusyDialog.close();
                },
                error: function () {
                    MessageToast.show("Error in backend communication");
                    that._oBusyDialog.close();
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
        },

        onExport: function () {
            var oTable = this.byId("responseTable");
            var oModel = oTable.getModel("userModel");
            var aData = oModel.getProperty("/userreturn");

            var aCols = [
                { label: "User ID", property: "userid", type: "string" },
                { label: "First Name", property: "firstname", type: "string" },
                { label: "Last Name", property: "lastname", type: "string" },
                { label: "Email", property: "email", type: "string" },
                { label: "Password", property: "password", type: "string" },
                { label: "Language", property: "langup", type: "string" },
                { label: "Date From", property: "datefrom", type: "string" },
                { label: "Date To", property: "dateto", type: "string" },
                { label: "User Group", property: "usergrp", type: "string" },
                { label: "Output Device", property: "spld", type: "string" },
                { label: "Communication Type", property: "commtype", type: "string" },
                { label: "Decimal", property: "dcpfm", type: "string" },
                { label: "Company", property: "company", type: "string" },
                { label: "Message", property: "message", type: "string" }
            ];

            var oSettings = {
                workbook: { columns: aCols },
                dataSource: aData,
                fileName: "User_Data.xlsx"
            };

            var oSheet = new Spreadsheet(oSettings);
            oSheet.build().then(function () {
                sap.m.MessageToast.show("Spreadsheet export has finished");
            }).finally(function () {
                oSheet.destroy();
            });
        },

        onSelectionChange: function (oEvent) {
            var oTable = oEvent.getSource();
            var oSelectedItem = oTable.getSelectedItem();
            if (oSelectedItem) {
                var oBindingContext = oSelectedItem.getBindingContext("userModel");

                this._getDetailsDialog().bindElement({
                    path: oBindingContext.getPath(),
                    model: "userModel"
                });
                this._getDetailsDialog().open();
            }
        },

        _getDetailsDialog: function () {
            if (!this._oDialog) {
                this._oDialog = this.byId("detailsDialog");
                if (!this._oDialog) {
                    // Load asynchronous XML fragment
                    this._oDialog = sap.ui.xmlfragment(this.getView().getId(), "project1.view.DetailsDialog", this);
                    this.getView().addDependent(this._oDialog);
                }
            }
            return this._oDialog;
        },

        onCloseDialog: function () {
            this._getDetailsDialog().close();
        },
        onSearch: function (oEvent) {
            var sQuery = oEvent.getParameter("query");
            var aFilters = [];

            if (sQuery) {
                var aFilterFields = ["userid", "firstname", "lastname", "email", "password", "langup", "datefrom",
                    "dateto", "usergrp", "spld", "commtype", "dcpfm", "company", "message"];
                var aSubFilters = aFilterFields.map(function (field) {
                    return new sap.ui.model.Filter(field, sap.ui.model.FilterOperator.Contains, sQuery);
                });

                aFilters = new sap.ui.model.Filter({
                    filters: aSubFilters,
                    and: false
                });
            }

            var oTable = this.byId("responseTable");
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
            var oTable = this.byId("responseTable");
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
