"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.createId = void 0;
var _uuid = require("uuid");
var createId = function createId(debugHint) {
  return (0, _uuid.v4)();
};
exports.createId = createId;