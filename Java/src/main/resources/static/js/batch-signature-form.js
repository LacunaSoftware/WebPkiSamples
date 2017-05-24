// -------------------------------------------------------------------------------------------------
// If you have a license of the Web PKI component, place it below (you need a license to run the
// application outside of localhost)
// -------------------------------------------------------------------------------------------------
var webPkiLicense = null;
//                  ^^^^--- Web PKI license goes here
// -------------------------------------------------------------------------------------------------

var batchSignatureForm = (function () {

    var pki = null;
    var formElements = {};
    var startAction = null;
    var signatureCount = 0;
    var selectedCertThumbprint = null;
    var selectedCertContent = null;

	// -------------------------------------------------------------------------------------------------
    // Function called once the page is loaded
    // -------------------------------------------------------------------------------------------------
    var init = function(args) {

        formElements = args.formElements;
        startAction = args.startAction;
        signatureCount = args.signatureCount;

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
        selectedCertThumbprint = formElements.certificateSelect.val();

        // Call the preauthorizeSignatures function to ask authorization for performing all signatures (this ensures
        // that the authorization dialog will appear only once)
        pki.preauthorizeSignatures({
            certificateThumbprint: selectedCertThumbprint,
            signatureCount: signatureCount
        }).success(function () {
            // Read the selected certificate's encoding
            pki.readCertificate(selectedCertThumbprint).success(function (certificate) {
                // Store the certificate's encoding on a local variable
                selectedCertContent = certificate;
                // Call the "startAction" to get the parameters for the first signature
                $.ajax({
                    method: 'POST',
                    url: startAction,
                    dataType: 'json',
                    success: signStep,
                    error: onServerError
                });
            });
        });
    };

    // -------------------------------------------------------------------------------------------------
    // Function called when the parameters for the signature of the next step have been retrieved from
    // the server
    // -------------------------------------------------------------------------------------------------
    var signStep = function (model) {

        // If the "redirectTo" field is filled, the process is complete
        if (model.redirectTo) {
            window.location = model.redirectTo;
            return;
        }

        // Perform the signature using the parameters given by the server
        pki.signHash({
            thumbprint: selectedCertThumbprint,
            hash: model.toSignHash,
            digestAlgorithm: 'SHA-1'
        }).success(function(signature) {
            // Submit the result to the server and get the parameters for the next step
            $.ajax({
                method: 'POST',
                url: model.action,
                contentType: 'application/json; charset=utf-8',
                data: JSON.stringify({
                    certificate: selectedCertContent,
                    signature: signature
                }),
                dataType: 'json',
                success: signStep,
                error: onServerError
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
        if (console && console.log) {
            console.log('An error has occurred on the signature browser component: ' + message, error);
        }
        // Show the message to the user. You might want to substitute the alert below with a more user-friendly UI
        // component to show the error.
        alert(message);
    };

    // -------------------------------------------------------------------------------------------------
    // Function called if an error occurs on the backend
    // -------------------------------------------------------------------------------------------------
    var onServerError = function(jqXHR, textStatus, errorThrown) {
        // Unblock the UI
        $.unblockUI();
        // Log the error to the browser console (for debugging purposes)
        if (console && console.log) {
            console.log('A server error has occurred', { jqXHR, textStatus, errorThrown });
        }
        // Show the message to the user. You might want to substitute the alert below with a more user-friendly UI
        // component to show the error.
        alert('Server error ' + jqXHR.status + ': ' + errorThrown);
    };

    return {
        init: init
    };

})();
