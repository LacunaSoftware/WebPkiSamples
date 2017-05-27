/*
 * This file contains the necessary calls to the Web PKI component to perform the final step in the signature process,
 * which consists in performing the actual digital signature of the "to-sign-hash".
 *
 * Once the signature is done, we'll place it in a hidden input field on the page's form and submit the form.
 */
var signatureCompleteForm = (function () {

	var pki = null;
	var formElements = {};

	// -------------------------------------------------------------------------------------------------
	// Function called once the page is loaded
	// -------------------------------------------------------------------------------------------------
	function init(fe) {

		formElements = fe;

		// If there's a validation error, the view has already rendered it and we'll just show the "try again" button
		if (!formElements.formIsValid) {
			formElements.tryAgainButton.show();
			return;
		}

		// Block the UI while we get things ready
		$.blockUI({ message: 'Signing ...' });

		// Get an instance of the LacunaWebPKI object. If a license was set on Web.config, the _Layout.cshtml master
		// view will have placed it on the global variable _webPkiLicense, which we pass to the class constructor.
		pki = new LacunaWebPKI(_webPkiLicense);

		// Call the init() method on the LacunaWebPKI object, passing a callback for when
		// the component is ready to be used and another to be called when an error occurrs
		// on any of the subsequent operations. For more information, see:
		// https://webpki.lacunasoftware.com/#/Documentation#coding-the-first-lines
		// http://webpki.lacunasoftware.com/Help/classes/LacunaWebPKI.html#method_init
		pki.init({
			ready: sign, // as soon as the component is ready we'll sign the "to-sign-hash"
			defaultError: onWebPkiError // generic error callback on Content/js/app/site.js
		});
	}

	// -------------------------------------------------------------------------------------------------
	// Function called when the component is ready (note that the UI is already blocked)
	// -------------------------------------------------------------------------------------------------
	function sign() {
		// Call the signHash() function on the Web PKI component passing:
		// - The thumbprint of the certificate selected on the previous step
		// - The "to-sign-hash" and digest algorithm given by the server
		pki.signHash({
			thumbprint: formElements.certThumbField.val(),
			hash: formElements.toSignHashField.val(),
            digestAlgorithm: formElements.digestAlgorithmField.val()
		}).success(function (signature) {
			// Place the signature in a hidden input field on the page's form
			formElements.signatureField.val(signature);
			 // Submit the form (the UI will remain blocked)
			formElements.form.submit();
		});
	}

	// -------------------------------------------------------------------------------------------------
	// Function called if an error occurs on the Web PKI component
	// -------------------------------------------------------------------------------------------------
	function onWebPkiError(message, error, origin) {
		// Unblock the UI
		$.unblockUI();
		// Log the error to the browser console (for debugging purposes)
		if (console && console.log) {
			console.log('An error has occurred on the signature browser component: ' + message, { message, error, origin });
		}
		// Show the message to the user. You might want to substitute the alert below with a more user-friendly UI
		// component to show the error.
		alert(message);

		// Show the "try again" button
		formElements.tryAgainButton.show();
	}

	return {
		init: init
	};

})();
