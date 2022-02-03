"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.challenge = exports.recover = exports.register = exports.registerChallenge = void 0;

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
  const {
    key
  } = parseRegisterRequest(response);
  return;
};

exports.recover = recover;

const challenge = () => {
  return {
    type: 'register',
    challenge: registerChallenge('Peter Enis')
  };
};

exports.challenge = challenge;