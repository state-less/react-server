"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
Object.defineProperty(exports, "recover", {
  enumerable: true,
  get: function () {
    return _web3Util.recover;
  }
});
exports.challenge = exports.getAddress = exports.getIdentity = void 0;

var _crypto = _interopRequireDefault(require("crypto"));

var _web3Util = require("../lib/web3-util");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const getIdentity = token => token;

exports.getIdentity = getIdentity;

const getAddress = token => ({
  name: token,
  email: null,
  picture: null
});

exports.getAddress = getAddress;

const challenge = () => {
  const token = _crypto.default.randomBytes(4).toString('hex');

  return {
    type: 'sign',
    challenge: `Please sign this message to prove your identity: ${token}`
  };
};

exports.challenge = challenge;