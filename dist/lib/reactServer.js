"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.useState = exports.useQuery = exports.useEffect = exports.useContext = exports.useClientEffect = exports.globalInstance = exports.destroy = void 0;
var _Dispatcher = _interopRequireDefault(require("./Dispatcher"));
var globalInstance = {
  components: new Map()
};
exports.globalInstance = globalInstance;
var useState = function useState(initialValue, options) {
  return _Dispatcher["default"].getCurrent().useState(initialValue, options);
};
exports.useState = useState;
var useQuery = function useQuery(initialValue, options) {
  return _Dispatcher["default"].getCurrent().useQuery(initialValue, options);
};
exports.useQuery = useQuery;
var useEffect = function useEffect(fn, deps) {
  return _Dispatcher["default"].getCurrent().useEffect(fn, deps);
};
exports.useEffect = useEffect;
var useClientEffect = function useClientEffect(fn, deps) {
  return _Dispatcher["default"].getCurrent().useClientEffect(fn, deps);
};
exports.useClientEffect = useClientEffect;
var destroy = function destroy() {
  return _Dispatcher["default"].getCurrent().destroy();
};
exports.destroy = destroy;
var useContext = function useContext(context) {
  return _Dispatcher["default"].getCurrent().useContext(context);
};
exports.useContext = useContext;