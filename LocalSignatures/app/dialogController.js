app.controller('dialogController', ['$scope', '$modalInstance', 'title', 'message', 'okCallback', function ($scope, $modalInstance, title, message, okCallback) {

	$scope.title = title;
	$scope.message = message;

	$scope.OKClick = function () {
		if (okCallback) {
			okCallback($modalInstance);
		} else {
			$modalInstance.close();
		}
	};

}]);
