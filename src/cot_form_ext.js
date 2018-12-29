/* global cot_form CotForm */

/**
 * Extends addforfield method. Includes readOnly option.
 * @argument {object}      fieldDefinition Field form configuration.
 * @argument {htmlElement} fieldContainer  Wrapper element.
 */
cot_form.prototype.addformfield = ((addformfield) => function (fieldDefinition, fieldContainer) {
	addformfield.call(this, fieldDefinition, fieldContainer);

	if (fieldDefinition['readOnly'] === true) {
		$(':input', $(fieldContainer)).prop('readonly', true);
	}
})(cot_form.prototype.addformfield);

/**
 * Extends validatorOptions method. Includes exclude field validation.
 * @argument {object} fieldDefinition Field form configuration.
 * @returns {object} formvalidation.io options.
 */
cot_form.prototype.validatorOptions = ((validatorOptions) => function (fieldDefinition) {
	const retVal = validatorOptions.call(this, fieldDefinition);

	if (fieldDefinition.excluded != null) {
		retVal.excluded = fieldDefinition.excluded;
	}

	return retVal;
})(cot_form.prototype.validatorOptions);

/**
 * Extends render method. Executes the new preRender options before the original
 * render method. Add backbone model value if its not present in the choices
 * option. And executes the new postRender options before resolving the returned
 * Promise. Additional options argument is also added to set model and view
 * along with the render call.
 * @argument {string|object}  options                        Form render options. When string type, this behaves like options.target.
 * @argument {object}         options.formValidationSettings Optional. Form validation options.
 * @argument {Backbone.Model} option.model                   Optional. Allows setModel while rendering.
 * @argument {Backbone.View}  option.view                    Optional. Allows setView while rendering.
 * @argument {string}         options.target                 CSS selector pointing to the forms container/wrapper.
 * @return {Promise}
 */
CotForm.prototype.render = ((render) => function (options = {}) {
	if (options.model != null) {
		this.setModel(options.model);
	}

	if (options.view != null) {
		this.setView(options.view)
	}

	const preRenderPromises = [];

	const sections = this._definition.sections;
	for (let sectionIndex = 0, sectionsLength = sections.length; sectionIndex < sectionsLength; sectionIndex++) {
		const section = sections[sectionIndex];

		if (typeof section.preRender === 'string') {
			section.preRender = Function(`return ${section.preRender}`)();
		}

		if (typeof section.preRender === 'function') {
			preRenderPromises.push(section.preRender(section, this._definition, this._model, this._view));
		}

		const rows = section.rows;
		for (let rowIndex = 0, rowsLength = rows.length; rowIndex < rowsLength; rowIndex++) {
			const row = rows[rowIndex];

			if (typeof row.preRender === 'string') {
				row.preRender = Function(`return ${row.preRender}`)();
			}

			if (typeof row.preRender === 'function') {
				preRenderPromises.push(row.preRender(row, section, this._definition, this._model, this._view));
			}

			const fields = row.fields;
			for (let fieldIndex = 0, fieldsLength = fields.length; fieldIndex < fieldsLength; fieldIndex++) {
				const field = fields[fieldIndex];

				if (field.choices != null && field.bindTo != null && field.type != 'checkbox') {
					const value = this._model.get(field.bindTo);
					if (value != null) {
						if (field.choices.map((item) => item.value || item.text).indexOf(value) === -1) {
							field.choices.unshift({ text: value });
						}
					}
				}

				if (typeof field.preRender === 'string') {
					field.preRender = Function(`return ${field.preRender}`)();
				}

				if (typeof field.preRender === 'function') {
					preRenderPromises.push(field.preRender(field, row, section, this._definition, this._model, this._view));
				}
			}
		}
	}

	return Promise.all(preRenderPromises).then(() => {
		return render.call(this, options);
	}).then(() => {
		const postRenderPromises = [];

		const sections = this._definition.sections;
		for (let sectionIndex = 0, sectionsLength = sections.length; sectionIndex < sectionsLength; sectionIndex++) {
			const section = sections[sectionIndex];

			if (typeof section.preRender === 'string') {
				section.preRender = Function(`return ${section.preRender}`)();
			}

			if (typeof section.preRender === 'function') {
				postRenderPromises.push(section.preRender(section, this._definition, this._model, this._view));
			}

			const rows = section.rows;
			for (let rowIndex = 0, rowsLength = rows.length; rowIndex < rowsLength; rowIndex++) {
				const row = rows[rowIndex];

				if (typeof row.preRender === 'string') {
					row.preRender = Function(`return ${row.preRender}`)();
				}

				if (typeof row.preRender === 'function') {
					postRenderPromises.push(row.preRender(row, section, this._definition, this._model, this._view));
				}

				const fields = row.fields;
				for (let fieldIndex = 0, fieldsLength = fields.length; fieldIndex < fieldsLength; fieldIndex++) {
					const field = fields[fieldIndex];

					if (typeof field.preRender === 'string') {
						field.preRender = Function(`return ${field.preRender}`)();
					}

					if (typeof field.preRender === 'function') {
						postRenderPromises.push(field.preRender(field, row, section, this._definition, this._model, this._view));
					}
				}
			}
		}

		return Promise.all(postRenderPromises);
	});
})(CotForm.prototype.render);

/**
 * New method. Sets the form's "parent" view. Mainly used by the preRender and
 * postRender configuration options.
 * @argument {Backbone.View} view Backbone View rendering the CoT Form.
 */
CotForm.prototype.setView = function (view) {
	this._view = view;
}
