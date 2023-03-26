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
        return console.log('Connected');
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
      var _setState = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee(state) {
        var scope, key, value, query, result;
        return _regenerator["default"].wrap(function _callee$(_context) {
          while (1) switch (_context.prev = _context.next) {
            case 0:
              scope = state.scope, key = state.key, value = state.value;
              query = "INSERT INTO states (scope, key, value) VALUES ($1, $2, $3) ON CONFLICT (scope, key) DO UPDATE SET value = $3";
              _context.next = 4;
              return this._db.query(query, [scope, key, {
                value: value
              }]);
            case 4:
              result = _context.sent;
              console.log('Inserting state ', scope, key, result);
              return _context.abrupt("return", result);
            case 7:
            case "end":
              return _context.stop();
          }
        }, _callee, this);
      }));
      function setState(_x) {
        return _setState.apply(this, arguments);
      }
      return setState;
    }()
  }, {
    key: "getState",
    value: function () {
      var _getState = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee2(scope, key) {
        var query, result;
        return _regenerator["default"].wrap(function _callee2$(_context2) {
          while (1) switch (_context2.prev = _context2.next) {
            case 0:
              query = "SELECT * FROM states WHERE scope = $1 AND key = $2";
              _context2.next = 3;
              return this._db.query(query, [scope, key]);
            case 3:
              result = _context2.sent;
              console.log('Fetching state ', scope, key);
              if (!(result.length === 0)) {
                _context2.next = 7;
                break;
              }
              return _context2.abrupt("return", null);
            case 7:
              return _context2.abrupt("return", result[0].value);
            case 8:
            case "end":
              return _context2.stop();
          }
        }, _callee2, this);
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