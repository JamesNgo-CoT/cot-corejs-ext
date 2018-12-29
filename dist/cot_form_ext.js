"use strict";

/* global cot_form CotForm */

/**
 * Extends addforfield method. Includes readOnly option.
 * @argument {object}      fieldDefinition Field form configuration.
 * @argument {htmlElement} fieldContainer  Wrapper element.
 */
cot_form.prototype.addformfield = function (addformfield) {
  return function (fieldDefinition, fieldContainer) {
    addformfield.call(this, fieldDefinition, fieldContainer);

    if (fieldDefinition['readOnly'] === true) {
      $(':input', $(fieldContainer)).prop('readonly', true);
    }
  };
}(cot_form.prototype.addformfield);
/**
 * Extends validatorOptions method. Includes exclude field validation.
 * @argument {object} fieldDefinition Field form configuration.
 * @returns {object} formvalidation.io options.
 */


cot_form.prototype.validatorOptions = function (validatorOptions) {
  return function (fieldDefinition) {
    var retVal = validatorOptions.call(this, fieldDefinition);

    if (fieldDefinition.excluded != null) {
      retVal.excluded = fieldDefinition.excluded;
    }

    return retVal;
  };
}(cot_form.prototype.validatorOptions);
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


CotForm.prototype.render = function (render) {
  return function () {
    var _this = this;

    var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

    if (options.model != null) {
      this.setModel(options.model);
    }

    if (options.view != null) {
      this.setView(options.view);
    }

    var preRenderPromises = [];
    var sections = this._definition.sections;

    for (var sectionIndex = 0, sectionsLength = sections.length; sectionIndex < sectionsLength; sectionIndex++) {
      var section = sections[sectionIndex];

      if (typeof section.preRender === 'string') {
        section.preRender = Function("return ".concat(section.preRender))();
      }

      if (typeof section.preRender === 'function') {
        preRenderPromises.push(section.preRender(section, this._definition, this._model, this._view));
      }

      var rows = section.rows;

      for (var rowIndex = 0, rowsLength = rows.length; rowIndex < rowsLength; rowIndex++) {
        var row = rows[rowIndex];

        if (typeof row.preRender === 'string') {
          row.preRender = Function("return ".concat(row.preRender))();
        }

        if (typeof row.preRender === 'function') {
          preRenderPromises.push(row.preRender(row, section, this._definition, this._model, this._view));
        }

        var fields = row.fields;

        for (var fieldIndex = 0, fieldsLength = fields.length; fieldIndex < fieldsLength; fieldIndex++) {
          var field = fields[fieldIndex];

          if (field.choices != null && field.bindTo != null && field.type != 'checkbox') {
            var value = this._model.get(field.bindTo);

            if (value != null) {
              if (field.choices.map(function (item) {
                return item.value || item.text;
              }).indexOf(value) === -1) {
                field.choices.unshift({
                  text: value
                });
              }
            }
          }

          if (typeof field.preRender === 'string') {
            field.preRender = Function("return ".concat(field.preRender))();
          }

          if (typeof field.preRender === 'function') {
            preRenderPromises.push(field.preRender(field, row, section, this._definition, this._model, this._view));
          }
        }
      }
    }

    return Promise.all(preRenderPromises).then(function () {
      return render.call(_this, options);
    }).then(function () {
      var postRenderPromises = [];
      var sections = _this._definition.sections;

      for (var _sectionIndex = 0, _sectionsLength = sections.length; _sectionIndex < _sectionsLength; _sectionIndex++) {
        var _section = sections[_sectionIndex];

        if (typeof _section.preRender === 'string') {
          _section.preRender = Function("return ".concat(_section.preRender))();
        }

        if (typeof _section.preRender === 'function') {
          postRenderPromises.push(_section.preRender(_section, _this._definition, _this._model, _this._view));
        }

        var _rows = _section.rows;

        for (var _rowIndex = 0, _rowsLength = _rows.length; _rowIndex < _rowsLength; _rowIndex++) {
          var _row = _rows[_rowIndex];

          if (typeof _row.preRender === 'string') {
            _row.preRender = Function("return ".concat(_row.preRender))();
          }

          if (typeof _row.preRender === 'function') {
            postRenderPromises.push(_row.preRender(_row, _section, _this._definition, _this._model, _this._view));
          }

          var _fields = _row.fields;

          for (var _fieldIndex = 0, _fieldsLength = _fields.length; _fieldIndex < _fieldsLength; _fieldIndex++) {
            var _field = _fields[_fieldIndex];

            if (typeof _field.preRender === 'string') {
              _field.preRender = Function("return ".concat(_field.preRender))();
            }

            if (typeof _field.preRender === 'function') {
              postRenderPromises.push(_field.preRender(_field, _row, _section, _this._definition, _this._model, _this._view));
            }
          }
        }
      }

      return Promise.all(postRenderPromises);
    });
  };
}(CotForm.prototype.render);
/**
 * New method. Sets the form's "parent" view. Mainly used by the preRender and
 * postRender configuration options.
 * @argument {Backbone.View} view Backbone View rendering the CoT Form.
 */


CotForm.prototype.setView = function (view) {
  this._view = view;
};