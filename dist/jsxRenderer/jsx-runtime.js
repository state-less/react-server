"use strict";

var _typeof = require("@babel/runtime/helpers/typeof");
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.jsxs = exports.jsx = exports.Fragment = void 0;
var _uuid = require("uuid");
var _reactServer = require("../lib/reactServer");
var React = _interopRequireWildcard(require("react/jsx-runtime"));
function _getRequireWildcardCache(nodeInterop) { if (typeof WeakMap !== "function") return null; var cacheBabelInterop = new WeakMap(); var cacheNodeInterop = new WeakMap(); return (_getRequireWildcardCache = function _getRequireWildcardCache(nodeInterop) { return nodeInterop ? cacheNodeInterop : cacheBabelInterop; })(nodeInterop); }
function _interopRequireWildcard(obj, nodeInterop) { if (!nodeInterop && obj && obj.__esModule) { return obj; } if (obj === null || _typeof(obj) !== "object" && typeof obj !== "function") { return { "default": obj }; } var cache = _getRequireWildcardCache(nodeInterop); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj["default"] = obj; if (cache) { cache.set(obj, newObj); } return newObj; }
var jsxs = function jsxs(Component, props) {
  var key = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : (0, _uuid.v4)();
  // const rendered = Lifecycle(Component, props, { key });
  _reactServer.globalInstance.components.set(key, {
    key: key,
    Component: Component,
    props: props
  });
  return {
    key: key,
    props: props,
    Component: Component
  };
};
exports.jsxs = jsxs;
var jsx = function jsx(Component, props) {
  var key = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : (0, _uuid.v4)();
  // const rendered = Lifecycle(Component, props, { key });
  _reactServer.globalInstance.components.set(key, {
    key: key,
    Component: Component,
    props: props
  });
  if (props.ssr) {
    return React.jsx(Component, props);
  }
  return {
    key: key,
    props: props,
    Component: Component
  };
};
exports.jsx = jsx;
var Fragment = function Fragment() {
  throw new Error('Fragment not implemented yet');
};
exports.Fragment = Fragment;