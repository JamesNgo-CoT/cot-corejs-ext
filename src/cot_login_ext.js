/* global cot_app cot_login CotSession */

CotSession.prototype.isLoggedIn = ((isLoggedIn) => function (serverCheckCallback) {
	if (typeof serverCheckCallback !== 'function') {
		return isLoggedIn();
	}

	const sid = this.sid || this._cookie('sid');
	if (sid == null) {
		serverCheckCallback(CotSession.LOGIN_CHECK_RESULT_FALSE);
		return;
	}

	let url = `${this.options['ccApiOrigin']}${this.options['ccApiPath']}${this.options['ccApiEndpoint']}`;
	if (url.indexOf('/c3api_auth/v2/AuthService.svc/AuthSet') !== -1) {
		url = `${url}('${sid}')`;
	} else {
		url = `${url}/${sid}`;
	}

	$.get(url).done((data) => {
		const app = data['app'] || '';
		const rsid = data['sid'] || '';
		const error = data['error'] || '';

		if (app === this.options['appName'] && rsid === sid) {
			this._storeLogin(data);
			serverCheckCallback(CotSession.LOGIN_CHECK_RESULT_TRUE);
		} else if (error === 'no_such_session') {
			this.logout();
			serverCheckCallback(CotSession.LOGIN_CHECK_RESULT_FALSE);
		} else {
			serverCheckCallback(CotSession.LOGIN_CHECK_RESULT_INDETERMINATE);
		}
	}).fail(() => {
		serverCheckCallback(CotSession.LOGIN_CHECK_RESULT_INDETERMINATE);
	});
})(CotSession.prototype.isLoggedIn);

CotSession.prototype.login = (() => function (options) {
	options = $.extend({
		username: '',
		password: '',
		success: (() => { }),
		error: (() => { }),
		always: (() => { })
	}, options);

	const payload = {
		app: this.options['appName'],
		user: options['username'],
		pwd: options['password']
	};

	const ajaxSettings = {
		method: 'POST',
		url: `${this.options['ccApiOrigin']}${this.options['ccApiPath']}${this.options['ccApiEndpoint']}`
	};

	if (ajaxSettings['url'].indexOf('/c3api_auth/v2/AuthService.svc/AuthSet') !== -1) {
		ajaxSettings['contentType'] = 'application/json';
		ajaxSettings['data'] = JSON.stringify(payload);
	} else {
		ajaxSettings['data'] = payload;
	}

	$.ajax(ajaxSettings).done((data) => {
		if (data['error']) {
			options['error'](null, data.error === 'invalid_user_or_pwd' ? 'Invalid username or password' : 'Login failed', data.error);
		} else if (data['passwordIsExpired']) {
			options['error'](null, 'Expired password', 'passwordIsExpired');
		} else {
			this._storeLogin(data);
			options['success']();
		}
	}).fail((jqXHR, textStatus, error) => {
		options['error'](jqXHR, textStatus, error);
	}).always(() => {
		options['always']();
	});
})(CotSession.prototype.login);

cot_login.prototype.checkLogin = function (options = {}) {
	if (!options['serverSide']) {
		return Promise.resolve(this.isLoggedIn());
	}

	return new Promise((resolve, reject) => {
		this.isLoggedIn((result) => {
			if (result === CotSession.LOGIN_CHECK_RESULT_INDETERMINATE) {
				reject();
			} else {
				resolve(result === CotSession.LOGIN_CHECK_RESULT_TRUE);
			}
		});
	});
}

cot_login.prototype.isLoggedIn = function (serverCheckCallback) {
	return this.session.isLoggedIn(serverCheckCallback);
};

cot_login.prototype.requireLogin = function (options) {
	return this.checkLogin(options).then((isLoggedIn) => {
		if (isLoggedIn === false) {
			return new Promise((resolve, reject) => {
				this.showLogin($.extend({
					onHidden: () => {
						this.checkLogin(options).then(() => {
							resolve();
						}, () => {
							this.logout();
							reject();
						});
					}
				}, options));
			});
		}
	});
};

cot_login.prototype.showLogin = function (options) {
	this.modal = cot_app.showModal($.extend({
		body: `
			<form>
				<div class="form-group">
					<label for="cot_login_username">Username</label>:
					<input class="form-control" id="cot_login_username">
				</div>
				<div class="form-group">
					<label for="cot_login_password">Password</label>:
					<input class="form-control" type="password" id="cot_login_password">
				</div>
			</form>
		`,
		className: 'cot-login-modal',
		footerButtonsHtml: `
			<button class="btn btn-default btn-cot-login" type="button">Login</button>
			<button class="btn btn-default" type="button" data-dismiss="modal">Cancel</button>
		`,
		originatingElement: $(this.options['welcomeSelector']).find('a.login'),
		title: 'User Login',
		onShown: () => {
			this.modal.find('.btn-cot-login').click(() => {
				this._login();
			});

			this.modal.find('.modal-body input').keydown((event) => {
				if ((event.charCode || event.keyCode || 0) === 13) {
					this._login();
				}
			});
		}
	}, options));
}
