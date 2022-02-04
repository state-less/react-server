"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.challenge = exports.recover = exports.getAddress = exports.getIdentity = void 0;

const getIdentity = token => token;

exports.getIdentity = getIdentity;

const getAddress = token => ({
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
  return response;
};

exports.recover = recover;

const challenge = () => {
  return {
    type: 'login',
    challenge: `Welcome!`
  };
};

exports.challenge = challenge;