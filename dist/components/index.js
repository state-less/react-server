"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
var _Server = require("./Server");
Object.keys(_Server).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  if (key in exports && exports[key] === _Server[key]) return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function get() {
      return _Server[key];
    }
  });
});
var _Test = require("./Test");
Object.keys(_Test).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  if (key in exports && exports[key] === _Test[key]) return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function get() {
      return _Test[key];
    }
  });
});