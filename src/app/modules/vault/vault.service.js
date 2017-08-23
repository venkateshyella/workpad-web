/**
 * Created by sudhir on 15/7/15.
 */

;
(function () {
	"use strict";

	angular.module('app.services')
		.service('VaultServices', [
			'$q', '$timeout', 'Connect', 'Session', 'DataProvider',
			'CATEGORY_TYPE', 'URL',
			VaultServices])
	;

	function VaultServices($q, $timeout, Connect, Session, DataProvider
		, CATEGORY_TYPE, URL) {

		return {
			FetchOrgVaultFiles: FetchOrgVaultFiles,
			FetchGroupVaultFiles: FetchGroupVaultFiles,
			FetchJobVaultFiles: FetchJobVaultFiles,
			FetchTaskVaultFiles: FetchTaskVaultFiles,
			Inject: Inject,
			updateFiles: updateFiles,
			copyFiles: copyFiles,
			downloadFiles: downloadFiles,
			fileViewExternal: fileViewExternal,
			prepCopyDestinationResults: prepCopyDestinationResults
		};

		function fileViewExternal(fileId) {
			var url = URL.ORG_FILE_DOWNLOAD
					+ ';' + $.param({
						jsessionid: Session.id
					})
					+ '?' + $.param({
						userSessionId: Session.id,
						id: fileId
					})
				, target = '_system'
				;
			console.log('Opening external:', url);
			var ref = window.open(url, target);
		}

		function prepCopyDestinationResults(results) {
			var orgs = results.organization && [results.organization] || []
				, groups = results.groups
				, jobs = results.jobs
				, tasks = results.tasks
				;

			_.each(orgs, function (org) {
				org.name = org.orgName;
				org.type = 'org';
				org.catType = CATEGORY_TYPE.ORG;
			});

			_.each(groups, function (group) {
				group.name = group.groupName;
				group.type = "group";
				group.catType = CATEGORY_TYPE.GROUP;
			});

			_.each(jobs, function (job) {
				job.name = job.jobName;
				job.type = 'job';
				job.catType = CATEGORY_TYPE.JOB;
			});

			_.each(tasks, function (task) {
				task.name = task.title;
				task.type = 'tasks';
				task.catType = CATEGORY_TYPE.TASK;
			});

			return [].concat(orgs, groups, jobs, tasks);
		}

		function copyFiles(fileList, sourceParams, destinationParams, options) {
			var url = options.url
				, params = {
					source: sourceParams,
					destination: destinationParams,
					files: _.map(fileList, function (item) {
						return {
							'id': item.id
						}
					})
				}
				, deferred = $q.defer()
				;
			if (fileList && fileList.length > 0) {
				Connect.post(url, params)
					.then(function (resp) {
						deferred.resolve(resp);
					})
					.catch(function (err) {
						deferred.reject(err);
					})
				;
			} else {
				deferred.reject({
					respMsg: "Please select at-least one file to copy."
				});
			}

			return deferred.promise;

		}

		function FetchJobVaultFiles(jobId, params, options) {
			var params = params || {}
				, url = URL.JOB_VAULT_FILE_LIST
				, options = options || {}
				;

			options.url = url;
			options.bypassCache = true;
			return DataProvider.resource.File.findAll({
					folderId: params.folderId,
					jobId: jobId,
					pageNumber : params.pageNumber,
					pageSize: params.pageSize
				}, options)
				.then(function (files) {
					_.each(files, function (file) {
						file.jobId = jobId
					});
					return files;
				});
		}

		function FetchTaskVaultFiles(taskId, params, options) {
			var params = params || {}
				, url = URL.TASK_VAULT_FILE_LIST
				, options = options || {}
				;

			options.url = url;
			options.bypassCache = true;
			return DataProvider.resource.File.findAll({
					folderId: params.folderId,
					taskId: taskId,
					pageNumber : params.pageNumber,
					pageSize: params.pageSize
				}, options)
				.then(function (files) {
					_.each(files, function (file) {
						file.taskId = taskId
					});
					return files;
				});
		}

		function FetchOrgVaultFiles(orgId, options) {
			var url = URL.ORG_VAULT_FILE_LIST
				, options = options || {}
				;

			options.url = url;
			options.bypassCache = true;
			return DataProvider.resource.File.findAll({
					orgId: orgId,
					pageSize: 100
				}, options)
				.then(function (files) {
					_.each(files, function (file) {
						file.orgId = orgId
					});
					return files;
				});
		}

		function FetchGroupVaultFiles(orgId, groupId, options) {
			var params = {}
				, url = URL.GROUP_VAULT_FILE_LIST
				, options = options || {}
				;

			options.url = url;
			options.bypassCache = true;
			return DataProvider.resource.File.findAll({
					groupId: groupId,
					pageSize: 100
				}, options)
				.then(function (files) {
					_.each(files, function (file) {
						file.groupId = groupId
					});
					return files;
				});
		}

		function Inject(file) {
			if (angular.isObject(file) || angular.isArray(file))
				return DataProvider.resource.File.inject(file);
		}

		function updateFiles(fileArray, opts) {
			var options = _opts || {};
			var updateList;

			if (options.updateProperties) {
				updateList = _.map(fileArray, function (file) {
					var props = {};
					_.each(options.updateProperties, function (keyName) {
						if (angular.isDefined(file[keyName])) {
							props[keyName] = file[keyName];
						}
					});
					return props;
				})
			}
		}

		function downloadFiles(fileArray, opts) {
			var deferred = $q.defer();

			angular.forEach(fileArray, function (file) {
				fileViewExternal(file.id);
			});
			$timeout(function () {
				deferred.resolve();
			}, 1000);

			return deferred.promise;
		}

	}

})();