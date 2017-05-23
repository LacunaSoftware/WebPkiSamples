// -------------------------------------------------------------------------------------------------
// If you have a license of the Web PKI component, place it below (you need a license to run the
// application outside of localhost)
// -------------------------------------------------------------------------------------------------
var webPkiLicense = null;
//                  ^^^^--- Web PKI license goes here
// -------------------------------------------------------------------------------------------------

var signaturePreSelectedCertForm = (function () {

    var pki = null;
    var formElements = {};

	// -------------------------------------------------------------------------------------------------
    // Function called once the page is loaded
    // -------------------------------------------------------------------------------------------------
    var init = function(fe) {

        formElements = fe;

        // Block the UI while we perform the signature
        $.blockUI();

        // Instantiate the "LacunaWebPKI" object
        pki = new LacunaWebPKI(webPkiLicense);

        // Call the init() method on the LacunaWebPKI object, passing a callback for when
        // the component is ready to be used and another to be called when an error occurs
        // on any of the subsequent operations. For more information, see:
        // https://webpki.lacunasoftware.com/#/Documentation#coding-the-first-lines
        // http://webpki.lacunasoftware.com/Help/classes/LacunaWebPKI.html#method_init
        pki.init({
            ready: sign, // as soon as the component is ready we'll load the certificates
            defaultError: onWebPkiError
        });
    };

    // -------------------------------------------------------------------------------------------------
    // Function called when the Web PKI component loads
    // -------------------------------------------------------------------------------------------------
    var sign = function() {

        // Get the thumbprint of the selected certificate
        var selectedCertThumbprint = formElements.certThumbField.val();

        pki.readCertificate(selectedCertThumbprint).success(function (certificate) {
            formElements.certificateField.val(certificate);
            pki.signHash({
                thumbprint: selectedCertThumbprint,
                hash: formElements.toSignHashField.val(),
                digestAlgorithm: 'SHA-1'
            }).success(function(signature) {
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
