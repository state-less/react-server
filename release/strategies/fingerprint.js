"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.challenge = exports.recover = exports.getAddress = exports.getIdentity = void 0;

const getIdentity = token => {
  var _token$fingerprint;

  return token === null || token === void 0 ? void 0 : (_token$fingerprint = token.fingerprint) === null || _token$fingerprint === void 0 ? void 0 : _token$fingerprint.visitorId;
};

exports.getIdentity = getIdentity;

const getAddress = token => {
  var _token$fingerprint2, _token$fingerprint3;

  return {
    id: token === null || token === void 0 ? void 0 : (_token$fingerprint2 = token.fingerprint) === null || _token$fingerprint2 === void 0 ? void 0 : _token$fingerprint2.visitorId,
    strat: 'fingerprint',
    name: token === null || token === void 0 ? void 0 : (_token$fingerprint3 = token.fingerprint) === null || _token$fingerprint3 === void 0 ? void 0 : _token$fingerprint3.visitorId
  };
};

exports.getAddress = getAddress;

const recover = json => {
  const {
    challenge,
    response
  } = json;
  const {
    visitorId,
    confidence
  } = response;
  return {
    fingerprint: {
      visitorId,
      confidence
    }
  };
};

exports.recover = recover;

const challenge = () => {
  return {
    type: 'login',
    challenge: `Welcome!`
  };
};

exports.challenge = challenge;