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
        component: "Provider",
        value,
        props
      };
    }
  };
  /** A bit ugly, but for now we only have the Provider to correlate ids */

  ref.Provider.id = id;
  return ref;
};

exports.createContext = createContext;