"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.jsxs = exports.jsx = exports.Fragment = void 0;
var _uuid = require("uuid");
var _reactServer = require("../lib/reactServer");
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