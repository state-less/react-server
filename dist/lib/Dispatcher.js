"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = exports.createContext = void 0;
var _defineProperty2 = _interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));
var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));
var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));
var _internals = require("./internals");
var _reactServer = require("./reactServer");
var _types = require("./types");
var createContext = function createContext() {
  var context = {
    current: null
  };
  return {
    context: context,
    Provider: function Provider(props) {
      (0, _reactServer.useEffect)(function () {
        console.log('!!!!!!! PROVIDER');
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
var RenderContext = /*#__PURE__*/(0, _createClass2["default"])(function RenderContext(request) {
  (0, _classCallCheck2["default"])(this, RenderContext);
  this.request = request;
});
var Dispatcher = /*#__PURE__*/function () {
  function Dispatcher() {
    var _this = this;
    (0, _classCallCheck2["default"])(this, Dispatcher);
    (0, _defineProperty2["default"])(this, "setClientContext", function (context) {
      _this._clientContext = new RenderContext(context);
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
        console.log('USE CONTEXT', context, parent, _currentComponent.key);
        if ((0, _types.isProvider)(parent)) {
          if (parent.context === context.context) {
            console.log('Same context, returning');
            return parent.context.current;
          } else {
            console.log('Different context, continuing');
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
      var clientContext = this._clientContext;
      var state = this.store.getState(initialValue, options);
      var value = state.value;
      return [value, function (value) {
        state.value = value;
        (0, _internals.render)(_currentComponent, clientContext.request);
      }];
    }
  }, {
    key: "useEffect",
    value: function useEffect(fn, deps) {
      var clientContext = this._clientContext;
      if (clientContext.request !== null) {
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