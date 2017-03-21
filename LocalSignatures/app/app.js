// ----------------------------------------------------------------
// To test outside of "localhost", place your Web PKI license below
// ----------------------------------------------------------------
var webPkiLicense = null;

var app = angular.module('WebPkiLocalDemoApp', ['ui.bootstrap', 'blockUI']);

app.config(['blockUIConfig', function (blockUIConfig) {
	blockUIConfig.autoBlock = false;
	blockUIConfig.message = 'Please wait ...';
}]);

app.factory('lib', ['$http', '$modal', 'blockUI', function ($http, $modal, blockUI) {

	var showModal = function (title, message, okCallback) {
		$modal.open({
			templateUrl: 'templates/dialog.html',
			controller: 'dialogController',
			resolve: {
				title: function () { return title; },
				message: function () { return message; },
				okCallback: function () { return okCallback; }
			}
		});
	};

	var log = function (userMessage, logMessage) {
		logMessage = logMessage || userMessage;
		if (window.console) {
			window.console.log(logMessage);
		}
		showModal('Message', userMessage);
	};

	// Function to convert Validation Results to string
	var vrToString = function (vr, ident) {
	    var text = '';
	    var itemIdent = ident + '\t';
	    var i = i;

	    if (!vr.errors.length) {
	        text += ident + 'Errors: none\n';
	    } else {
	        text += ident + 'Errors:\n';
	    }
	    for (i = 0; i < vr.errors.length; i++) {
	        text += itemIdent + vr.errors[i].message;
	        if (vr.errors[i].detail) {
	            text += ' (' + vr.errors[i].detail + ')';
	        }
	        text += '\n';
	        if (vr.errors[i].innerValidationResults) {
	            text += vrToString(vr.errors[i].innerValidationResults, ident + '\t');
	        }
	    }

	    if (!vr.warnings.length) {
	        text += ident + 'Warnings: none\n';
	    } else {
	        text += ident + 'Warnings:\n';
	    }
	    for (i = 0; i < vr.warnings.length; i++) {
	        text += itemIdent + vr.warnings[i].message;
	        if (vr.warnings[i].detail) {
	            text += ' (' + vr.warnings[i].detail + ')';
	        }
	        text += '\n';
	        if (vr.warnings[i].innerValidationResults) {
	            text += vrToString(vr.warnings[i].innerValidationResults, ident + '\t');
	        }
	    }

	    if (!vr.passedChecks.length) {
	        text += ident + 'Passed Checks: none\n';
	    } else {
	        text += ident + 'Passed Checks:\n';
	    }
	    for (i = 0; i < vr.passedChecks.length; i++) {
	        text += itemIdent + vr.passedChecks[i].message;
	        if (vr.passedChecks[i].detail) {
	            text += ' (' + vr.passedChecks[i].detail + ')';
	        }
	        text += '\n';
	        if (vr.passedChecks[i].innerValidationResults) {
	            text += vrToString(vr.passedChecks[i].innerValidationResults, ident + '\t');
	        }
	    }
	    return text;
	};

	return {
		showModal: showModal,
		log: log,
		vrToString: vrToString
	};
}]);
