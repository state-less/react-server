import { Store } from "../server/state";

const { generateRegistrationChallenge, generateLoginChallenge, parseRegisterRequest, parseLoginRequest } = require('@webauthn/server')
const STRAT = 'webauthn'

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
export const getIdentity = (token) => token.webauthn.keyId;
/** Send only public key to client. If you leak the private key somone might forge a valid authentication request */
export const getAddress = (token) => {
  if (token.compound) {
    const { id, name, email, picture } = token.compound;
    return { id, strat: 'compound', name, email, picture };
  }

  return ({
    strat: 'webauthn',
    id: token?.webauthn?.keyId,
    name: token?.webauthn?.keyId,
  });
}
/**
 * Links the currently authenticated webauthn device to the registered account.
 * Both accounts need to be actively authenticated.
 * @param token - The JWT that's currently authenticated.
 * @param store - A store instance that can be used to store data.
 * @returns - The registered account
 */
export const link = async (token, store: Store) => {
  if (!token.webauthn)
    throw new Error('Not authenticated');

  const accountId = token.compound.id;
  const identity = token.webauthn;
  const state = await store.scope('identities').useState(accountId, null);

  const link = await store.scope('identities.webauthn').useState(identity.credID, null);
  const account = {
    ...state.value
  };

  account.devices = account.devices || [];
  account.devices.push(identity.keyId)
  account.identities.webauthn = account.identities.webauthn || [];
  account.identities.webauthn.push(token.webauthn);

  link.setValue(state.id);
  state.setValue(account);
  return { compound: account };
};

export const register = async (token, store: Store) => {
  if (token.compound)
    return link(token, store);

  const identity = token.webauthn
  const state = await store.scope('identities').useState(null, null);

  const linked = await store.scope('identities.webauthn').useState(identity.keyId, null);

  if (linked?.value)
    throw new Error('Account already registered');

  const account = {
    id: state.id,
    devices: [identity.keyId],
    identities: {
      [STRAT]: [
        identity
      ]
    }
  }

  linked.setValue(state.id);
  state.setValue(account);

  return { compound: account }
}


export const recover = async (json, store) => {
  const { type, response, name = 'Anonymous' } = json;
  const state = store.scope('auth-strategy-webauthn').useState('key-' + name)
  if (type === 'register') {
    const { key } = parseRegisterRequest(response);
    state.setValue(key);
    return { webauthn: key }
  } else if (type === 'login') {
    const challengeResponse = parseLoginRequest(response);
    console.log("Verify Yubikey", state.value.credID, challengeResponse.keyId);
    if (state.value.credID === challengeResponse.keyId) {
      const link = await store.scope('identities.webauthn').useState(state.value.credID, null)
      if (!link) return { webauthn: challengeResponse };
      const account = await store.scope('identities').useState(link.value, null)
      if (account?.value) return { 'compound': account.value, 'webauthn': challengeResponse }
      return { webauthn: challengeResponse };
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