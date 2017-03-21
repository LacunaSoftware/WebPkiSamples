app.controller('validationResultsDialogController', ['$scope', '$modalInstance', 'lib', 'model', function ($scope, $modalInstance, lib, model) {

	$scope.model = model;
	$scope.modelString = lib.vrToString(model, '');

	$scope.OKClick = function () {
		$modalInstance.close();
	};
}]);
