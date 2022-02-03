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
  const {key} = parseRegisterRequest(response);
  return
}

export const challenge = () => {
  return {
    type: 'register',
    challenge: registerChallenge('Peter Enis')
  }
}