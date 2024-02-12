"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.serverKey = exports.retrieve = exports.isStateOptions = exports.generateComponentPubSubKey = exports.createId = exports.clientKey = exports.authenticate = void 0;
var _uuid = require("uuid");
var _jsonwebtoken = _interopRequireDefault(require("jsonwebtoken"));
var _Dispatcher = _interopRequireDefault(require("./Dispatcher"));
var serverKey = 'server';
exports.serverKey = serverKey;
var createId = function createId(debugHint) {
  return (0, _uuid.v4)();
};
exports.createId = createId;
var clientKey = function clientKey(key, requestContext) {
  var _headers;
  return "".concat(key, "::").concat((requestContext === null || requestContext === void 0 ? void 0 : (_headers = requestContext.headers) === null || _headers === void 0 ? void 0 : _headers['x-unique-id']) || serverKey);
};
exports.clientKey = clientKey;
var generateComponentPubSubKey = function generateComponentPubSubKey(component, requestContext) {
  return "component::".concat(requestContext.headers['x-unique-id'], "::").concat(component.key);
};
exports.generateComponentPubSubKey = generateComponentPubSubKey;
var isStateOptions = function isStateOptions(options) {
  return options && options.scope && options.key;
};
exports.isStateOptions = isStateOptions;
var authenticate = function authenticate(headers) {
  var secret = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : process.env.JWT_SECRET;
  var token = headers === null || headers === void 0 ? void 0 : headers.authorization;
  if (!token) throw new Error('Not authorized');
  var bearer = token.split(' ')[1];
  try {
    var decoded = _jsonwebtoken["default"].verify(bearer, secret);
    if (decoded) {
      return decoded;
    }
  } catch (e) {
    throw new Error('Not authorized');
  }
};
exports.authenticate = authenticate;
var retrieve = function retrieve(initialValue, callback) {
  return function (id) {
    var options = callback(id);
    var store = _Dispatcher["default"]._current.getStore();
    var state = store.getState(initialValue, options);
    return state;
  };
};
exports.retrieve = retrieve;