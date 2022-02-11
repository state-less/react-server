"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.createContext = void 0;

var _uuid = require("uuid");

var _component = require("../server/component");

const createContext = defaultValue => {
  const listeners = {};
  let value = defaultValue;
  const id = (0, _uuid.v4)();
  const ref = {
    id,
    onRender: (key, fn) => {
      listeners[key] = fn;
    },
    Provider: props => {
      _component.Component.useEffect(() => {
        Object.values(listeners).forEach(fn => fn());
      }, []);

      return {
        id,
        component: 'Provider',
        value,
        props
      };
    }
  };
  return ref;
};

exports.createContext = createContext;