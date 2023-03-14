"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Server = void 0;
var _Dispatcher = require("../lib/Dispatcher");
var _jsxRuntime = require("../jsxRenderer/jsx-runtime");
var context = (0, _Dispatcher.createContext)();
var VERSION = '0.0.1';
var Server = function Server(props) {
  var value = {
    VERSION: VERSION
  };
  return {
    version: VERSION,
    children: (0, _jsxRuntime.jsx)(context.Provider, {
      value: value,
      children: props.children
    })
  };
};
exports.Server = Server;