"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.TestComponent = void 0;
var _slicedToArray2 = _interopRequireDefault(require("@babel/runtime/helpers/slicedToArray"));
var _objectWithoutProperties2 = _interopRequireDefault(require("@babel/runtime/helpers/objectWithoutProperties"));
var _reactServer = require("../lib/reactServer");
var _jsxRuntime = require("../jsxRenderer/jsx-runtime");
var _excluded = ["children"];
var ServerSideProps = function ServerSideProps(props) {
  var children = props.children,
    rest = (0, _objectWithoutProperties2["default"])(props, _excluded);
  return {
    props: rest,
    children: children
  };
};
var TestComponent = function TestComponent(_props) {
  var _useState = (0, _reactServer.useState)(1, {
      key: 'ASD',
      scope: 'Asd'
    }),
    _useState2 = (0, _slicedToArray2["default"])(_useState, 2),
    value = _useState2[0],
    setValue = _useState2[1];
  return (0, _jsxRuntime.jsx)(ServerSideProps, {
    value: value
  });
};
exports.TestComponent = TestComponent;