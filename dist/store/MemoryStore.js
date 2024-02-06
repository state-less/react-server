"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Store = exports.State = exports.Query = void 0;
var _toConsumableArray2 = _interopRequireDefault(require("@babel/runtime/helpers/toConsumableArray"));
var _objectWithoutProperties2 = _interopRequireDefault(require("@babel/runtime/helpers/objectWithoutProperties"));
var _taggedTemplateLiteral2 = _interopRequireDefault(require("@babel/runtime/helpers/taggedTemplateLiteral"));
var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));
var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));
var _assertThisInitialized2 = _interopRequireDefault(require("@babel/runtime/helpers/assertThisInitialized"));
var _defineProperty2 = _interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));
var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));
var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));
var _inherits2 = _interopRequireDefault(require("@babel/runtime/helpers/inherits"));
var _possibleConstructorReturn2 = _interopRequireDefault(require("@babel/runtime/helpers/possibleConstructorReturn"));
var _getPrototypeOf2 = _interopRequireDefault(require("@babel/runtime/helpers/getPrototypeOf"));
var _util = require("../lib/util");
var _transport = require("./transport");
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
var Query = /*#__PURE__*/function (_EventEmitter) {
  (0, _inherits2["default"])(Query, _EventEmitter);
  var _super = _createSuper(Query);
  function Query(initialValue, options) {
    var _this;
    (0, _classCallCheck2["default"])(this, Query);
    _this = _super.call(this);
    _this.value = initialValue;
    _this.initialValue = initialValue;
    _this._options = options;
    _this.fetched = false;
    return _this;
  }
  (0, _createClass2["default"])(Query, [{
    key: "getValue",
    value: function getValue() {
      var _this$_store,
        _this$_store$_options,
        _this2 = this;
      var transport = (_this$_store = this._store) === null || _this$_store === void 0 ? void 0 : (_this$_store$_options = _this$_store._options) === null || _this$_store$_options === void 0 ? void 0 : _this$_store$_options.transport;
      if (transport instanceof _transport.PostgresTransport && !this.fetched) {
        transport.queryByOptions(this._options).then(function (query) {
          _this2.value = query === null || query === void 0 ? void 0 : query.map(function (state) {
            return state.value.value;
          });
          _this2.fetched = true;
          _this2.emit('change', _this2.value);
        });
      }
    }
  }, {
    key: "refetch",
    value: function refetch() {
      this.fetched = false;
      this.getValue();
    }
  }]);
  return Query;
}(_events.EventEmitter);
exports.Query = Query;
var State = /*#__PURE__*/function (_EventEmitter2) {
  (0, _inherits2["default"])(State, _EventEmitter2);
  var _super2 = _createSuper(State);
  /**
   * The unique id of the currently authenticated user.
   * */

  /**
   * The unique id of the connected client.
   */

  function State(initialValue, options) {
    var _this3;
    (0, _classCallCheck2["default"])(this, State);
    _this3 = _super2.call(this);
    (0, _defineProperty2["default"])((0, _assertThisInitialized2["default"])(_this3), "toJSON", function () {
      var _assertThisInitialize = (0, _assertThisInitialized2["default"])(_this3),
        scope = _assertThisInitialize.scope,
        key = _assertThisInitialize.key,
        value = _assertThisInitialize.value;
      return {
        scope: scope,
        key: key,
        value: value
      };
    });
    _this3.id = options.id || (0, _util.createId)(options.scope);
    _this3.key = options.key;
    _this3.scope = options.scope;
    _this3.user = options.user;
    _this3.client = options.client;
    _this3.labels = options.labels || [];
    _this3.value = initialValue;
    _this3.initialValue = initialValue;
    _this3.initialValuePublished = false;
    _this3.timestamp = 0;

    // if (this?._store?._options?.transport) {
    //   this._store._options.transport
    //     .getState<T>(options.scope, options.key)
    //     .then((state) => {
    //       this.initialValuePublished = true;
    //       this.value = state.value;
    //       this.publish();
    //     });
    // }
    return _this3;
  }
  (0, _createClass2["default"])(State, [{
    key: "publish",
    value: function publish() {
      this.emit('change', this.value);
    }
  }, {
    key: "setValue",
    value: function () {
      var _setValue = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee(valueAction) {
        var _this$_store2,
          _this$_store2$_option,
          _this4 = this;
        var value;
        return _regenerator["default"].wrap(function _callee$(_context) {
          while (1) switch (_context.prev = _context.next) {
            case 0:
              if (typeof valueAction === 'function') {
                value = valueAction(this.value);
              } else {
                value = valueAction;
              }
              this.value = value;
              if (this !== null && this !== void 0 && (_this$_store2 = this._store) !== null && _this$_store2 !== void 0 && (_this$_store2$_option = _this$_store2._options) !== null && _this$_store2$_option !== void 0 && _this$_store2$_option.transport) {
                this.timestamp = +new Date();
                this._store._options.transport.setState(this).then(function () {
                  _this4.timestamp = +new Date();
                });
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
    value: function getValue() {
      var _this$_store3,
        _this$_store3$_option,
        _this5 = this;
      var timestamp = +new Date();
      if (this !== null && this !== void 0 && (_this$_store3 = this._store) !== null && _this$_store3 !== void 0 && (_this$_store3$_option = _this$_store3._options) !== null && _this$_store3$_option !== void 0 && _this$_store3$_option.transport) {
        this._store._options.transport.getState(this.scope, this.key).then(function (storedState) {
          if (storedState !== null) {
            if (timestamp > _this5.timestamp) {
              if (!_this5.initialValuePublished) {
                _this5.value = storedState.value;
                _this5.initialValuePublished = true;

                // TODO: The client hasn't yet subscribed to component updates when this response is received
                // We need to add a "once" listener to the subscribe event which will trigger the publish
                setTimeout(function () {
                  _this5.publish();
                }, 1000);
              }
            }
          }
        });
      }
      return this.value;
    }
  }]);
  return State;
}(_events.EventEmitter); // ee(State.prototype);
exports.State = State;
var Store = /*#__PURE__*/function (_EventEmitter3) {
  (0, _inherits2["default"])(Store, _EventEmitter3);
  var _super3 = _createSuper(Store);
  function Store(_options) {
    var _this6;
    (0, _classCallCheck2["default"])(this, Store);
    _this6 = _super3.call(this);
    (0, _defineProperty2["default"])((0, _assertThisInitialized2["default"])(_this6), "restore", function () {
      var fn = _path["default"].resolve(_this6._options.file);
      if (_fs["default"].existsSync(fn)) {
        if (_this6._options.logger) {
          _this6._options.logger.info(_templateObject || (_templateObject = (0, _taggedTemplateLiteral2["default"])(["Deserializing store from ", ""])), fn);
        }
        _this6._storing = true;
        var stream = _fs["default"].createReadStream(fn);
        var parseStream = _bigJson["default"].createParseStream();
        parseStream.on('data', function (pojo) {
          _this6.dehydrate(pojo);
        });
        stream.pipe(parseStream);
      }
    });
    (0, _defineProperty2["default"])((0, _assertThisInitialized2["default"])(_this6), "store", function () {
      var fn = _path["default"].resolve(_this6._options.file);
      if (_this6._storing) return;
      _this6._storing = true;
      if (_this6._options.logger) {
        _this6._options.logger.info(_templateObject2 || (_templateObject2 = (0, _taggedTemplateLiteral2["default"])(["Serializing store to ", ""])), fn);
      }
      if (_fs["default"].existsSync(fn)) {
        _fs["default"].copyFileSync(fn, fn + '.bak');
        _fs["default"].unlinkSync(fn);
      }
      var writeStream = _fs["default"].createWriteStream(fn);
      var stream = _this6.serialize();
      stream.pipe(writeStream);
      stream.on('end', function () {
        if (_this6._options.logger) {
          _this6._options.logger.info(_templateObject3 || (_templateObject3 = (0, _taggedTemplateLiteral2["default"])(["Serialized store to ", ""])), fn);
        }
        writeStream.end();
        _this6._storing = false;
      });
      writeStream.on('error', function (err) {
        writeStream.end();
        _this6._storing = false;
      });
    });
    (0, _defineProperty2["default"])((0, _assertThisInitialized2["default"])(_this6), "sync", function () {
      var interval = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 1000 * 60;
      return setInterval(_this6.store, interval);
    });
    (0, _defineProperty2["default"])((0, _assertThisInitialized2["default"])(_this6), "dehydrate", function (obj) {
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
        _this6._states = states;
        if (_this6._options.logger) {
          _this6._options.logger.info(_templateObject4 || (_templateObject4 = (0, _taggedTemplateLiteral2["default"])(["Deserialized store. ", ""])), _this6._states.size);
        }
        _this6.emit('dehydrate');
        _this6._storing = false;
      } catch (e) {
        throw new Error("Invalid JSON");
      }
    });
    (0, _defineProperty2["default"])((0, _assertThisInitialized2["default"])(_this6), "serialize", function () {
      var _assertThisInitialize2 = (0, _assertThisInitialized2["default"])(_this6),
        _ = _assertThisInitialize2._options,
        rest = (0, _objectWithoutProperties2["default"])(_assertThisInitialize2, _excluded);
      var states = (0, _toConsumableArray2["default"])(_this6._states.entries());
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
    (0, _defineProperty2["default"])((0, _assertThisInitialized2["default"])(_this6), "getScope", function (scope) {
      if (_this6._scopes.has(scope)) return _this6._scopes.get(scope);
      _this6._scopes.set(scope, new Map());
      return _this6._scopes.get(scope);
    });
    (0, _defineProperty2["default"])((0, _assertThisInitialized2["default"])(_this6), "deleteState", function (options) {
      var key = options.key,
        scope = options.scope;
      var states = _this6.getScope(scope);
      states["delete"](key);
      _this6._states["delete"](Store.getKey(options));
    });
    // getStatesByUser = (userId: string) => {
    //   if (!this._options.transport) {
    //     this._;
    //   }
    //   return [...this._states.entries()].filter(
    //     ([_, state]) => state.user === userId
    //   );
    // };
    (0, _defineProperty2["default"])((0, _assertThisInitialized2["default"])(_this6), "purgeLabels", function (labels) {
      for (var _i = 0, _arr = (0, _toConsumableArray2["default"])(_this6._states.values()); _i < _arr.length; _i++) {
        var state = _arr[_i];
        if (state.labels.some(function (label) {
          return labels.includes(label);
        })) {
          _this6.deleteState({
            scope: state.scope,
            key: state.key,
            client: state.client,
            user: state.user
          });
        }
      }
    });
    _this6._states = new Map();
    _this6._queries = new Map();
    _this6._scopes = new Map();
    _this6._options = _options;
    _this6._storing = false;
    if (_options.file) {
      _this6.restore();
    }
    return _this6;
  }
  (0, _createClass2["default"])(Store, [{
    key: "hasQuery",
    value: function hasQuery(key) {
      if (typeof key === 'string') {
        return this._queries.has(key);
      } else if ((0, _util.isStateOptions)(key)) {
        return this._queries.has(Store.getKey(key));
      } else {
        return false;
      }
    }
  }, {
    key: "createQuery",
    value: function createQuery(initialValue, options) {
      if (this.hasQuery(options)) {
        return this._queries.get(Store.getKey(options));
      }
      var query = new Query(initialValue, options);
      query._store = this;
      this._queries.set(Store.getKey(options), query);
      return query;
    }
  }, {
    key: "query",
    value: function query(initialValue, options) {
      console.log('QUERYING ', options, this.hasQuery(options));
      if (!this.hasQuery(options)) {
        return this.createQuery(initialValue, options);
      }
      var query = this._queries.get(Store.getKey(options));
      query._store = this;
      return query;
    }
  }, {
    key: "createState",
    value: function createState(value, options) {
      var _this$_options,
        _this7 = this;
      var state = new State(value, _objectSpread({}, options));
      state._store = this;
      if (options !== null && options !== void 0 && options.storeInitialState && this !== null && this !== void 0 && (_this$_options = this._options) !== null && _this$_options !== void 0 && _this$_options.transport) {
        console.log('Storing initial state', options.key);
        this._options.transport.setInitialState(state).then(function () {
          state.emit('stored', state.value);
          _this7.emit("created::".concat(state.key), state.value);
        });
      }
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