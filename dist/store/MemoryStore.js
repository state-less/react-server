"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Store = exports.State = void 0;
var _toConsumableArray2 = _interopRequireDefault(require("@babel/runtime/helpers/toConsumableArray"));
var _objectWithoutProperties2 = _interopRequireDefault(require("@babel/runtime/helpers/objectWithoutProperties"));
var _taggedTemplateLiteral2 = _interopRequireDefault(require("@babel/runtime/helpers/taggedTemplateLiteral"));
var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));
var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));
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
    var _assertThisInitialize2, _assertThisInitialize3, _assertThisInitialize4;
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
    _this.timestamp = 0;
    if ((_assertThisInitialize2 = (0, _assertThisInitialized2["default"])(_this)) !== null && _assertThisInitialize2 !== void 0 && (_assertThisInitialize3 = _assertThisInitialize2._store) !== null && _assertThisInitialize3 !== void 0 && (_assertThisInitialize4 = _assertThisInitialize3._options) !== null && _assertThisInitialize4 !== void 0 && _assertThisInitialize4.transport) {
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
              this.timestamp = +new Date();
              if (this !== null && this !== void 0 && (_this$_store = this._store) !== null && _this$_store !== void 0 && (_this$_store$_options = _this$_store._options) !== null && _this$_store$_options !== void 0 && _this$_store$_options.transport) {
                console.log('!!!!!!!!!!!! Transport exists, calling setState on transport', this.key, this.value);
                this._store._options.transport.setState(this);
                this.publish();
              } else {
                this.publish();
              }
              return _context.abrupt("return", this);
            case 4:
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
      var _getValue = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee2(timestamp) {
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
                if (JSON.stringify(oldValue) !== JSON.stringify(this.value)) {
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
      function getValue(_x2) {
        return _getValue.apply(this, arguments);
      }
      return getValue;
    }()
  }]);
  return State;
}(_events.EventEmitter); // ee(State.prototype);
exports.State = State;
var Store = /*#__PURE__*/function (_EventEmitter2) {
  (0, _inherits2["default"])(Store, _EventEmitter2);
  var _super2 = _createSuper(Store);
  function Store(_options) {
    var _this2;
    (0, _classCallCheck2["default"])(this, Store);
    _this2 = _super2.call(this);
    (0, _defineProperty2["default"])((0, _assertThisInitialized2["default"])(_this2), "restore", function () {
      var fn = _path["default"].resolve(_this2._options.file);
      if (_fs["default"].existsSync(fn)) {
        if (_this2._options.logger) {
          _this2._options.logger.info(_templateObject || (_templateObject = (0, _taggedTemplateLiteral2["default"])(["Deserializing store from ", ""])), fn);
        }
        _this2._storing = true;
        var stream = _fs["default"].createReadStream(fn);
        var parseStream = _bigJson["default"].createParseStream();
        parseStream.on('data', function (pojo) {
          _this2.dehydrate(pojo);
        });
        stream.pipe(parseStream);
      }
    });
    (0, _defineProperty2["default"])((0, _assertThisInitialized2["default"])(_this2), "store", function () {
      var fn = _path["default"].resolve(_this2._options.file);
      if (_this2._storing) return;
      _this2._storing = true;
      if (_this2._options.logger) {
        _this2._options.logger.info(_templateObject2 || (_templateObject2 = (0, _taggedTemplateLiteral2["default"])(["Serializing store to ", ""])), fn);
      }
      if (_fs["default"].existsSync(fn)) {
        _fs["default"].copyFileSync(fn, fn + '.bak');
        _fs["default"].unlinkSync(fn);
      }
      var writeStream = _fs["default"].createWriteStream(fn);
      var stream = _this2.serialize();
      stream.pipe(writeStream);
      stream.on('end', function () {
        if (_this2._options.logger) {
          _this2._options.logger.info(_templateObject3 || (_templateObject3 = (0, _taggedTemplateLiteral2["default"])(["Serialized store to ", ""])), fn);
        }
        writeStream.end();
        _this2._storing = false;
      });
      writeStream.on('error', function (err) {
        writeStream.end();
        _this2._storing = false;
      });
    });
    (0, _defineProperty2["default"])((0, _assertThisInitialized2["default"])(_this2), "sync", function () {
      var interval = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 1000 * 60;
      return setInterval(_this2.store, interval);
    });
    (0, _defineProperty2["default"])((0, _assertThisInitialized2["default"])(_this2), "dehydrate", function (obj) {
      try {
        var _states;
        if (Array.isArray(obj)) {
          _states = obj;
        } else if (obj._states) {
          _states = obj._states;
        }
        // const scopes = new Map(_scopes);

        var states = new Map(_states);
        states.forEach(function (value, key) {
          states.set(key, new State(value.value, value));
        });
        // scopes.forEach((value: any, key) => {
        //   const _states = new Map(value);
        //   _states.forEach((value: any, key) => {
        //     _states.set(key, states.get(key));
        //   });
        //   scopes.set(key, states);
        // });
        // Object.assign(this, { _scopes: scopes, _states: states });
        // this._scopes = scopes as any;
        _this2._states = states;
        if (_this2._options.logger) {
          _this2._options.logger.info(_templateObject4 || (_templateObject4 = (0, _taggedTemplateLiteral2["default"])(["Deserialized store. ", ""])), _this2._states.size);
        }
        _this2.emit('dehydrate');
        _this2._storing = false;
      } catch (e) {
        throw new Error("Invalid JSON");
      }
    });
    (0, _defineProperty2["default"])((0, _assertThisInitialized2["default"])(_this2), "serialize", function () {
      var _assertThisInitialize5 = (0, _assertThisInitialized2["default"])(_this2),
        _ = _assertThisInitialize5._options,
        rest = (0, _objectWithoutProperties2["default"])(_assertThisInitialize5, _excluded);
      var states = (0, _toConsumableArray2["default"])(_this2._states.entries());
      // const scopes = [...this._scopes.entries()].map(([key, value]) => {
      //   return [key, [...value.entries()].map((state) => cloneDeep(state))];
      // });
      var out = {
        _states: states
      };
      return _bigJson["default"].createStringifyStream({
        body: out
      });
    });
    (0, _defineProperty2["default"])((0, _assertThisInitialized2["default"])(_this2), "getScope", function (scope) {
      if (_this2._scopes.has(scope)) return _this2._scopes.get(scope);
      _this2._scopes.set(scope, new Map());
      return _this2._scopes.get(scope);
    });
    (0, _defineProperty2["default"])((0, _assertThisInitialized2["default"])(_this2), "deleteState", function (options) {
      var key = options.key,
        scope = options.scope;
      var states = _this2.getScope(scope);
      states["delete"](key);
      _this2._states["delete"](Store.getKey(options));
    });
    (0, _defineProperty2["default"])((0, _assertThisInitialized2["default"])(_this2), "purgeLabels", function (labels) {
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
    _this2._states = new Map();
    _this2._scopes = new Map();
    _this2._options = _options;
    _this2._storing = false;
    if (_options.file) {
      _this2.restore();
    }
    return _this2;
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
}(_events.EventEmitter);
exports.Store = Store;
(0, _defineProperty2["default"])(Store, "getKey", function (options) {
  return "".concat(options.scope, ":").concat(options.key);
});