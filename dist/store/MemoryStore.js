"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Store = exports.State = void 0;
var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));
var _defineProperty2 = _interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));
var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));
var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));
var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));
var _assertThisInitialized2 = _interopRequireDefault(require("@babel/runtime/helpers/assertThisInitialized"));
var _inherits2 = _interopRequireDefault(require("@babel/runtime/helpers/inherits"));
var _possibleConstructorReturn2 = _interopRequireDefault(require("@babel/runtime/helpers/possibleConstructorReturn"));
var _getPrototypeOf2 = _interopRequireDefault(require("@babel/runtime/helpers/getPrototypeOf"));
var _util = require("../lib/util");
var _eventEmitter = _interopRequireDefault(require("event-emitter"));
var _events = require("events");
function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); enumerableOnly && (symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; })), keys.push.apply(keys, symbols); } return keys; }
function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = null != arguments[i] ? arguments[i] : {}; i % 2 ? ownKeys(Object(source), !0).forEach(function (key) { (0, _defineProperty2["default"])(target, key, source[key]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)) : ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } return target; }
function _createSuper(Derived) { var hasNativeReflectConstruct = _isNativeReflectConstruct(); return function _createSuperInternal() { var Super = (0, _getPrototypeOf2["default"])(Derived), result; if (hasNativeReflectConstruct) { var NewTarget = (0, _getPrototypeOf2["default"])(this).constructor; result = Reflect.construct(Super, arguments, NewTarget); } else { result = Super.apply(this, arguments); } return (0, _possibleConstructorReturn2["default"])(this, result); }; }
function _isNativeReflectConstruct() { if (typeof Reflect === "undefined" || !Reflect.construct) return false; if (Reflect.construct.sham) return false; if (typeof Proxy === "function") return true; try { Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {})); return true; } catch (e) { return false; } }
var State = /*#__PURE__*/function (_EventEmitter) {
  (0, _inherits2["default"])(State, _EventEmitter);
  var _super = _createSuper(State);
  function State(initialValue, options) {
    var _assertThisInitialize, _assertThisInitialize2, _assertThisInitialize3;
    var _this;
    (0, _classCallCheck2["default"])(this, State);
    _this = _super.call(this);
    _this.id = (0, _util.createId)(options.scope);
    _this.key = options.key;
    _this.scope = options.scope;
    _this.value = initialValue;
    if ((_assertThisInitialize = (0, _assertThisInitialized2["default"])(_this)) !== null && _assertThisInitialize !== void 0 && (_assertThisInitialize2 = _assertThisInitialize._store) !== null && _assertThisInitialize2 !== void 0 && (_assertThisInitialize3 = _assertThisInitialize2._options) !== null && _assertThisInitialize3 !== void 0 && _assertThisInitialize3.transport) {
      _this._store._options.transport.getState(options.scope, options.key).then(function (state) {
        _this.value = state.value;
        _this.publish();
      });
    }
    return _this;
  }
  (0, _createClass2["default"])(State, [{
    key: "publish",
    value: function publish() {
      this.emit('change', this.value);
    }
  }, {
    key: "setValue",
    value: function () {
      var _setValue = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee(value) {
        var _this$_store, _this$_store$_options;
        return _regenerator["default"].wrap(function _callee$(_context) {
          while (1) switch (_context.prev = _context.next) {
            case 0:
              this.value = value;
              this.publish();
              if (!(this !== null && this !== void 0 && (_this$_store = this._store) !== null && _this$_store !== void 0 && (_this$_store$_options = _this$_store._options) !== null && _this$_store$_options !== void 0 && _this$_store$_options.transport)) {
                _context.next = 8;
                break;
              }
              console.log('Transport exists, calling setState on transport');
              _context.next = 6;
              return this._store._options.transport.setState(this);
            case 6:
              _context.next = 9;
              break;
            case 8:
              console.log("Transport doesn't exist.");
            case 9:
              return _context.abrupt("return", this);
            case 10:
            case "end":
              return _context.stop();
          }
        }, _callee, this);
      }));
      function setValue(_x) {
        return _setValue.apply(this, arguments);
      }
      return setValue;
    }()
  }, {
    key: "getValue",
    value: function () {
      var _getValue = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee2() {
        var _this$_store2, _this$_store2$_option;
        var storedState, oldValue;
        return _regenerator["default"].wrap(function _callee2$(_context2) {
          while (1) switch (_context2.prev = _context2.next) {
            case 0:
              if (!(this !== null && this !== void 0 && (_this$_store2 = this._store) !== null && _this$_store2 !== void 0 && (_this$_store2$_option = _this$_store2._options) !== null && _this$_store2$_option !== void 0 && _this$_store2$_option.transport)) {
                _context2.next = 5;
                break;
              }
              _context2.next = 3;
              return this._store._options.transport.getState(this.scope, this.key);
            case 3:
              storedState = _context2.sent;
              if (storedState !== null) {
                oldValue = this.value;
                this.value = storedState.value;
                if (oldValue !== this.value) {
                  this.publish();
                }
              }
            case 5:
              return _context2.abrupt("return", this.value);
            case 6:
            case "end":
              return _context2.stop();
          }
        }, _callee2, this);
      }));
      function getValue() {
        return _getValue.apply(this, arguments);
      }
      return getValue;
    }()
  }]);
  return State;
}(_events.EventEmitter);
exports.State = State;
(0, _eventEmitter["default"])(State.prototype);
var Store = /*#__PURE__*/function () {
  function Store(options) {
    var _this2 = this;
    (0, _classCallCheck2["default"])(this, Store);
    (0, _defineProperty2["default"])(this, "getScope", function (scope) {
      if (_this2._scopes.has(scope)) return _this2._scopes.get(scope);
      _this2._scopes.set(scope, new Map());
      return _this2._scopes.get(scope);
    });
    this._states = new Map();
    this._scopes = new Map();
    this._options = options;
  }
  (0, _createClass2["default"])(Store, [{
    key: "createState",
    value: function createState(value, options) {
      var state = new State(value, _objectSpread({}, options));
      state._store = this;
      var states = this.getScope(options.scope);
      states.set(options.key, state);
      this._states.set(Store.getKey(options), state);
      return state;
    }
  }, {
    key: "hasState",
    value: function hasState(key) {
      if (typeof key === 'string') {
        return this._states.has(key);
      } else if ((0, _util.isStateOptions)(key)) {
        return this._states.has(Store.getKey(key));
      } else {
        return false;
      }
    }
  }, {
    key: "getState",
    value: function getState(initialValue, options) {
      var key = options.key;
      if (!this.hasState(Store.getKey(options))) return this.createState(initialValue, options);
      return this._states.get(Store.getKey(options));
    }
  }]);
  return Store;
}();
exports.Store = Store;
(0, _defineProperty2["default"])(Store, "getKey", function (options) {
  return "".concat(options.scope, ":").concat(options.key);
});