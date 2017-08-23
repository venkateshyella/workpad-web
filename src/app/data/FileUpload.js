// FileUpload.js

(function () {

var DL = angular.module("DL");

DL.service('FileUpload', ['$http', '$q',
function ($http, $q)
{
	this.uploadFileToUrl = function(file, uploadUrl, options){
		var _deferred = $q.defer();
		var _config = {
			fileHandleName: 'file'
		};
		var _options = options || {},

			// File handle name to be used in the form data.
			// Defults tp 'file' if no handle name is provided
			_form_file_handle_name = _options.fileHandleName || _config.fileHandleName

			// Additional parameters to send in the form data
			_params = _options.params || []
			;

		var fd = new FormData();
		fd.append(_form_file_handle_name, file);

		angular.forEach(_params, function(param, key) {
			console.log("appending: form["+key+"]: "+param);
			fd.append(key, param);
		});

		$http.post(uploadUrl, fd, {
			transformRequest: angular.identity,
			headers: {'Content-Type': undefined}
		})
		.success(function(){
			_deferred.resolve()
		})
		.error(function(){
			_deferred.reject();
		});

		return _deferred.promise;
	}
}]);

})();
