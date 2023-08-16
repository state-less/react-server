"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Store = exports.State = void 0;
var _slicedToArray2 = _interopRequireDefault(require("@babel/runtime/helpers/slicedToArray"));
var _toConsumableArray2 = _interopRequireDefault(require("@babel/runtime/helpers/toConsumableArray"));
var _objectWithoutProperties2 = _interopRequireDefault(require("@babel/runtime/helpers/objectWithoutProperties"));
var _taggedTemplateLiteral2 = _interopRequireDefault(require("@babel/runtime/helpers/taggedTemplateLiteral"));
var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));
var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));
var _assertThisInitialized2 = _interopRequireDefault(require("@babel/runtime/helpers/assertThisInitialized"));
var _inherits2 = _interopRequireDefault(require("@babel/runtime/helpers/inherits"));
var _possibleConstructorReturn2 = _interopRequireDefault(require("@babel/runtime/helpers/possibleConstructorReturn"));
var _getPrototypeOf2 = _interopRequireDefault(require("@babel/runtime/helpers/getPrototypeOf"));
var _defineProperty2 = _interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));
var _util = require("../lib/util");
var _events = require("events");
var _fs = _interopRequireDefault(require("fs"));
var _path = _interopRequireDefault(require("path"));
var _bigJson = _interopRequireDefault(require("big-json"));
var _excluded = ["_options"];
var _templateObject, _templateObject2, _templateObject3, _templateObject4;
function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); enumerableOnly && (symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; })), keys.push.apply(keys, symbols); } return keys; }
function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = null != arguments[i] ? arguments[i] : {}; i % 2 ? ownKeys(Object(source), !0).forEach(function (key) { (0, _defineProperty2["default"])(target, key, source[key]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)) : ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } return target; }
function _createSuper(Derived) { var hasNativeReflectConstruct = _isNativeReflectConstruct(); return function _createSuperInternal() { var Super = (0, _getPrototypeOf2["default"])(Derived), result; if (hasNativeReflectConstruct) { var NewTarget = (0, _getPrototypeOf2["default"])(this).constructor; result = Reflect.construct(Super, arguments, NewTarget); } else { result = Super.apply(this, arguments); } return (0, _possibleConstructorReturn2["default"])(this, result); }; }
function _isNativeReflectConstruct() { if (typeof Reflect === "undefined" || !Reflect.construct) return false; if (Reflect.construct.sham) return false; if (typeof Proxy === "function") return true; try { Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {})); return true; } catch (e) { return false; } }
var State = /*#__PURE__*/function (_EventEmitter) {
  (0, _inherits2["default"])(State, _EventEmitter);
  var _super = _createSuper(State);
  function State(initialValue, options) {
    var _this;
    (0, _classCallCheck2["default"])(this, State);
    _this = _super.call(this);
    (0, _defineProperty2["default"])((0, _assertThisInitialized2["default"])(_this), "toJSON", function () {
      var _assertThisInitialize = (0, _assertThisInitialized2["default"])(_this),
        scope = _assertThisInitialize.scope,
        key = _assertThisInitialize.key,
        value = _assertThisInitialize.value;
      return {
        scope: scope,
        key: key,
        value: value
      };
    });
    _this.id = options.id || (0, _util.createId)(options.scope);
    _this.key = options.key;
    _this.scope = options.scope;
    _this.labels = options.labels || [];
    _this.value = initialValue;
    return _this;
  }
  (0, _createClass2["default"])(State, [{
    key: "setValue",
    value: function setValue(value) {
      this.value = value;
      this.emit('change', this.value);
    }
  }]);
  return State;
}(_events.EventEmitter); // ee(State.prototype);
exports.State = State;
var Store = /*#__PURE__*/function () {
  function Store(_options) {
    var _this2 = this;
    (0, _classCallCheck2["default"])(this, Store);
    (0, _defineProperty2["default"])(this, "restore", function () {
      var fn = _path["default"].resolve(_this2._options.file);
      if (_fs["default"].existsSync(fn)) {
        if (_this2._options.logger) {
          _this2._options.logger.info(_templateObject || (_templateObject = (0, _taggedTemplateLiteral2["default"])(["Deserializing store from ", ""])), fn);
        }
        var stream = _fs["default"].createReadStream(fn);
        var parseStream = _bigJson["default"].createParseStream();
        stream.pipe(parseStream);
        parseStream.on('data', function (pojo) {
          _this2.deserialize(pojo);
        });
      }
    });
    (0, _defineProperty2["default"])(this, "store", function () {
      var fn = _path["default"].resolve(_this2._options.file);
      if (_this2._options.logger) {
        _this2._options.logger.info(_templateObject2 || (_templateObject2 = (0, _taggedTemplateLiteral2["default"])(["Serializing store to ", ""])), fn);
      }
      if (_fs["default"].existsSync(fn)) {
        _fs["default"].unlinkSync(fn);
      }
      var writeStream = _fs["default"].createWriteStream(fn);
      var stream = _this2.serialize();
      stream.pipe(writeStream);
      stream.on('end', function () {
        if (_this2._options.logger) {
          _this2._options.logger.info(_templateObject3 || (_templateObject3 = (0, _taggedTemplateLiteral2["default"])(["Serialized store to ", ""])), fn);
        }
      });
    });
    (0, _defineProperty2["default"])(this, "sync", function () {
      var interval = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 1000 * 60;
      return setInterval(_this2.store, interval);
    });
    (0, _defineProperty2["default"])(this, "deserialize", function (json) {
      try {
        var obj = JSON.parse(json);
        var _scopes = obj._scopes,
          _states = obj._states;
        var scopes = new Map(_scopes);
        var states = new Map(_states);
        states.forEach(function (value, key) {
          states.set(key, new State(value.value, value));
        });
        scopes.forEach(function (value, key) {
          var _states = new Map(value);
          _states.forEach(function (value, key) {
            _states.set(key, states.get(key));
          });
          scopes.set(key, states);
        });
        Object.assign(_this2, {
          _scopes: scopes,
          _states: states
        });
        if (_this2._options.logger) {
          _this2._options.logger.info(_templateObject4 || (_templateObject4 = (0, _taggedTemplateLiteral2["default"])(["Deserialized store."])));
        }
      } catch (e) {
        throw new Error("Invalid JSON");
      }
    });
    (0, _defineProperty2["default"])(this, "serialize", function () {
      var _ = _this2._options,
        rest = (0, _objectWithoutProperties2["default"])(_this2, _excluded);
      var states = (0, _toConsumableArray2["default"])(_this2._states.entries());
      var scopes = (0, _toConsumableArray2["default"])(_this2._scopes.entries()).map(function (_ref) {
        var _ref2 = (0, _slicedToArray2["default"])(_ref, 2),
          key = _ref2[0],
          value = _ref2[1];
        return [key, (0, _toConsumableArray2["default"])(value.entries())];
      });
      var out = {
        _scopes: scopes,
        _states: states
      };
      return _bigJson["default"].createStringifyStream({
        body: out
      });
    });
    (0, _defineProperty2["default"])(this, "getScope", function (scope) {
      if (_this2._scopes.has(scope)) return _this2._scopes.get(scope);
      _this2._scopes.set(scope, new Map());
      return _this2._scopes.get(scope);
    });
    (0, _defineProperty2["default"])(this, "deleteState", function (options) {
      var key = options.key,
        scope = options.scope;
      var states = _this2.getScope(scope);
      states["delete"](key);
      _this2._states["delete"](Store.getKey(options));
    });
    (0, _defineProperty2["default"])(this, "purgeLabels", function (labels) {
      for (var _i = 0, _arr = (0, _toConsumableArray2["default"])(_this2._states.values()); _i < _arr.length; _i++) {
        var state = _arr[_i];
        if (state.labels.some(function (label) {
          return labels.includes(label);
        })) {
          _this2.deleteState({
            scope: state.scope,
            key: state.key
          });
        }
      }
    });
    this._states = new Map();
    this._scopes = new Map();
    this._options = _options;
    if (_options.file) {
      this.restore();
    }
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