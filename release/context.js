"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.storeContext = void 0;

const {
  createContext
} = require("./util/context");

const storeContext = createContext();
exports.storeContext = storeContext;