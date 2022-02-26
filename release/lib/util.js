"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.propsChanged = void 0;

const propsChanged = (lastProps, props) => {
  return !lastProps || Object.keys(lastProps).length !== Object.keys(props).length || JSON.stringify(lastProps) !== JSON.stringify(props);
};

exports.propsChanged = propsChanged;