"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.isReactServerNode = exports.isReactServerComponent = exports.isProvider = void 0;
var _typeof2 = _interopRequireDefault(require("@babel/runtime/helpers/typeof"));
var isReactServerComponent = function isReactServerComponent(node) {
  return node && (0, _typeof2["default"])(node) === 'object' && 'Component' in node && 'props' in node && 'key' in node;
};
exports.isReactServerComponent = isReactServerComponent;
var isReactServerNode = function isReactServerNode(node) {
  return node.__typename !== undefined;
};
exports.isReactServerNode = isReactServerNode;
var isProvider = function isProvider(node) {
  return node && (0, _typeof2["default"])(node) === 'object' && 'context' in node && 'key' in node;
};
exports.isProvider = isProvider;