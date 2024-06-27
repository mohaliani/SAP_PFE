sap.ui.define([], () => {
  "use strict";
  return {
      messagecolor : function( sIcon) {
          if (sIcon === 'red') {
              return "redMessage";
          } else if ( sIcon === "grn") {
              return "greenMessage";
          } else {
              return "";
          }
      }
  };
});


// sap.ui.define([], () => {
//   "use strict";
//   return {
//     messageColor: function(sIcon, sMessage) {
//         var cssClass = '';
//         if (sIcon === 'red') {
//             cssClass = 'redMessage';
//         } else if (sIcon === 'grn') {
//             cssClass = 'greenMessage';
//         }
//         return '<span class="' + cssClass + '">' + sMessage + '</span>';
//     }
//   };
// });

