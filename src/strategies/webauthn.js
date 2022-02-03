const jwt = require('jsonwebtoken');
var jwkToPem = require("jwk-to-pem")
const { generateRegistrationChallenge, generateLoginChallenge, parseRegisterRequest, parseLoginRequest } = require('@webauthn/server')


export const registerChallenge = (name) => {
  const challengeResponse = generateRegistrationChallenge({
    relyingParty: { name: 'state-less' },
    user: { id: 'uuid', name }
  });

  return challengeResponse
}

export const register = (response) => {
  const { key, challenge } = parseRegisterRequest(solved);
  return { key, challenge };
}

export const recover = (challenge, response) => {
  return token
}

export const challenge = () => {

  return registerChallenge('Peter Enis');
}