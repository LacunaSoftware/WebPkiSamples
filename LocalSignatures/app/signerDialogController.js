app.controller('signerDialogController', ['$scope', '$modalInstance', 'model', 'pki', function ($scope, $modalInstance, model, pki) {

	$scope.model = model;

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

	$scope.openFile = function (file) {
		pki.openFile(file.id);
	};

	$scope.OKClick = function () {
		$modalInstance.close();
	};

}]);
