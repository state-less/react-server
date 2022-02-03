const { generateRegistrationChallenge, generateLoginChallenge, parseRegisterRequest, parseLoginRequest } = require('@webauthn/server')


export const registerChallenge = (name) => {
  const challengeResponse = generateRegistrationChallenge({
    relyingParty: { name: 'state-less' },
    user: { id: 'uuid', name }
  });

  return challengeResponse
}

export const getIdentity = (token) => token.id;
export const getAddress = (token) => ({name: token, email: null, picture: null});


export const register = (response) => {
  const { key, challenge } = parseRegisterRequest(solved);
  return { key, challenge };
}

export const recover = (challenge, response) => {
  const {key} = parseRegisterRequest(response);
  return key
}

export const challenge = () => {
  return {
    type: 'register',
    challenge: registerChallenge('Peter Enis')
  }
}