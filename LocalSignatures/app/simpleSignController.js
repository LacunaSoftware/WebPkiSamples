app.controller('simpleSignController', ['$scope', '$http', '$modal', 'blockUI', 'lib', function ($scope, $http, $modal, blockUI, lib) {

    $scope.signatureFile = null;
    $scope.state = 'input';
    $scope.specificPolicy = null;
    $scope.generalPolicy = null;
    $scope.signatures = null;

    // To test outside of "localhost", place your Web PKI license on the variable "webPkiLicense" (file app.js)
	var pki = new LacunaWebPKI(webPkiLicense);

    var init = function () {
        blockUI.start('Inicializando ...');
        pki.init({
            angularScope: $scope,
            ready: onWebPkiReady,
            notInstalled: onWebPkiNotInstalled,
            defaultError: onWebPkiError
        });
    };

    var onWebPkiReady = function () {
        blockUI.stop();
    };

    var count = 5;

    $scope.signMulti = function() {
        pki.preauthorizeSignatures({
            certificateThumbprint: '+Rlh0j0A3f71fcc9HslUL43CHqReKongVa/1J/sA8Tc=',
            signatureCount: count
        }).success(function () {
            for (var i=0; i<count; i++) {
                $scope.sign();
            }
        });
    };

    $scope.sign = function () {
        pki.signData({
            thumbprint: '+Rlh0j0A3f71fcc9HslUL43CHqReKongVa/1J/sA8Tc=',
            data: 'SGVsbG8sIFdvcmxkIQ==', // ASCII encoding of the string "Hello, World!", encoded in Base64
            digestAlgorithm: 'SHA-256'
        }).success(function (signature) {
            //log('Result: ' + signature);
        });
    };

    var onWebPkiNotInstalled = function (status, message) {
        blockUI.stop();
        lib.showModal('Mensagem', message + '-- Clique OK para ir para a página de instalação', function () {
            pki.redirectToInstallPage();
        });
    };

    var onWebPkiError = function (message, error, origin) {
        blockUI.stop();
        log('Erro no componente de assinatura originado em ' + origin + ': ' + message, 'Erro no componente de assinatura originado em ' + origin + ': ' + error);
    };


    init();

}]);