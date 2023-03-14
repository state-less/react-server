"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.render = exports.Lifecycle = void 0;
var _defineProperty2 = _interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));
var _Dispatcher = _interopRequireDefault(require("./Dispatcher"));
var _types = require("./types");
function _createForOfIteratorHelper(o, allowArrayLike) { var it = typeof Symbol !== "undefined" && o[Symbol.iterator] || o["@@iterator"]; if (!it) { if (Array.isArray(o) || (it = _unsupportedIterableToArray(o)) || allowArrayLike && o && typeof o.length === "number") { if (it) o = it; var i = 0; var F = function F() {}; return { s: F, n: function n() { if (i >= o.length) return { done: true }; return { done: false, value: o[i++] }; }, e: function e(_e) { throw _e; }, f: F }; } throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); } var normalCompletion = true, didErr = false, err; return { s: function s() { it = it.call(o); }, n: function n() { var step = it.next(); normalCompletion = step.done; return step; }, e: function e(_e2) { didErr = true; err = _e2; }, f: function f() { try { if (!normalCompletion && it["return"] != null) it["return"](); } finally { if (didErr) throw err; } } }; }
function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }
function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) arr2[i] = arr[i]; return arr2; }
function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); enumerableOnly && (symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; })), keys.push.apply(keys, symbols); } return keys; }
function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = null != arguments[i] ? arguments[i] : {}; i % 2 ? ownKeys(Object(source), !0).forEach(function (key) { (0, _defineProperty2["default"])(target, key, source[key]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)) : ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } return target; }
var Lifecycle = function Lifecycle(Component, props, _ref) {
  var key = _ref.key,
    request = _ref.request;
  _Dispatcher["default"].getCurrent().addCurrentComponent({
    Component: Component,
    props: props,
    key: key
  });
  _Dispatcher["default"].getCurrent().setClientContext(request);
  var rendered = Component(_objectSpread({}, props), {
    request: request
  });
  _Dispatcher["default"].getCurrent().popCurrentComponent();
  return _objectSpread({
    __typename: Component.name,
    key: key
  }, rendered);
};
exports.Lifecycle = Lifecycle;
var render = function render(tree) {
  var request = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : null;
  var parent = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : null;
  var Component = tree.Component,
    key = tree.key,
    props = tree.props;
  console.log('Render', Component, props);
  var processedChildren = [];
  var node = Lifecycle(Component, props, {
    key: key,
    request: request
  });
  if ((0, _types.isReactServerComponent)(node)) {
    node = render(node, request, node);
  }
  var children = Array.isArray(props.children) ? props.children : [props.children].filter(Boolean);
  console.log('Render children', children);
  var _iterator = _createForOfIteratorHelper(children),
    _step;
  try {
    for (_iterator.s(); !(_step = _iterator.n()).done;) {
      var child = _step.value;
      console.log('Render child', child, children);
      if (!(0, _types.isReactServerComponent)(child)) continue;
      var childResult = null;
      do {
        _Dispatcher["default"].getCurrent().setParentNode((childResult || child).key, node);
        childResult = render(childResult || child, request, node);
        console.log('Render parent', Component, childResult.key, node);
      } while ((0, _types.isReactServerComponent)(childResult));
      processedChildren.push(childResult);
    }
  } catch (err) {
    _iterator.e(err);
  } finally {
    _iterator.f();
  }
  node.children = processedChildren;
  if (parent === null) {
    _Dispatcher["default"].getCurrent().setRootComponent(node);
  }
  return _objectSpread({
    key: key
  }, node);
};
exports.render = render;