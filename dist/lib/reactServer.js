"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.useState = exports.useEffect = exports.useContext = exports.globalInstance = void 0;
var _Dispatcher = _interopRequireDefault(require("./Dispatcher"));
var globalInstance = {
  components: new Map()
};
exports.globalInstance = globalInstance;
var useState = function useState(initialValue, options) {
  return _Dispatcher["default"].getCurrent().useState(initialValue, options);
};
exports.useState = useState;
var useEffect = function useEffect(fn, deps) {
  return _Dispatcher["default"].getCurrent().useEffect(fn, deps);
};
exports.useEffect = useEffect;
var useContext = function useContext(context) {
  return _Dispatcher["default"].getCurrent().useContext(context);
};
exports.useContext = useContext;