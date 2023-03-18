"use strict";

var _typeof = require("@babel/runtime/helpers/typeof");
Object.defineProperty(exports, "__esModule", {
  value: true
});
var _exportNames = {
  render: true,
  Dispatcher: true,
  createContext: true
};
Object.defineProperty(exports, "Dispatcher", {
  enumerable: true,
  get: function get() {
    return _Dispatcher["default"];
  }
});
Object.defineProperty(exports, "createContext", {
  enumerable: true,
  get: function get() {
    return _Dispatcher.createContext;
  }
});
Object.defineProperty(exports, "render", {
  enumerable: true,
  get: function get() {
    return _internals.render;
  }
});
var _components = require("./components");
Object.keys(_components).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  if (Object.prototype.hasOwnProperty.call(_exportNames, key)) return;
  if (key in exports && exports[key] === _components[key]) return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function get() {
      return _components[key];
    }
  });
});
var _MemoryStore = require("./store/MemoryStore");
Object.keys(_MemoryStore).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  if (Object.prototype.hasOwnProperty.call(_exportNames, key)) return;
  if (key in exports && exports[key] === _MemoryStore[key]) return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function get() {
      return _MemoryStore[key];
    }
  });
});
var _types = require("./lib/types");
Object.keys(_types).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  if (Object.prototype.hasOwnProperty.call(_exportNames, key)) return;
  if (key in exports && exports[key] === _types[key]) return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function get() {
      return _types[key];
    }
  });
});
var _util = require("./lib/util");
Object.keys(_util).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  if (Object.prototype.hasOwnProperty.call(_exportNames, key)) return;
  if (key in exports && exports[key] === _util[key]) return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function get() {
      return _util[key];
    }
  });
});
var _internals = require("./lib/internals");
var _Dispatcher = _interopRequireWildcard(require("./lib/Dispatcher"));
function _getRequireWildcardCache(nodeInterop) { if (typeof WeakMap !== "function") return null; var cacheBabelInterop = new WeakMap(); var cacheNodeInterop = new WeakMap(); return (_getRequireWildcardCache = function _getRequireWildcardCache(nodeInterop) { return nodeInterop ? cacheNodeInterop : cacheBabelInterop; })(nodeInterop); }
function _interopRequireWildcard(obj, nodeInterop) { if (!nodeInterop && obj && obj.__esModule) { return obj; } if (obj === null || _typeof(obj) !== "object" && typeof obj !== "function") { return { "default": obj }; } var cache = _getRequireWildcardCache(nodeInterop); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj["default"] = obj; if (cache) { cache.set(obj, newObj); } return newObj; }