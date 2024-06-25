// formatter.js
sap.ui.define([], function() {
    "use strict";
  
    return {
      formatDate: function(sDate) {
        if (!sDate) {
          return "";
        }
  
        var oDateFormat = sap.ui.core.format.DateFormat.getDateInstance({
          pattern: "yyyy-MM-dd"
        });
  
        return oDateFormat.format(new Date(sDate));
      }
    };
  });
  