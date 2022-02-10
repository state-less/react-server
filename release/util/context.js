"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.createContext = void 0;

var _uuid = require("uuid");

const createContext = defaultValue => {
  const listeners = [];
  let value = defaultValue;
  const id = (0, _uuid.v4)();
  const ref = {
    id,

    get value() {
      return value;
    },

    set value(v) {
      value = v;
      listeners.forEach(fn => 'function' === typeof fn && fn(v));
    },

    onChange: fn => {
      listeners.push(fn);
    },
    Provider: props => {
      return {
        component: 'Provider',
        value,
        props
      };
    }
  };
  return ref;
};

exports.createContext = createContext;