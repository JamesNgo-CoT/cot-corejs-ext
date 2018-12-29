"use strict";

/* global cot_app cot_login CotSession */
CotSession.prototype.isLoggedIn = function (isLoggedIn) {
  return function (serverCheckCallback) {
    var _this = this;

    if (typeof serverCheckCallback !== 'function') {
      return isLoggedIn();
    }

    var sid = this.sid || this._cookie('sid');

    if (sid == null) {
      serverCheckCallback(CotSession.LOGIN_CHECK_RESULT_FALSE);
      return;
    }

    var url = "".concat(this.options['ccApiOrigin']).concat(this.options['ccApiPath']).concat(this.options['ccApiEndpoint']);

    if (url.indexOf('/c3api_auth/v2/AuthService.svc/AuthSet') !== -1) {
      url = "".concat(url, "('").concat(sid, "')");
    } else {
      url = "".concat(url, "/").concat(sid);
    }

    $.get(url).done(function (data) {
      var app = data['app'] || '';
      var rsid = data['sid'] || '';
      var error = data['error'] || '';

      if (app === _this.options['appName'] && rsid === sid) {
        _this._storeLogin(data);

        serverCheckCallback(CotSession.LOGIN_CHECK_RESULT_TRUE);
      } else if (error === 'no_such_session') {
        _this.logout();

        serverCheckCallback(CotSession.LOGIN_CHECK_RESULT_FALSE);
      } else {
        serverCheckCallback(CotSession.LOGIN_CHECK_RESULT_INDETERMINATE);
      }
    }).fail(function () {
      serverCheckCallback(CotSession.LOGIN_CHECK_RESULT_INDETERMINATE);
    });
  };
}(CotSession.prototype.isLoggedIn);

CotSession.prototype.login = function () {
  return function (options) {
    var _this2 = this;

    options = $.extend({
      username: '',
      password: '',
      success: function success() {},
      error: function error() {},
      always: function always() {}
    }, options);
    var payload = {
      app: this.options['appName'],
      user: options['username'],
      pwd: options['password']
    };
    var ajaxSettings = {
      method: 'POST',
      url: "".concat(this.options['ccApiOrigin']).concat(this.options['ccApiPath']).concat(this.options['ccApiEndpoint'])
    };

    if (ajaxSettings['url'].indexOf('/c3api_auth/v2/AuthService.svc/AuthSet') !== -1) {
      ajaxSettings['contentType'] = 'application/json';
      ajaxSettings['data'] = JSON.stringify(payload);
    } else {
      ajaxSettings['data'] = payload;
    }

    $.ajax(ajaxSettings).done(function (data) {
      if (data['error']) {
        options['error'](null, data.error === 'invalid_user_or_pwd' ? 'Invalid username or password' : 'Login failed', data.error);
      } else if (data['passwordIsExpired']) {
        options['error'](null, 'Expired password', 'passwordIsExpired');
      } else {
        _this2._storeLogin(data);

        options['success']();
      }
    }).fail(function (jqXHR, textStatus, error) {
      options['error'](jqXHR, textStatus, error);
    }).always(function () {
      options['always']();
    });
  };
}(CotSession.prototype.login);

cot_login.prototype.checkLogin = function () {
  var _this3 = this;

  var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

  if (!options['serverSide']) {
    return Promise.resolve(this.isLoggedIn());
  }

  return new Promise(function (resolve, reject) {
    _this3.isLoggedIn(function (result) {
      if (result === CotSession.LOGIN_CHECK_RESULT_INDETERMINATE) {
        reject();
      } else {
        resolve(result === CotSession.LOGIN_CHECK_RESULT_TRUE);
      }
    });
  });
};

cot_login.prototype.isLoggedIn = function (serverCheckCallback) {
  return this.session.isLoggedIn(serverCheckCallback);
};

cot_login.prototype.requireLogin = function (options) {
  var _this4 = this;

  return this.checkLogin(options).then(function (isLoggedIn) {
    if (isLoggedIn === false) {
      return new Promise(function (resolve, reject) {
        _this4.showLogin($.extend({
          onHidden: function onHidden() {
            _this4.checkLogin(options).then(function () {
              resolve();
            }, function () {
              _this4.logout();

              reject();
            });
          }
        }, options));
      });
    }
  });
};

cot_login.prototype.showLogin = function (options) {
  var _this5 = this;

  this.modal = cot_app.showModal($.extend({
    body: "\n\t\t\t<form>\n\t\t\t\t<div class=\"form-group\">\n\t\t\t\t\t<label for=\"cot_login_username\">Username</label>:\n\t\t\t\t\t<input class=\"form-control\" id=\"cot_login_username\">\n\t\t\t\t</div>\n\t\t\t\t<div class=\"form-group\">\n\t\t\t\t\t<label for=\"cot_login_password\">Password</label>:\n\t\t\t\t\t<input class=\"form-control\" type=\"password\" id=\"cot_login_password\">\n\t\t\t\t</div>\n\t\t\t</form>\n\t\t",
    className: 'cot-login-modal',
    footerButtonsHtml: "\n\t\t\t<button class=\"btn btn-default btn-cot-login\" type=\"button\">Login</button>\n\t\t\t<button class=\"btn btn-default\" type=\"button\" data-dismiss=\"modal\">Cancel</button>\n\t\t",
    originatingElement: $(this.options['welcomeSelector']).find('a.login'),
    title: 'User Login',
    onShown: function onShown() {
      _this5.modal.find('.btn-cot-login').click(function () {
        _this5._login();
      });

      _this5.modal.find('.modal-body input').keydown(function (event) {
        if ((event.charCode || event.keyCode || 0) === 13) {
          _this5._login();
        }
      });
    }
  }, options));
};