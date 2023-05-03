"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.render = exports.isServer = exports.Lifecycle = void 0;
var _slicedToArray2 = _interopRequireDefault(require("@babel/runtime/helpers/slicedToArray"));
var _defineProperty2 = _interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));
var _Action = require("../components/Action");
var _Dispatcher = _interopRequireDefault(require("./Dispatcher"));
var _types = require("./types");
var _util = require("./util");
var _jsxRuntime = require("../jsxRenderer/jsx-runtime");
function _createForOfIteratorHelper(o, allowArrayLike) { var it = typeof Symbol !== "undefined" && o[Symbol.iterator] || o["@@iterator"]; if (!it) { if (Array.isArray(o) || (it = _unsupportedIterableToArray(o)) || allowArrayLike && o && typeof o.length === "number") { if (it) o = it; var i = 0; var F = function F() {}; return { s: F, n: function n() { if (i >= o.length) return { done: true }; return { done: false, value: o[i++] }; }, e: function e(_e) { throw _e; }, f: F }; } throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); } var normalCompletion = true, didErr = false, err; return { s: function s() { it = it.call(o); }, n: function n() { var step = it.next(); normalCompletion = step.done; return step; }, e: function e(_e2) { didErr = true; err = _e2; }, f: function f() { try { if (!normalCompletion && it["return"] != null) it["return"](); } finally { if (didErr) throw err; } } }; }
function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }
function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) arr2[i] = arr[i]; return arr2; }
function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); enumerableOnly && (symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; })), keys.push.apply(keys, symbols); } return keys; }
function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = null != arguments[i] ? arguments[i] : {}; i % 2 ? ownKeys(Object(source), !0).forEach(function (key) { (0, _defineProperty2["default"])(target, key, source[key]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)) : ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } return target; }
var Lifecycle = function Lifecycle(Component, props, _ref) {
  var key = _ref.key,
    context = _ref.context,
    clientProps = _ref.clientProps;
  _Dispatcher["default"].getCurrent().addCurrentComponent({
    Component: Component,
    props: props,
    key: key
  });
  _Dispatcher["default"].getCurrent().setClientContext({
    context: context,
    clientProps: clientProps
  });
  var rendered = Component(_objectSpread({}, props), {
    context: context,
    clientProps: clientProps,
    key: key
  });
  _Dispatcher["default"].getCurrent().popCurrentComponent();
  return _objectSpread({
    __typename: Component.name,
    key: key
  }, rendered);
};
exports.Lifecycle = Lifecycle;
var serverContext = function serverContext() {
  return {};
};
var isServer = function isServer(context) {
  return context.context === serverContext();
};
exports.isServer = isServer;
var render = function render(tree) {
  var renderOptions = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {
    clientProps: null,
    context: null
  };
  var parent = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : null;
  var Component = tree.Component,
    key = tree.key,
    props = tree.props;
  var processedChildren = [];
  var requestContext = !renderOptions || (renderOptions === null || renderOptions === void 0 ? void 0 : renderOptions.context) === null ? serverContext() : renderOptions.context;
  var node = Lifecycle(Component, props, {
    key: key,
    clientProps: renderOptions === null || renderOptions === void 0 ? void 0 : renderOptions.clientProps,
    context: requestContext
  });
  if ((0, _types.isReactServerComponent)(node)) {
    node = render(node, renderOptions, tree);
  }
  var children = Array.isArray(node.children) ? node.children : [node.children].filter(Boolean);
  var components = [];
  var _iterator = _createForOfIteratorHelper(children),
    _step;
  try {
    for (_iterator.s(); !(_step = _iterator.n()).done;) {
      var child = _step.value;
      if (!(0, _types.isReactServerComponent)(child)) {
        if ((0, _types.isReactServerNode)(child)) {
          processedChildren.push(child);
        }
        continue;
      }
      var childResult = null;
      components.push(child);
      do {
        _Dispatcher["default"].getCurrent().setParentNode((childResult || child).key, node);
        childResult = render(childResult || child, renderOptions, tree);
      } while ((0, _types.isReactServerComponent)(childResult));
      processedChildren.push(childResult);
    }
  } catch (err) {
    _iterator.e(err);
  } finally {
    _iterator.f();
  }
  node.children = processedChildren;
  if (isServerSideProps(node)) {
    for (var _i = 0, _Object$entries = Object.entries(node.props); _i < _Object$entries.length; _i++) {
      var entry = _Object$entries[_i];
      var _entry = (0, _slicedToArray2["default"])(entry, 2),
        propName = _entry[0],
        propValue = _entry[1];
      if (typeof propValue === 'function') {
        node.props[propName] = render((0, _jsxRuntime.jsx)(_Action.FunctionCall, {
          component: (parent === null || parent === void 0 ? void 0 : parent.key) || node.key,
          name: propName,
          fn: node.props[propName]
        }), renderOptions, tree);
      }
    }
  }
  if (parent === null) {
    _Dispatcher["default"].getCurrent().setRootComponent(node);
  }
  var rendered = _objectSpread({
    key: key
  }, node);
  if ((0, _types.isClientContext)(requestContext)) {
    _Dispatcher["default"].getCurrent()._pubsub.publish((0, _util.generateComponentPubSubKey)(tree, requestContext), {
      updateComponent: {
        rendered: rendered
      }
    });
  }
  return rendered;
};
exports.render = render;
var isServerSideProps = function isServerSideProps(node) {
  return node.__typename === 'ServerSideProps';
};