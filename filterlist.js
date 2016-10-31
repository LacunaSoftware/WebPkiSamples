// -------------------------------------------------------------------------------------------------
// Function that loads the certificates, either on startup or when the user
// clicks the "Refresh" button. At this point, the UI is already blocked.
// -------------------------------------------------------------------------------------------------
function onWebPkiReady() {
    //console.log("LoadCertificates");
    // Call the listCertificates() method to list the user's certificates. For more information see
    // http://webpki.lacunasoftware.com/Help/classes/LacunaWebPKI.html#method_listCertificates
    pki.listCertificates({

        // in order to list only certificates within a specific CPF
        filter: pki.filters.all(pki.filters.pkiBrazilCpfEquals('00000000000')), // <<<<<<<<<<< put your user CPF here

        // id of the select to be populated with the certificates
        selectId: 'certificateSelect',

        // function that will be called to get the text that should be displayed for each option
        selectOptionFormatter: function (cert) {
            return cert.subjectName + ' (issued by ' + cert.issuerName + ')';
        }

    }).success(function () {

        // once the certificates have been listed, unblock the UI
        $.unblockUI();

    });
}