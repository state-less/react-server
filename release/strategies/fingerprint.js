"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.challenge = exports.recover = exports.getAddress = exports.getIdentity = void 0;

const getIdentity = token => token.visitorId;

exports.getIdentity = getIdentity;

const getAddress = token => ({
  id: token.visitorId,
  strat: 'fingerprint',
  name: token.visitorId,
  email: null,
  picture: null
});

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