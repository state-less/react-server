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
        var scope, key, value, query, retries, result;
        return _regenerator["default"].wrap(function _callee2$(_context2) {
          while (1) switch (_context2.prev = _context2.next) {
            case 0:
              scope = state.scope, key = state.key, value = state.value;
              query = "INSERT INTO states (scope, key, value) VALUES ($1, $2, $3) ON CONFLICT (scope, key) DO UPDATE SET value = $3";
              retries = 0;
              _context2.prev = 3;
              _context2.next = 6;
              return this._db.connect();
            case 6:
              _context2.next = 8;
              return this._db.query(query, [scope, key, {
                value: value
              }]);
            case 8:
              result = _context2.sent;
              return _context2.abrupt("return", result);
            case 12:
              _context2.prev = 12;
              _context2.t0 = _context2["catch"](3);
              if (!(retries < 3)) {
                _context2.next = 19;
                break;
              }
              retries++;
              return _context2.abrupt("return", new Promise(function (resolve) {
                console.error("Error setting state ".concat(key, ". Retrying..."));
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
            case 19:
              throw _context2.t0;
            case 20:
            case "end":
              return _context2.stop();
          }
        }, _callee2, this, [[3, 12]]);
      }));
      function setState(_x) {
        return _setState.apply(this, arguments);
      }
      return setState;
    }()
  }, {
    key: "getState",
    value: function () {
      var _getState = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee4(scope, key) {
        var _this3 = this;
        var query, retries, result;
        return _regenerator["default"].wrap(function _callee4$(_context4) {
          while (1) switch (_context4.prev = _context4.next) {
            case 0:
              query = "SELECT * FROM states WHERE scope = $1 AND key = $2";
              retries = 0;
              _context4.prev = 2;
              _context4.next = 5;
              return this._db.connect();
            case 5:
              _context4.next = 7;
              return this._db.query(query, [scope, key]);
            case 7:
              result = _context4.sent;
              if (!(result.length === 0)) {
                _context4.next = 10;
                break;
              }
              return _context4.abrupt("return", null);
            case 10:
              return _context4.abrupt("return", result[0].value);
            case 13:
              _context4.prev = 13;
              _context4.t0 = _context4["catch"](2);
              if (!(retries < 3)) {
                _context4.next = 20;
                break;
              }
              retries++;
              return _context4.abrupt("return", new Promise(function (resolve) {
                console.error("Error getting state ".concat(key, ". Retrying..."));
                setTimeout( /*#__PURE__*/(0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee3() {
                  return _regenerator["default"].wrap(function _callee3$(_context3) {
                    while (1) switch (_context3.prev = _context3.next) {
                      case 0:
                        _context3.t0 = resolve;
                        _context3.next = 3;
                        return _this3.getState(scope, key);
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
            case 20:
              throw _context4.t0;
            case 21:
            case "end":
              return _context4.stop();
          }
        }, _callee4, this, [[2, 13]]);
      }));
      function getState(_x2, _x3) {
        return _getState.apply(this, arguments);
      }
      return getState;
    }()
  }]);
  return PostgresTransport;
}(Transport);
exports.PostgresTransport = PostgresTransport;