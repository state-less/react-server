"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.authenticate = exports.validateComponentArgs = exports.assertIsValid = void 0;

var _logger = _interopRequireDefault(require("../lib/logger"));

var _consts = require("../consts");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const logger = _logger.default.scope("util");

const assertIsValid = (isValid, message) => {
  if (!isValid) throw new Error(message);
};

exports.assertIsValid = assertIsValid;

const validateComponentArgs = (props, key, options, socket) => {
  if (!key) {
    logger.warning`Error validating component args. ${_consts.DESC_MISSING_KEY}`;
    return ERR_MISSING_KEY;
  }

  return true;
};

exports.validateComponentArgs = validateComponentArgs;

const authenticate = ({
  data
}) => {
  var _data$headers, _data$headers2, _data$headers2$Author;

  if (!(data !== null && data !== void 0 && (_data$headers = data.headers) !== null && _data$headers !== void 0 && _data$headers.Authorization) || !(data !== null && data !== void 0 && (_data$headers2 = data.headers) !== null && _data$headers2 !== void 0 && (_data$headers2$Author = _data$headers2.Authorization) !== null && _data$headers2$Author !== void 0 && _data$headers2$Author.includes("Bearer"))) {
    throw new Error("Not authorized");
  }

  const token = data.headers.Authorization.split(" ").pop();
  return jwt.verify(token, SECRET);
};

exports.authenticate = authenticate;