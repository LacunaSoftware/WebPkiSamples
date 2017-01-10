// -------------------------------------------------------------------------------------------------
// If you have a license of the Web PKI component, place it below (you need a license to run the
// application outside of localhost)
// -------------------------------------------------------------------------------------------------
var webPkiLicense = null;
//                  ^^^^--- Web PKI license goes here
// -------------------------------------------------------------------------------------------------

var signatureFormWithAutoComplete = (function () {

    var pki = null;
    var formElements = {};
    var certificates = {};

	// -------------------------------------------------------------------------------------------------
    // Function called once the page is loaded
    // -------------------------------------------------------------------------------------------------
    var init = function(fe) {

        formElements = fe;

        // Wire-up of button clicks
        formElements.signButton.click(sign);
        formElements.refreshButton.click(refresh);

        // Turn the certificate input into a "typeahead" component
        formElements.certificateInput.typeahead({
            highlight: true
        }, {
            name: 'cert-dataset',
            source: certDataset
        });

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
        pki.listCertificates().success(function (certs) {

            // update the certificates
            certificates = certs;

            // once the certificates have been listed, unblock the UI
            $.unblockUI();

        });
    };

    // -------------------------------------------------------------------------------------------------
    // Function called by the Typeahead component to get the results for a given query
    // -------------------------------------------------------------------------------------------------
    var certDataset = function (query, syncResults, asyncResults) {

        // an array that will be populated with substring matches
        var matches = [];

        // regex used to determine if a string contains the substring `query`
        var substrRegex = new RegExp(query, 'i');

        // iterate through the user's certificates and for any certificate that
        // contains the substring `query` on its subjectName, add it to the `matches` array
        $.each(certificates, function(i, cert) {
            if (substrRegex.test(cert.subjectName)) {
                matches.push(getCertDisplayName(cert));
            }
        });

        syncResults(matches);
    };

    // -------------------------------------------------------------------------------------------------
    // Helper function that determines how a given certificate will appear on the Typeahead list
    // -------------------------------------------------------------------------------------------------
    var getCertDisplayName = function (cert) {
        return cert.subjectName;
    };

    // -------------------------------------------------------------------------------------------------
    // Helper function that gets the currently selected certificate
    // -------------------------------------------------------------------------------------------------
    var getSelectedCertificate = function() {

        // Notice: for simplification purposes of this sample, we're not addressing the possibility of ambiguity
        // between certificates.

        var selectedCertDisplayName = formElements.certificateInput.val();

        var selected = null;
        $.each(certificates, function(i, cert) {
            if (getCertDisplayName(cert) === selectedCertDisplayName) {
                selected = cert;
            }
        });

        return selected;
    };

    // -------------------------------------------------------------------------------------------------
    // Function called when the user clicks the "Sign" button
    // -------------------------------------------------------------------------------------------------
    var sign = function() {

        // Get the currently selected certificate
        var selectedCertificate = getSelectedCertificate();

        if (selectedCertificate === null) {
            alert('Choose a certificate');
            return;
        }

        // Block the UI while we perform the signature
        $.blockUI();

        pki.readCertificate(selectedCertificate.thumbprint).success(function (certificate) {
            formElements.certificateField.val(certificate);
            pki.signHash({
                thumbprint: selectedCertificate.thumbprint,
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
