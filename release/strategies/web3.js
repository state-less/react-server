"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.challenge = exports.recover = exports.getAddress = exports.getIdentity = void 0;

var _crypto = _interopRequireDefault(require("crypto"));

var _web3Util = require("../lib/web3-util");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const getIdentity = token => token;

exports.getIdentity = getIdentity;

const getAddress = token => ({
  id: token,
  strat: 'web3',
  name: token,
  email: null,
  picture: null
});

exports.getAddress = getAddress;

const recover = json => {
  const {
    challenge,
    response
  } = json;
  return (0, _web3Util.recover)(challenge, response);
};

exports.recover = recover;

const challenge = () => {
  return new Promise(resolve => {
    _crypto.default.randomBytes(8, function (err, buffer) {
      const token = buffer.toString('hex');
      resolve({
        type: 'sign',
        challenge: `Please sign this message to prove your identity: ${token}`
      });
    });
  });
};

exports.challenge = challenge;