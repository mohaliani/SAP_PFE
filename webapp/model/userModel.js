sap.ui.define([
    "sap/ui/model/json/JSONModel"
  ], function (JSONModel) {
    "use strict";
  
    return {
      createUserModel: function () {
        var oModel = new JSONModel({
          allusers: [],
          userreturn: []
        });
        return oModel;
      }
    };
  });
  