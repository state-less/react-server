const { generateRegistrationChallenge, generateLoginChallenge, parseRegisterRequest, parseLoginRequest } = require('@webauthn/server')


export const registerChallenge = (name) => {
  const challengeResponse = generateRegistrationChallenge({
    relyingParty: { name: 'state-less' },
    user: { id: 'uuid', name }
  });

  return challengeResponse
}

export const loginChallenge = (key) => {
  return generateLoginChallenge(key)
}
export const getIdentity = (token) => token.id;
/** Send only public key to client. If you leak the private key somone might forge a valid authentication request */
export const getAddress = (token) => ({
  strat: 'webauthn',
  id: token.keyId,
  name: token.keyId,
  email: null,
  picture: null
});


export const register = (response) => {
  const { key, challenge } = parseRegisterRequest(solved);
  return { key, challenge };
}

export const recover = (json, store) => {
  const { type, response, name = 'Anonymous' } = json;
  const state = store.scope('auth-strategy-webauthn').useState('key-' + name)
  if (type === 'register') {
    const { key } = parseRegisterRequest(response);
    state.setValue(key);
    return key;
  } else if (type === 'login') {
    const challengeResponse = parseLoginRequest(response);
    console.log("Verify Yubikey", state.value.credID, challengeResponse.keyId);
    if (state.value.credID === challengeResponse.keyId) {

      return challengeResponse;
    } else {
      return null;
    }
  } else {

    throw new Error('Not implemented');
  }
}

export const challenge = (json, store) => {
  const { name = "Anonymous" } = json;
  const state = store.scope('auth-strategy-webauthn').useState('key-' + name)
  if (!state.value) {
    return {
      type: 'register',
      challenge: registerChallenge(name)
    }
  } else {
    const key = state.value
    return {
      type: 'login',
      challenge: loginChallenge(key)
    }
  }
}