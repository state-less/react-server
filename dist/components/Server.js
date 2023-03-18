"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Server = void 0;
var _defineProperty2 = _interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));
var _Dispatcher = require("../lib/Dispatcher");
var _package = _interopRequireDefault(require("../_package.json"));
var _jsxRuntime = require("../jsxRenderer/jsx-runtime");
function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); enumerableOnly && (symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; })), keys.push.apply(keys, symbols); } return keys; }
function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = null != arguments[i] ? arguments[i] : {}; i % 2 ? ownKeys(Object(source), !0).forEach(function (key) { (0, _defineProperty2["default"])(target, key, source[key]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)) : ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } return target; }
var context = (0, _Dispatcher.createContext)();
var VERSION = _package["default"].version;
var UPTIME = Date.now();
var Server = function Server(props) {
  var value = {
    version: VERSION,
    uptime: UPTIME,
    platform: process.platform
  };
  return _objectSpread(_objectSpread({}, value), {}, {
    children: (0, _jsxRuntime.jsx)(context.Provider, {
      value: value,
      children: props.children
    })
  });
};
exports.Server = Server;