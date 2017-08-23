/**
 * Created by sudhir on 3/11/15.
 */

;
(function () {
	"use strict";

	angular.module('app.modules')
		.directive("postItem", ['$compile',
			'AppCoreUtilityServices', 'PostService',
			PostDirective])
	;

	function PostDirective($compile
		, AppCoreUtilityServices, PostService) {
		return {
			scope: {
				postModel: "="
			},
			link: {
				post: postLink
			}
		};

		function postLink(scope, elem, attrs, $controller) {
			var userIconUrl = "";
			scope.MU = AppCoreUtilityServices;
			scope.getFromUserIconUrl = function(){
				if(scope.postModel.fromUser){
					userIconUrl = AppCoreUtilityServices.getUserIconImageUrl(scope.postModel.fromUser.id);	
				}	
				  return userIconUrl;
			};

			var postDefinition = PostService.getPostDefinition(scope.postModel);

			AppCoreUtilityServices.getTemplate(postDefinition.templateUrl)
				.then(function (resp) {
					elem.append($compile(resp.data)(scope))
				})
			;
		}
	}

})();