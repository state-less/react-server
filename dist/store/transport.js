"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Transport = exports.PostgresTransport = void 0;
var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));
var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));
var _inherits2 = _interopRequireDefault(require("@babel/runtime/helpers/inherits"));
var _possibleConstructorReturn2 = _interopRequireDefault(require("@babel/runtime/helpers/possibleConstructorReturn"));
var _getPrototypeOf2 = _interopRequireDefault(require("@babel/runtime/helpers/getPrototypeOf"));
var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));
var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));
var _pgPromise = _interopRequireDefault(require("pg-promise"));
function _createSuper(Derived) { var hasNativeReflectConstruct = _isNativeReflectConstruct(); return function _createSuperInternal() { var Super = (0, _getPrototypeOf2["default"])(Derived), result; if (hasNativeReflectConstruct) { var NewTarget = (0, _getPrototypeOf2["default"])(this).constructor; result = Reflect.construct(Super, arguments, NewTarget); } else { result = Super.apply(this, arguments); } return (0, _possibleConstructorReturn2["default"])(this, result); }; }
function _isNativeReflectConstruct() { if (typeof Reflect === "undefined" || !Reflect.construct) return false; if (Reflect.construct.sham) return false; if (typeof Proxy === "function") return true; try { Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {})); return true; } catch (e) { return false; } }
var Transport = /*#__PURE__*/function () {
  function Transport() {
    (0, _classCallCheck2["default"])(this, Transport);
  }
  (0, _createClass2["default"])(Transport, [{
    key: "setState",
    value: function setState(state) {
      throw new Error('Not implemented');
    }
  }, {
    key: "setInitialState",
    value: function setInitialState(state) {
      throw new Error('Not implemented');
    }
  }, {
    key: "getState",
    value: function getState(scope, key) {
      throw new Error('Not implemented');
    }
  }]);
  return Transport;
}();
exports.Transport = Transport;
var PostgresTransport = /*#__PURE__*/function (_Transport) {
  (0, _inherits2["default"])(PostgresTransport, _Transport);
  var _super = _createSuper(PostgresTransport);
  function PostgresTransport(_ref) {
    var _this;
    var connectionString = _ref.connectionString;
    (0, _classCallCheck2["default"])(this, PostgresTransport);
    _this = _super.call(this);
    if (!connectionString) {
      throw new Error('connectionString is required');
    }
    var db = (0, _pgPromise["default"])({})(connectionString);
    try {
      db.connect().then(function () {
        return console.log('Connected to database.');
      });
    } catch (e) {
      throw new Error('Unable to connect to database');
    }
    _this._db = db;
    return _this;
  }
  (0, _createClass2["default"])(PostgresTransport, [{
    key: "setState",
    value: function () {
      var _setState = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee2(state) {
        var _this2 = this;
        var scope, key, value, id, user, client, query, retries, result;
        return _regenerator["default"].wrap(function _callee2$(_context2) {
          while (1) switch (_context2.prev = _context2.next) {
            case 0:
              scope = state.scope, key = state.key, value = state.value, id = state.id, user = state.user, client = state.client;
              query = "INSERT INTO states (scope, key, uuid, user, client, value) VALUES ($1, $2, $3, $4, $5, $6) ON CONFLICT (scope, key) DO UPDATE SET value = $6";
              retries = 0;
              _context2.prev = 3;
              _context2.next = 6;
              return this._db.query(query, [scope, key, id, user, client, {
                value: value
              }]);
            case 6:
              result = _context2.sent;
              return _context2.abrupt("return", result);
            case 10:
              _context2.prev = 10;
              _context2.t0 = _context2["catch"](3);
              if (!(retries < 3)) {
                _context2.next = 17;
                break;
              }
              retries++;
              return _context2.abrupt("return", new Promise(function (resolve) {
                console.error("Error setting state ".concat(key, ". Retrying...\n").concat(_context2.t0.message));
                setTimeout( /*#__PURE__*/(0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee() {
                  return _regenerator["default"].wrap(function _callee$(_context) {
                    while (1) switch (_context.prev = _context.next) {
                      case 0:
                        _context.t0 = resolve;
                        _context.next = 3;
                        return _this2.setState(state);
                      case 3:
                        _context.t1 = _context.sent;
                        (0, _context.t0)(_context.t1);
                      case 5:
                      case "end":
                        return _context.stop();
                    }
                  }, _callee);
                })), 1000 * 10 * (retries - 1));
              }));
            case 17:
              throw _context2.t0;
            case 18:
            case "end":
              return _context2.stop();
          }
        }, _callee2, this, [[3, 10]]);
      }));
      function setState(_x) {
        return _setState.apply(this, arguments);
      }
      return setState;
    }()
  }, {
    key: "setInitialState",
    value: function () {
      var _setInitialState = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee4(state) {
        var _this3 = this;
        var scope, key, id, user, client, value, query, retries, result;
        return _regenerator["default"].wrap(function _callee4$(_context4) {
          while (1) switch (_context4.prev = _context4.next) {
            case 0:
              scope = state.scope, key = state.key, id = state.id, user = state.user, client = state.client, value = state.value;
              query = "INSERT INTO states (scope, key, uuid, user, client, value) VALUES ($1, $2, $3, $4, $5, $6) ON CONFLICT DO NOTHING";
              retries = 0;
              console.log('SETTING INITIAL STATE', key, value);
              _context4.prev = 4;
              _context4.next = 7;
              return this._db.query(query, [scope, key, id, user, client, {
                value: value
              }]);
            case 7:
              result = _context4.sent;
              return _context4.abrupt("return", result);
            case 11:
              _context4.prev = 11;
              _context4.t0 = _context4["catch"](4);
              console.log('ERROR Setting initial state', _context4.t0);
              if (!(retries < 3)) {
                _context4.next = 19;
                break;
              }
              retries++;
              return _context4.abrupt("return", new Promise(function (resolve) {
                console.error("Error setting state ".concat(key, ". Retrying..."));
                setTimeout( /*#__PURE__*/(0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee3() {
                  return _regenerator["default"].wrap(function _callee3$(_context3) {
                    while (1) switch (_context3.prev = _context3.next) {
                      case 0:
                        _context3.t0 = resolve;
                        _context3.next = 3;
                        return _this3.setState(state);
                      case 3:
                        _context3.t1 = _context3.sent;
                        (0, _context3.t0)(_context3.t1);
                      case 5:
                      case "end":
                        return _context3.stop();
                    }
                  }, _callee3);
                })), 1000 * 10 * (retries - 1));
              }));
            case 19:
              throw _context4.t0;
            case 20:
            case "end":
              return _context4.stop();
          }
        }, _callee4, this, [[4, 11]]);
      }));
      function setInitialState(_x2) {
        return _setInitialState.apply(this, arguments);
      }
      return setInitialState;
    }()
  }, {
    key: "getState",
    value: function () {
      var _getState = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee6(scope, key) {
        var _this4 = this;
        var query, retries, result;
        return _regenerator["default"].wrap(function _callee6$(_context6) {
          while (1) switch (_context6.prev = _context6.next) {
            case 0:
              query = "SELECT * FROM states WHERE scope = $1 AND key = $2";
              retries = 0;
              _context6.prev = 2;
              _context6.next = 5;
              return this._db.query(query, [scope, key]);
            case 5:
              result = _context6.sent;
              if (!(result.length === 0)) {
                _context6.next = 8;
                break;
              }
              return _context6.abrupt("return", null);
            case 8:
              return _context6.abrupt("return", result[0].value);
            case 11:
              _context6.prev = 11;
              _context6.t0 = _context6["catch"](2);
              if (!(retries < 3)) {
                _context6.next = 18;
                break;
              }
              retries++;
              return _context6.abrupt("return", new Promise(function (resolve) {
                console.error("Error getting state ".concat(key, ". Retrying..."));
                setTimeout( /*#__PURE__*/(0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee5() {
                  return _regenerator["default"].wrap(function _callee5$(_context5) {
                    while (1) switch (_context5.prev = _context5.next) {
                      case 0:
                        _context5.t0 = resolve;
                        _context5.next = 3;
                        return _this4.getState(scope, key);
                      case 3:
                        _context5.t1 = _context5.sent;
                        (0, _context5.t0)(_context5.t1);
                      case 5:
                      case "end":
                        return _context5.stop();
                    }
                  }, _callee5);
                })), 1000 * 10 * (retries - 1));
              }));
            case 18:
              throw _context6.t0;
            case 19:
            case "end":
              return _context6.stop();
          }
        }, _callee6, this, [[2, 11]]);
      }));
      function getState(_x3, _x4) {
        return _getState.apply(this, arguments);
      }
      return getState;
    }()
  }, {
    key: "queryByOptions",
    value: function () {
      var _queryByOptions = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee8(stateOptions, retries) {
        var _this5 = this;
        var id, user, key, client, scope, where, query, result;
        return _regenerator["default"].wrap(function _callee8$(_context8) {
          while (1) switch (_context8.prev = _context8.next) {
            case 0:
              id = stateOptions.id, user = stateOptions.user, key = stateOptions.key, client = stateOptions.client, scope = stateOptions.scope;
              where = ['user', 'key', 'client', 'scope', 'id'].filter(function (k) {
                return stateOptions[k];
              }).map(function (k, i) {
                return "".concat(k, " = $").concat(i + 1);
              }).join(' AND ');
              query = "SELECT * FROM states WHERE ".concat(where);
              console.log('QUERY', query);
              _context8.prev = 4;
              _context8.next = 7;
              return this._db.query(query, [user, key, client, scope, id].filter(Boolean));
            case 7:
              result = _context8.sent;
              console.log('RESULT', result);
              return _context8.abrupt("return", result);
            case 12:
              _context8.prev = 12;
              _context8.t0 = _context8["catch"](4);
              if (!(retries < 3)) {
                _context8.next = 18;
                break;
              }
              return _context8.abrupt("return", new Promise(function (resolve) {
                console.error("Error getting states for user ".concat(user, ". Retrying..."));
                setTimeout( /*#__PURE__*/(0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee7() {
                  return _regenerator["default"].wrap(function _callee7$(_context7) {
                    while (1) switch (_context7.prev = _context7.next) {
                      case 0:
                        _context7.t0 = resolve;
                        _context7.next = 3;
                        return _this5.queryByOptions({
                          user: user,
                          key: key,
                          client: client,
                          scope: scope
                        }, retries + 1);
                      case 3:
                        _context7.t1 = _context7.sent;
                        (0, _context7.t0)(_context7.t1);
                      case 5:
                      case "end":
                        return _context7.stop();
                    }
                  }, _callee7);
                })), 1000 * 10 * (retries - 1));
              }));
            case 18:
              throw _context8.t0;
            case 19:
            case "end":
              return _context8.stop();
          }
        }, _callee8, this, [[4, 12]]);
      }));
      function queryByOptions(_x5, _x6) {
        return _queryByOptions.apply(this, arguments);
      }
      return queryByOptions;
    }()
  }]);
  return PostgresTransport;
}(Transport);
exports.PostgresTransport = PostgresTransport;