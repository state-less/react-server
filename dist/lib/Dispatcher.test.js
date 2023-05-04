"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
var _typeof = require("@babel/runtime/helpers/typeof");
var _slicedToArray2 = _interopRequireDefault(require("@babel/runtime/helpers/slicedToArray"));
var _graphqlSubscriptions = require("graphql-subscriptions");
var _MemoryStore = require("../store/MemoryStore");
var _Dispatcher = _interopRequireWildcard(require("./Dispatcher"));
var _internals = require("./internals");
var _reactServer = require("./reactServer");
var _types = require("./types");
var _jsxRuntime = require("../jsxRenderer/jsx-runtime");
function _getRequireWildcardCache(nodeInterop) { if (typeof WeakMap !== "function") return null; var cacheBabelInterop = new WeakMap(); var cacheNodeInterop = new WeakMap(); return (_getRequireWildcardCache = function _getRequireWildcardCache(nodeInterop) { return nodeInterop ? cacheNodeInterop : cacheBabelInterop; })(nodeInterop); }
function _interopRequireWildcard(obj, nodeInterop) { if (!nodeInterop && obj && obj.__esModule) { return obj; } if (obj === null || _typeof(obj) !== "object" && typeof obj !== "function") { return { "default": obj }; } var cache = _getRequireWildcardCache(nodeInterop); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj["default"] = obj; if (cache) { cache.set(obj, newObj); } return newObj; }
var store = new _MemoryStore.Store({});
var pubSub = new _graphqlSubscriptions.PubSub();
_Dispatcher["default"].getCurrent().setPubSub(pubSub);
var effectMock = jest.fn();
var MockComponent = function MockComponent() {
  (0, _reactServer.useEffect)(effectMock, []);
};
var StateComponent = function StateComponent() {
  var _useState = (0, _reactServer.useState)(1, {
      key: 'ASD',
      scope: 'Asd'
    }),
    _useState2 = (0, _slicedToArray2["default"])(_useState, 2),
    value = _useState2[0],
    setValue = _useState2[1];
  return {
    value: value,
    setValue: setValue
  };
};
var Children = function Children(props) {
  return {
    children: props.children
  };
};
var context = (0, _Dispatcher.createContext)();
var secondContext = (0, _Dispatcher.createContext)();
var Provider = function Provider(props) {
  return (0, _jsxRuntime.jsx)(context.Provider, {
    value: props.value,
    children: props.children
  });
};
var ContextComponent = function ContextComponent() {
  var ctx = (0, _reactServer.useContext)(context);
  return {
    ctx: ctx
  };
};
describe('Dispatcher', function () {
  var context, provider;
  it('should be able to create a context', function () {
    context = (0, _Dispatcher.createContext)();
    expect(context).toBeDefined();
  });
  it('should be able to create a Provider', function () {
    provider = (0, _jsxRuntime.jsx)(context.Provider, {
      value: 1
    });
    expect(provider).toBeDefined();
    expect((0, _types.isReactServerNode)(provider));
  });
  it('should be able to render a Provider', function () {
    var node = (0, _internals.render)(provider, null);
    expect(node).toBeDefined();
  });
  it('should create a Dispatcher', function () {
    var dispatcher = new _Dispatcher["default"]();
    expect(dispatcher).toBeDefined();
  });
  it('should  not be able to init  a Dispatcher twice', function () {
    expect(function () {
      return _Dispatcher["default"].init();
    }).toThrow();
  });
  it('should be able to set/get a store', function () {
    var mocked = store;
    _Dispatcher["default"].getCurrent().setStore(mocked);
    expect(_Dispatcher["default"].getCurrent().getStore()).toBe(mocked);
    _Dispatcher["default"].getCurrent().setStore(store);
  });
  it('Should execute a useEffect on the Server', function () {
    var component = (0, _jsxRuntime.jsx)(MockComponent, {});
    (0, _internals.render)(component);
    expect(effectMock).toBeCalledTimes(1);
  });
  it('Should not execute a useEffect on the client', function () {
    var component = (0, _jsxRuntime.jsx)(MockComponent, {});
    (0, _internals.render)(component, {
      clientProps: {},
      context: {
        headers: {
          'x-unique-id': 'client'
        }
      },
      initiator: _types.Initiator.RenderServer
    });
    expect(effectMock).toBeCalledTimes(1);
  });
  it('should be able to use a state', function () {
    var component = (0, _jsxRuntime.jsx)(StateComponent, {});
    var node = (0, _internals.render)(component);
    expect(node.value).toBe(1);
  });
  it('should be able to set a state', function () {
    var component = (0, _jsxRuntime.jsx)(StateComponent, {});
    var node = (0, _internals.render)(component);
    expect(node.value).toBe(1);
    node.setValue(2);
    expect(node.value).toBe(1);
    node = (0, _internals.render)(component);
    expect(node.value).toBe(2);
  });
  it('should be able to use a context', function () {
    var ctx = {
      foo: 'bar'
    };
    var component = (0, _jsxRuntime.jsx)(Provider, {
      value: ctx,
      children: (0, _jsxRuntime.jsx)(ContextComponent, {}, "context")
    }, "provider");
    var node = (0, _internals.render)(component);
    expect(node.children[0].ctx).toBe(ctx);
  });
  it('should be able to use a context higher up the tree', function () {
    var component = (0, _jsxRuntime.jsx)(Provider, {
      value: 1,
      children: (0, _jsxRuntime.jsx)(Children, {
        children: (0, _jsxRuntime.jsx)(ContextComponent, {}, "context")
      }, "children")
    }, "provider");
    var node = (0, _internals.render)(component);
    expect(node.children[0].children[0].ctx).toBe(1);
  });
  it('should return null if no provider is found', function () {
    var dispatcher = _Dispatcher["default"].getCurrent();
    expect(function () {
      return dispatcher.useContext(context);
    }).toThrow();
    var component = (0, _jsxRuntime.jsx)(ContextComponent, {});
    dispatcher.addCurrentComponent(component);
    (0, _internals.render)(component);
    var ctx = dispatcher.useContext(context);
    expect(ctx).toBe(null);
  });
  it('should not return a wrong provider', function () {
    var dispatcher = _Dispatcher["default"].getCurrent();
    var component = (0, _jsxRuntime.jsxs)(Provider, {
      children: [(0, _jsxRuntime.jsx)(ContextComponent, {}), ";"]
    });
    dispatcher.addCurrentComponent(component.props.children[0]);
    (0, _internals.render)(component);
    var ctx = dispatcher.useContext(secondContext);
    expect(ctx).toBe(null);
  });
  it('doesnt error when no children are present', function () {
    var component = (0, _jsxRuntime.jsx)(Children, {});
    var node = (0, _internals.render)(component);
    expect(node.children).toEqual([]);
  });
});