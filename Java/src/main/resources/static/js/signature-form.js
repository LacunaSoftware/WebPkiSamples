// -------------------------------------------------------------------------------------------------
// If you have a license of the Web PKI component, place it below (you need a license to run the
// application outside of localhost)
// -------------------------------------------------------------------------------------------------
var webPkiLicense = null;
//                  ^^^^--- Web PKI license goes here
// -------------------------------------------------------------------------------------------------

var signatureForm = (function () {

    var pki = null;
    var formElements = {};

	// -------------------------------------------------------------------------------------------------
    // Function called once the page is loaded
    // -------------------------------------------------------------------------------------------------
    var init = function(fe) {

        formElements = fe;

        // Wire-up of button clicks
        formElements.signButton.click(sign);
        formElements.refreshButton.click(refresh);

        // Block the UI while we get things ready
        $.blockUI();

        // Instantiate the "LacunaWebPKI" object
        pki = new LacunaWebPKI(webPkiLicense);

        // Call the init() method on the LacunaWebPKI object, passing a callback for when
        // the component is ready to be used and another to be called when an error occurs
        // on any of the subsequent operations. For more information, see:
        // https://webpki.lacunasoftware.com/#/Documentation#coding-the-first-lines
        // http://webpki.lacunasoftware.com/Help/classes/LacunaWebPKI.html#method_init
        pki.init({
            ready: loadCertificates, // as soon as the component is ready we'll load the certificates
            defaultError: onWebPkiError
        });
    };

    // -------------------------------------------------------------------------------------------------
    // Function called when the user clicks the "Refresh" button
    // -------------------------------------------------------------------------------------------------
    var refresh = function() {
        // Block the UI while we load the certificates
        $.blockUI();
        // Invoke the loading of the certificates
        loadCertificates();
    };

	// -------------------------------------------------------------------------------------------------
	// Function that loads the certificates, either on startup or when the user
	// clicks the "Refresh" button. At this point, the UI is already blocked.
	// -------------------------------------------------------------------------------------------------
    var loadCertificates = function() {

        // Call the listCertificates() method to list the user's certificates
        pki.listCertificates({

            // specify that expired certificates should be ignored
            //filter: pki.filters.isWithinValidity,

            // in order to list only certificates within validity period and having a CPF (ICP-Brasil), use this instead:
            //filter: pki.filters.all(pki.filters.hasPkiBrazilCpf, pki.filters.isWithinValidity),

            // id of the select to be populated with the certificates
            selectId: formElements.certificateSelect.attr('id'),

            // function that will be called to get the text that should be displayed for each option
            selectOptionFormatter: function (cert) {
                return cert.subjectName + ' (expires on ' + cert.validityEnd.toDateString() + ', issued by ' + cert.issuerName + ')';
            }

        }).success(function () {

            // once the certificates have been listed, unblock the UI
            $.unblockUI();

        });
    };

    // -------------------------------------------------------------------------------------------------
    // Function called when the user clicks the "Sign" button
    // -------------------------------------------------------------------------------------------------
    var sign = function() {

        // Block the UI while we perform the signature
        $.blockUI();

        // Get the thumbprint of the selected certificate
        var selectedCertThumbprint = formElements.certificateSelect.val();
        if (formElements.certThumbField) {
            formElements.certThumbField.val(selectedCertThumbprint);
        }

        // Read the selected certificate's encoding
        pki.readCertificate(selectedCertThumbprint).success(function (certificate) {
            // Fill the encoded certificate on the form
            formElements.certificateField.val(certificate);
            // Perform the signature
            pki.signHash({
                thumbprint: selectedCertThumbprint,
                hash: formElements.toSignHashField.val(),
                digestAlgorithm: 'SHA-1'
            }).success(function(signature) {
                // Fill the signature field on the form and post it back to the server
                formElements.signatureField.val(signature);
                formElements.form.submit();
            });
        });
    };

    // -------------------------------------------------------------------------------------------------
    // Function called if an error occurs on the Web PKI component
    // -------------------------------------------------------------------------------------------------
    var onWebPkiError = function(message, error, origin) {
        // Unblock the UI
        $.unblockUI();
        // Log the error to the browser console (for debugging purposes)
        if (console) {
            console.log('An error has occurred on the signature browser component: ' + message, error);
        }
        // Show the message to the user. You might want to substitute the alert below with a more user-friendly UI
        // component to show the error.
        alert(message);
    };

    return {
        init: init
    };

})();
