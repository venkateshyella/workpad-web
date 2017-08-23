/**
 * Created by sudhir on 14/10/15.
 */

;
(function () {
	"use strict";

	var DL = angular.module("DL");

	DL.service('FORM', ['$q', 'JOB_LIFECYCLE_EVENT','URL', FormSchema]);

	function FormSchema($q, JOB_LIFECYCLE_EVENT, URL) {

		var JOB_LCE_REV = _.invert(JOB_LIFECYCLE_EVENT);

		var modelDefinition = {
				config: {
					name: "Form",
					computed: {
						eventName: {
							enumerable: true,
							get: function () {
								if (this._formType == 'JOB_FORM') {
									return JOB_LCE_REV[this.event];
								}
							}
						},
						_isSubmitted: {
							enumerable: true,
							get: function () {
								return this.isSubmitted == 1;
							}
						}
					},
					methods: {
						/**
						 * Validate all the fields in the form.
						 * @returns {Array} Array of all the fields that failed the their validations
						 *  Along with the corresponding validations result.
						 */
						validate: function () {
							var validations = []
								;
							angular.forEach(this.fields, function (formField) {
								var fieldError = formField.getFormError();
								if (fieldError && fieldError.length > 0) {
									validations.push({
										name: formField.keyName,
										error: fieldError
									})
								}
							});

							return validations;
						},
						_getFormSubmisstionUrl: function (formType) {

							switch (formType) {
								case "TASK_FORM" :
									return URL.TASK_FORM_SUBMIT;
									break;
								case "JOB_FORM" :
									return URL.JOB_FORM_SUBMIT;
									break;
							}

						},
						submit: function submitForm(options) {
							var deferred = $q.defer()
								, _options = options || {}
								, _submitUrl = this._getFormSubmisstionUrl(this._formType)
								;
							var formJSON = this.toJSON({filter: 'submit'});
							Connect.post(_submitUrl, formJSON)
								.then(function (res) {
									deferred[res.isSuccess ? 'resolve' : 'reject'](res);
								})
								.catch(function (err) {
									deferred.reject(err);
								});
							return deferred.promise;
						},
						toJSON: function (options) {
							var _options = options || {}
								, self = this
								, json_filter = resource.meta.json_filter[_options.filter || 'default']
								, formsJSON = []
								, json
								;
							json = angular.copy(
								_.pick(self, json_filter));

							if (json_filter.indexOf('fields') > -1) {
								_.forEach(self.fields, function (formField) {
									formsJSON.push(formField.toJSON(_options));
								});
								json.fields = formsJSON;
							}

							/*
							 TODO (Sudhir) Inform services team the submit request payload should have 'fields' key instead of 'forms'
							 TODO (Sudhir) Remove the following if block.
							 */
							//if(_options.filter == 'submit') {
							//	json.form = angular.copy(formsJSON);
							//	delete json.fields;
							//}
							// ---------------------------------------

							return json;

							//function _prepareFormFieldsJSON() {
							//
							//}
						}
					},
					meta: {
						json_filter: {
							default: ['formId', 'jobId', 'taskId', 'fields'],
							submit: ['formId', 'event', 'jobId', 'taskId', 'fields']
						},
						prepResp_field: function prepResp_field(fieldJSON) {
							for (var i in resp.forms) {

							}
						}
					},
					idAttribute: 'formId',
					endpoint: "/job",
					customEndpoint: {
						create: '/form/create.ws',
						find: '/form/view.ws',
						findAll: '/form/list.ws'
					},
					relations: {
						belongsTo: {
							Job: {
								localField: 'job',
								localKey: 'jobId',
								get: function (Resource, relationDef, instance, origGetter) {
									//Resource === User; // true
									//instance === this; // true
									//relationDef.name; // "user"
									//relationDef.type; // "hasMany"
									//relationDef.relation; // "comment"
									//typeof origGetter; // "function"

									// here, do whatever you want:
									//  - broadcast a message
									//  - change some data
									//  - return some comments instead of using the original getter
									//  - etc

									// if you still just want to use the original getter, do this
									return origGetter();
								}
							},
							Task: {
								localField: 'task',
								localKey: 'taskId'
							}
						},
						hasMany: {
							FormField: {
								localField: 'fields',
								foreignKey: 'formId'
							}
						}
					},
					respAdapter: {
						findAll: function (resp, id, options) {
							resource.meta.paginationMetaData = resp.paginationData;

							resp && resp.fields &&
							_.forEach(resp.fields, function (field) {
								resource.meta.prepResp_field(field);
							});

							return resp.results;
						},
						find: function (resp, id, options) {
							"use strict";
							return resp;
						},
					},
					reqAdapter: {
						find: function (definition, _id, options) {
							var params = {
									id: _id
								}
								, _options = options || {};
							angular.extend(params, _options.params);
							return params;
						}
					},
					
					createForm : function(params){

						var deferred = $q.defer();
						
						Connect.post(URL.JOB_FORM_CREATE,params)
							.then(function (res) {
								deferred.resolve(res);
							}).catch(function (error) {
							deferred.reject(error);
						}).finally(function () {
						});
						
						return deferred.promise;
					
					},
					
					viewForm: function (params) {
						var deferred = $q.defer();
						
						Connect.get(URL.JOB_FORM_VIEW, params)
							.then(function (res) {
								deferred.resolve(res.resp);
							})
							.catch(function (err) {
								deferred.reject(err);
							});

						return deferred.promise;
					},
					
					updateForm : function(params){

						var deferred = $q.defer();
						
						Connect.post(URL.JOB_FORM_UPDATE,params)
							.then(function (res) {
								deferred.resolve(res);
							}).catch(function (error) {
							deferred.reject(error);
						}).finally(function () {
						});
						
						return deferred.promise;
					
					}
				}
			}
			, resource
			;

		return {
			config: modelDefinition.config,
			initResource: function (newResource) {
				resource = newResource;
			}
		}
	}

})();