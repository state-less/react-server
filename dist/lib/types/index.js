"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.isServerContext = exports.isReactServerNode = exports.isReactServerComponent = exports.isProvider = exports.isClientContext = exports.Initiator = void 0;
var _typeof2 = _interopRequireDefault(require("@babel/runtime/helpers/typeof"));
/** Contains information about the client request, such as the headers */

var isClientContext = function isClientContext(context) {
  return context && context.headers !== undefined;
};
exports.isClientContext = isClientContext;
var isServerContext = function isServerContext(context) {
  return context && context.__typename === 'ServerContext';
};
/** Contains information about the server */
exports.isServerContext = isServerContext;
var Initiator;
exports.Initiator = Initiator;
(function (Initiator) {
  Initiator[Initiator["RenderServer"] = 0] = "RenderServer";
  Initiator[Initiator["RenderClient"] = 1] = "RenderClient";
  Initiator[Initiator["FunctionCall"] = 2] = "FunctionCall";
  Initiator[Initiator["StateUpdate"] = 3] = "StateUpdate";
})(Initiator || (exports.Initiator = Initiator = {}));
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