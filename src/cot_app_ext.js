/* global cot_app */

/**
 * Extends render method. Add a tab index to the page title.
 */
cot_app.prototype.render = ((render) => function () {
	render.call(this);
	$('h1', '#app-header').attr('tabindex', 0);
})(cot_app.prototype.render);

/**
 * Extends setTitle method. Updates document title and set focus to the page's
 * title.
 * @argument {string} title Optional. Page title.
 */
cot_app.prototype.setTitle = ((setTitle) => function (title) {
	document.title = title != null ? `${title} - ${this.name}` : this.name;

	setTitle.call(this, title);
	$('h1', '#app-header').focus();
})(cot_app.prototype.setTitle);
