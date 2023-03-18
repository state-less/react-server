"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.FunctionCall = void 0;
var FunctionCall = function FunctionCall(props) {
  return {
    component: props.component,
    name: props.name,
    args: [props.args],
    fn: props.fn
  };
};
exports.FunctionCall = FunctionCall;