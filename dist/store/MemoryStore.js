"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Store = exports.State = void 0;
var _defineProperty2 = _interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));
var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));
var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));
var _util = require("../lib/util");
function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); enumerableOnly && (symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; })), keys.push.apply(keys, symbols); } return keys; }
function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = null != arguments[i] ? arguments[i] : {}; i % 2 ? ownKeys(Object(source), !0).forEach(function (key) { (0, _defineProperty2["default"])(target, key, source[key]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)) : ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } return target; }
var State = /*#__PURE__*/(0, _createClass2["default"])(function State(initialValue, options) {
  (0, _classCallCheck2["default"])(this, State);
  this.id = (0, _util.createId)(options.scope);
  this.key = options.key;
  this.scope = options.scope;
  this.value = initialValue;
});
exports.State = State;
var Store = /*#__PURE__*/function () {
  function Store(options) {
    var _this = this;
    (0, _classCallCheck2["default"])(this, Store);
    (0, _defineProperty2["default"])(this, "getScope", function (scope) {
      if (_this._scopes.has(scope)) return _this._scopes.get(scope);
      _this._scopes.set(scope, new Map());
      return _this._scopes.get(scope);
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