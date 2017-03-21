app.controller('pdfSignerController', ['$scope', '$http', '$modal', 'blockUI', 'lib', function ($scope, $http, $modal, blockUI, lib) {

	$scope.certificates = [];
	$scope.selectedCertificate = null;
	$scope.files = [];
	var fileIndex = -1;
	$scope.positionOption = "left";
	$scope.state = 'input';
	$scope.markPositions = {
		bottom: false,
		left: false,
		right: false
	};

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

	$scope.resetFiles = function () {
		$scope.files = [];
	};

	var onWebPkiReady = function () {
		blockUI.message('Carregando certificados ...');
		loadCertificates();
	};

	$scope.refreshCertificates = function () {
		blockUI.start('Carregando certificados ...');
		loadCertificates();
	};

	var loadCertificates = function () {
		pki.listCertificates().success(onListCertificatesCompleted);
	};

	var onListCertificatesCompleted = function (certs) {
		$scope.certificates = certs;
		blockUI.stop();
	};

	$scope.selectFiles = function () {
		pki.showFileBrowser({
			dialogTitle: 'Selecione os PDFs que deseja assinar',
			multiselect: true
		}).success(function (result) {
			if (!result.userCancelled) {
				$scope.files = $scope.files.concat(result.files);
			}
		});
	};

	$scope.getDisplaySize = function (size) {
		if (size) {
			if (size >= 1048576) {
				return (size / 1048576).toFixed(2) + ' MB';
			} else if (size > 1024) {
				return (size / 1024).toFixed(2) + ' KB';
			} else {
				return size.toString() + ' bytes';
			}
		} else {
			return "";
		}
	};

	$scope.sign = function () {

		if ($scope.selectedCertificate == null) {
			lib.showModal('Message', 'Selecione o certificado a ser usado na assinatura!');
			return;
		}

		if ($scope.files.length === 0) {
			lib.showModal('Message', 'Selecione pelo menos um arquivo para assinar!');
			return;
		}

		$scope.state = 'signing';
		blockUI.start('Assinando ...');

		pki.preauthorizeSignatures({
			certificateThumbprint: $scope.selectedCertificate.thumbprint,
			signatureCount: $scope.files.length
		}).success(function () {
			fileIndex = -1;
			signNextFile();
		});
	};

	var signNextFile = function () {
		fileIndex += 1;
		if (fileIndex < $scope.files.length) {
			blockUI.message('Assinando (' + (fileIndex + 1).toString() + '/' + $scope.files.length.toString() + ') ...');
			var file = $scope.files[fileIndex];
			pki.signPdf({
				fileId: file.id,
				output: {
					mode: 'autoSave',
					//dialogTitle: 'My Title',
					fileNameSuffix: '-autenticado',
				},
				certificateThumbprint: $scope.selectedCertificate.thumbprint,
				visualRepresentation: getVisualRepresentationModel(),
				pdfMarks: getPdfMarks(),
				policy: 'basic',
				trustArbitrators: [
					// ICP-Brasil
					pki.standardTrustArbitrators.pkiBrazil,
					// Lacuna Software Test Root (development only!)
					{
						type: 'trustedRoot',
						trustedRoot: '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'
					}
				]
			}).success(function (result) {
				if (result.isValid) {
					file.signatureInfo = result.signatureInfo;
					file.signatureInfo.pagesCount = result.pagesCount;
				} else {
					file.validationResults = result.signingCertificateValidationResults;
				}
				signNextFile();
			}).error(function (e) {
				file.error = e;
				signNextFile();
			});
		} else {
			blockUI.stop();
			$scope.state = 'finished';
			lib.showModal('Message', 'Arquivos assinados com sucesso.');
		}
	};

	var getVisualRepresentationModel = function () {

		var signaturePos;
		if ($scope.positionOption === 'left') {

			signaturePos = {
				left: 2.54,
				bottom: 2.54,
				width: 7,
				height: 3
			};

		} else {

			signaturePos = {
				right: 2.54,
				bottom: 2.54,
				width: 7,
				height: 3
			};

		}

		var model = {

			text: {
				text: 'Autenticado por {{signerName}} ({{signerNationalId}})',
				includeSigningTime: true
			},

			image: {
				resource: {
					url: 'img/pdf-stamp.png'
				},
				opacity: 100
				//horizontalAlign: 'Right'
			},

			position: {
				pageNumber: -1,
				manual: signaturePos,
				measurementUnits: 'centimeters'
			}
		};

		return model;

	};

	var getPdfMarks = function () {

		var textSections = [
			{
				text: 'Autenticado por {{signerName}} ({{signerNationalId}})\n',
				style: 'bold'
			},
			{
				text: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Cras tincidunt ante ornare dolor pellentesque interdum. Maecenas ac pretium nulla, quis dignissim velit. Nulla auctor malesuada sapien eget sollicitudin. Page {{pageNumber}} of {{pagesCount}}.'
			}
		];

		var marks = [];
		if ($scope.markPositions.bottom) {
			marks.push({
				container: {
					left: 1,
					bottom: 0.2,
					right: 1,
					height: 1.5,
				},
				elements: [
					{
						elementType: 'text',
						textSections: textSections
					}
				]
			});
		}

		if ($scope.markPositions.right) {
			marks.push({
				container: {
					bottom: 2,
					right: 0.2,
					top: 2,
					width: 1.5,
				},
				elements: [
					{
						elementType: 'text',
						textSections: textSections,
						rotation: 90
					}
				]
			});
		}

		if ($scope.markPositions.left) {
			marks.push({
				container: {
					bottom: 2,
					left: 0.2,
					top: 2,
					width: 1.5,
				},
				elements: [
					{
						elementType: 'text',
						textSections: textSections,
						rotation: 90
					}
				]
			});
		}
		return marks;
	};

	$scope.openFolder = function (file) {
		console.log('opening folder', file);
		pki.openFolder(file.id);
	};

	$scope.openFile = function (file) {
		console.log('opening file', file);
		pki.openFile(file.id);
	};

	$scope.showDetails = function (file) {
		$modal.open({
			templateUrl: 'templates/signed-file-details.html',
			controller: 'signerDialogController',
			resolve: {
				model: function () { return file; },
				pki: function () { return pki; }
			}
		});
	};
	
	$scope.showValidationResults = function (file) {
		$modal.open({
			templateUrl: 'templates/validation-results.html',
			controller: 'validationResultsDialogController',
			resolve: {
				model: function () { return file.validationResults; }
			},
			size: 'lg'
		});
	};

	$scope.reset = function () {
		$scope.files = [];
		$scope.state = 'input';
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
