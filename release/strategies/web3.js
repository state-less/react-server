"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.challenge = exports.recover = exports.register = exports.link = exports.getAddress = exports.getIdentity = void 0;

var _crypto = _interopRequireDefault(require("crypto"));

var _web3Util = require("../lib/web3-util");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const getIdentity = ({
  web3: token
}) => token;

exports.getIdentity = getIdentity;

const getAddress = ({
  web3: token
}) => ({
  id: token,
  strat: 'web3',
  name: token
});

exports.getAddress = getAddress;

const link = json => {
  throw new Error('Web3 can not be linked');
};

exports.link = link;

const register = json => {
  throw new Error('Web3 can not be used to register');
};

exports.register = register;

const recover = json => {
  const {
    challenge,
    response
  } = json;
  return {
    web3: (0, _web3Util.recover)(challenge, response)
  };
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