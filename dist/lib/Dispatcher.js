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
    (0, _defineProperty2["default"])(this, "addCurrentComponent", function (component) {
      _this._currentComponent.push(component);
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
      var _currentComponent = this._currentComponent.at(-1);
      var renderOptions = this._renderOptions;
      var scope = getRuntimeScope(options.scope, renderOptions.context);
      var state = this.store.getState(initialValue, _objectSpread(_objectSpread({}, options), {}, {
        scope: scope
      }));
      var listenerKey = (0, _util.clientKey)(_currentComponent.key, renderOptions.context);
      var rerender = function rerender() {
        var _iterator = _createForOfIteratorHelper(Listeners[listenerKey] || []),
          _step;
        try {
          for (_iterator.s(); !(_step = _iterator.n()).done;) {
            var listener = _step.value;
            state.off('change', listener);
          }
        } catch (err) {
          _iterator.e(err);
        } finally {
          _iterator.f();
        }
        (0, _internals.render)(_currentComponent, renderOptions);
      };
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
      console.log('Removed Listeners', state.listeners('change').length);
      Listeners[listenerKey] = [];
      state.once('change', rerender);
      Listeners[listenerKey] = Listeners[listenerKey] || [];
      Listeners[listenerKey].push(rerender);
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