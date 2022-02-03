"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.challenge = exports.recover = exports.register = exports.registerChallenge = void 0;

const jwt = require('jsonwebtoken');

var jwkToPem = require("jwk-to-pem");

const {
  generateRegistrationChallenge,
  generateLoginChallenge,
  parseRegisterRequest,
  parseLoginRequest
} = require('@webauthn/server');

const registerChallenge = name => {
  const challengeResponse = generateRegistrationChallenge({
    relyingParty: {
      name: 'state-less'
    },
    user: {
      id: 'uuid',
      name
    }
  });
  return challengeResponse;
};

exports.registerChallenge = registerChallenge;

const register = response => {
  const {
    key,
    challenge
  } = parseRegisterRequest(solved);
  return {
    key,
    challenge
  };
};

exports.register = register;

const recover = (challenge, response) => {
  return token;
};

exports.recover = recover;

const challenge = () => {
  return registerChallenge('Peter Enis');
};

exports.challenge = challenge;