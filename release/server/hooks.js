"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.useState = void 0;

const useState = state => {
  return [state.value, state.setValue];
};

exports.useState = useState;