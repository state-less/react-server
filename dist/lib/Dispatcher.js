"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = exports.createContext = void 0;
var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));
var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));
var _defineProperty2 = _interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));
var _internals = require("./internals");
var _reactServer = require("./reactServer");
var _scopes = require("./scopes");
var _types = require("./types");
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
var Dispatcher = /*#__PURE__*/function () {
  function Dispatcher() {
    var _this = this;
    (0, _classCallCheck2["default"])(this, Dispatcher);
    (0, _defineProperty2["default"])(this, "setPubSub", function (pubsub) {
      _this._pubsub = pubsub;
    });
    (0, _defineProperty2["default"])(this, "setClientContext", function (context) {
      _this._renderContext = context;
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
      var _renderContext$contex;
      var _currentComponent = this._currentComponent.at(-1);
      var renderContext = this._renderContext;
      var scope = options.scope === _scopes.Scopes.Client ? (renderContext === null || renderContext === void 0 ? void 0 : (_renderContext$contex = renderContext.context) === null || _renderContext$contex === void 0 ? void 0 : _renderContext$contex.headers['x-unique-id']) || 'server' : options.scope;
      var state = this.store.getState(initialValue, _objectSpread(_objectSpread({}, options), {}, {
        scope: scope
      }));
      var value = state.value;
      return [value, function (value) {
        state.value = value;
        (0, _internals.render)(_currentComponent, renderContext);
      }];
    }
  }, {
    key: "useEffect",
    value: function useEffect(fn, deps) {
      var clientContext = this._renderContext;

      // Don't run during client side rendering
      if (clientContext.context !== null) {
        return;
      }
      fn();
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