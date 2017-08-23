/**
 * Created by sudhir on 6/10/15.
 */

;
(function () {
	"use strict";

	var DL = angular.module("DL");

	DL.service('FORM_TEMPLATE', ['Session', TemplateSchema]);

	function TemplateSchema(Session) {

		var modelDefinition = {
				config: {
					name: "FormTemplate",
					idAttribute: 'templateId',
					keepChangeHistory: true,
					relations: {
						hasMany: {
							FormField: {
								localField: 'template',
								foreignKey: 'templateId',
								//get: function(FormTemplate, relationDef, formTemplate, orig) {
								//	console.log(relationDef);
								//}
							}
						}
					},
					computed: {
						canEdit: {
							enumerable: true,
							get: function () {
								return this.userId == Session.userId;
							}
						}
					},
					methods: {
						/**
						 * Returns a JSON object with all the data in the template model.
						 * along with all related field data.
						 * @param options Options object
						 *  - options.all Send all the data in the model.
						 *  If this flag is not true, only
						 * @returns {Object}
						 */
						toJSON: function (options) {
							var _options = options || {}
								, self = this
								, thisTemplates = []
								, json = {}
								;
							thisTemplates = _jsonify_templates();
							json = angular.copy(_.pick(self, ['templateId', 'name', 'desc', 'userId']));
							json.template = thisTemplates;

							if (_options.all) {
								json.createDate = self.createDate;
								json.lastModified = self.lastModified;
							}
							return json;

							function _jsonify_templates() {
								var template_copy = [];
								_.forEach(self.template, function (fieldTpl) {
									template_copy.push(fieldTpl.toJSON({filter: 'server'}));
								});
								return template_copy;
							}
						}
					},
					meta: {},
					endpoint: "/user/template",
					customEndpoint: {
						create: '/create.ws',
						update: '/update.ws',
						findAll: '/list.ws',
						find: '/view.ws',
						destroy: '/delete.ws'
					},
					respAdapter: {
						findAll: function (resp) {
							_.forEach(resp.results, function (templateModel) {
								var templateId = templateModel.templateId;
								_.forEach(templateModel.template, function (fieldTpl) {
									fieldTpl.templateId = templateId;
								});
							});
							return resp.results;
						}
					},
					reqAdapter: {
						update: function (req) {
							return _.pick(req.toJSON(),
								['templateId', 'name', 'desc', 'template']);
						}
					}
				}
			}
			, resource = null
			;

		return {
			config: modelDefinition.config,
			initResource: function (newResource) {
				resource = newResource;
			}
		}
	}

})();