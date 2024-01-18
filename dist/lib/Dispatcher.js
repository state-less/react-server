"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getRuntimeScope = exports["default"] = exports.createContext = void 0;
var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));
var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));
var _defineProperty2 = _interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));
var _internals = require("./internals");
var _reactServer = require("./reactServer");
var _scopes = require("./scopes");
var _types = require("./types");
var _util = require("./util");
function _createForOfIteratorHelper(o, allowArrayLike) { var it = typeof Symbol !== "undefined" && o[Symbol.iterator] || o["@@iterator"]; if (!it) { if (Array.isArray(o) || (it = _unsupportedIterableToArray(o)) || allowArrayLike && o && typeof o.length === "number") { if (it) o = it; var i = 0; var F = function F() {}; return { s: F, n: function n() { if (i >= o.length) return { done: true }; return { done: false, value: o[i++] }; }, e: function e(_e) { throw _e; }, f: F }; } throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); } var normalCompletion = true, didErr = false, err; return { s: function s() { it = it.call(o); }, n: function n() { var step = it.next(); normalCompletion = step.done; return step; }, e: function e(_e2) { didErr = true; err = _e2; }, f: function f() { try { if (!normalCompletion && it["return"] != null) it["return"](); } finally { if (didErr) throw err; } } }; }
function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }
function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) arr2[i] = arr[i]; return arr2; }
function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); enumerableOnly && (symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; })), keys.push.apply(keys, symbols); } return keys; }
function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = null != arguments[i] ? arguments[i] : {}; i % 2 ? ownKeys(Object(source), !0).forEach(function (key) { (0, _defineProperty2["default"])(target, key, source[key]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)) : ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } return target; }
var createContext = function createContext() {
  var context = {
    current: null
  };
  return {
    context: context,
    Provider: function Provider(props) {
      (0, _reactServer.useEffect)(function () {
        context.current = props.value;
      }, [props.value]);
      return {
        context: context,
        children: props.children
      };
    }
  };
};
exports.createContext = createContext;
var getRuntimeScope = function getRuntimeScope(scope, context) {
  return scope.replace(_scopes.Scopes.Client, (0, _types.isClientContext)(context) ? context === null || context === void 0 ? void 0 : context.headers['x-unique-id'] : 'server');
  // return scope === Scopes.Client
  //   ? isClientContext(context)
  //     ? context?.headers['x-unique-id']
  //     : 'server'
  //   : scope;
};
exports.getRuntimeScope = getRuntimeScope;
var Listeners = {};
var recordedStates = [];
var lastDeps = {};
var usedStates = {};
var cleanupFns = {};
var Dispatcher = /*#__PURE__*/function () {
  function Dispatcher() {
    var _this = this;
    (0, _classCallCheck2["default"])(this, Dispatcher);
    (0, _defineProperty2["default"])(this, "setPubSub", function (pubsub) {
      _this._pubsub = pubsub;
    });
    (0, _defineProperty2["default"])(this, "setClientContext", function (context) {
      _this._renderOptions = context;
    });
    (0, _defineProperty2["default"])(this, "getCleanupFns", function (key) {
      return cleanupFns[key] || [];
    });
    (0, _defineProperty2["default"])(this, "addCurrentComponent", function (component) {
      _this._currentComponent.push(component);
      _this._currentClientEffect = 0;
    });
    (0, _defineProperty2["default"])(this, "popCurrentComponent", function () {
      _this._currentComponent.pop();
    });
    (0, _defineProperty2["default"])(this, "useContext", function (context) {
      var _currentComponent = _this._currentComponent.at(-1);
      if (!_currentComponent) {
        throw new Error('Nothing rendered yet');
      }
      var parent = _currentComponent;
      do {
        parent = _this.getParentNode(parent.key);
        if ((0, _types.isProvider)(parent)) {
          if (parent.context === context.context) {
            return parent.context.current;
          }
        }
      } while (parent);
      return null;
    });
    (0, _defineProperty2["default"])(this, "destroy", function (component) {
      var _currentComponent = component || _this._currentComponent.at(-1);
      _this.store.purgeLabels(_currentComponent.key);
    });
    this._currentComponent = [];
    this._parentLookup = new Map();
  }
  (0, _createClass2["default"])(Dispatcher, [{
    key: "setStore",
    value: function setStore(store) {
      this.store = store;
    }
  }, {
    key: "setRootComponent",
    value: function setRootComponent(component) {
      Dispatcher._tree = component;
    }
  }, {
    key: "setParentNode",
    value: function setParentNode(key, component) {
      this._parentLookup.set(key, component);
    }
  }, {
    key: "getParentNode",
    value: function getParentNode(key) {
      return this._parentLookup.get(key);
    }
  }, {
    key: "getStore",
    value: function getStore() {
      return this.store;
    }
  }, {
    key: "useState",
    value: function useState(initialValue, options) {
      var _this2 = this;
      var _currentComponent = this._currentComponent.at(-1);
      var renderOptions = this._renderOptions;
      var scope = getRuntimeScope(options.scope, renderOptions.context);
      var state = this.store.getState(initialValue, _objectSpread(_objectSpread({}, options), {}, {
        scope: scope
      }));
      var _iterator = _createForOfIteratorHelper(this._currentComponent),
        _step;
      try {
        for (_iterator.s(); !(_step = _iterator.n()).done;) {
          var comp = _step.value;
          if (!state.labels.includes(comp.key)) {
            state.labels.push(comp.key);
          }
        }
      } catch (err) {
        _iterator.e(err);
      } finally {
        _iterator.f();
      }
      var listenerKey = (0, _util.clientKey)(_currentComponent.key, renderOptions.context) + '::' + state.key;
      if (this._recordStates) {
        recordedStates.push(state);
      }
      var rerender = function rerender() {
        var _iterator2 = _createForOfIteratorHelper(Listeners[listenerKey] || []),
          _step2;
        try {
          for (_iterator2.s(); !(_step2 = _iterator2.n()).done;) {
            var listener = _step2.value;
            state.off('change', listener);
          }
        } catch (err) {
          _iterator2.e(err);
        } finally {
          _iterator2.f();
        }
        console.log('Rerendering', listenerKey, Listeners[listenerKey].length);
        (0, _internals.render)(_currentComponent, _objectSpread(_objectSpread({}, renderOptions), {}, {
          initiator: _types.Initiator.StateUpdate
        }), _this2._currentComponent.at(-2));
      };
      var _iterator3 = _createForOfIteratorHelper(Listeners[listenerKey] || []),
        _step3;
      try {
        for (_iterator3.s(); !(_step3 = _iterator3.n()).done;) {
          var listener = _step3.value;
          state.off('change', listener);
        }
      } catch (err) {
        _iterator3.e(err);
      } finally {
        _iterator3.f();
      }
      Listeners[listenerKey] = [];
      if (renderOptions.initiator === _types.Initiator.RenderClient || renderOptions.initiator === _types.Initiator.FunctionCall) {
        state.on('change', rerender);
        Listeners[listenerKey] = Listeners[listenerKey] || [];
        Listeners[listenerKey].push(rerender);
      }
      state.getValue(+new Date());
      var value = state.value;
      return [value, function (value) {
        state.setValue(value);
      }];
    }
  }, {
    key: "useEffect",
    value: function useEffect(fn, deps) {
      var clientContext = this._renderOptions;

      // Don't run during client side rendering
      if ((0, _types.isClientContext)(clientContext.context)) {
        return;
      }
      if ((0, _types.isServerContext)(clientContext.context)) {
        fn();
      }
    }
  }, {
    key: "useClientEffect",
    value: function useClientEffect(fn, deps) {
      var clientContext = this._renderOptions;
      var currentIndex = this._currentClientEffect;

      // Don't run during server side rendering
      if ((0, _types.isServerContext)(clientContext.context)) {
        return;
      }
      if ((0, _types.isClientContext)(clientContext.context)) {
        var componentKey = (0, _util.clientKey)(this._currentComponent.at(-1).key, clientContext.context);
        var indexComponentKey = componentKey + '-' + currentIndex;
        var changed = false;
        for (var i = 0; i < (deps === null || deps === void 0 ? void 0 : deps.length) || 0; i++) {
          var _lastDeps$indexCompon;
          if (((_lastDeps$indexCompon = lastDeps[indexComponentKey]) === null || _lastDeps$indexCompon === void 0 ? void 0 : _lastDeps$indexCompon[i]) !== deps[i]) {
            changed = true;
            break;
          }
        }
        if (changed || (deps === null || deps === void 0 ? void 0 : deps.length) === 0 && !lastDeps[indexComponentKey] || !deps) {
          lastDeps[indexComponentKey] = deps;
          var cleanup = fn();
          var wrapped = function wrapped() {
            if (typeof cleanup === 'function') {
              cleanup();
              delete lastDeps[indexComponentKey];
              delete cleanupFns[componentKey][currentIndex];
            }
          };
          cleanupFns[componentKey] = cleanupFns[componentKey] || [];
          if (typeof cleanup === 'function') {
            cleanupFns[componentKey][this._currentClientEffect] = wrapped;
          }
        }
        this._currentClientEffect++;
      }
    }
  }]);
  return Dispatcher;
}();
(0, _defineProperty2["default"])(Dispatcher, "init", function () {
  if (!Dispatcher._current) {
    Dispatcher._current = new Dispatcher();
  } else {
    throw new Error('Dispatcher already initialized');
  }
});
Dispatcher.getCurrent = function () {
  return Dispatcher._current;
};
Dispatcher.init();
var _default = Dispatcher;
exports["default"] = _default;