"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.challenge = exports.recover = exports.register = exports.link = exports.getAddress = exports.getIdentity = exports.loginChallenge = exports.registerChallenge = void 0;

const {
  generateRegistrationChallenge,
  generateLoginChallenge,
  parseRegisterRequest,
  parseLoginRequest
} = require('@webauthn/server');

const STRAT = 'webauthn';

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

const loginChallenge = key => {
  return generateLoginChallenge(key);
};

exports.loginChallenge = loginChallenge;

const getIdentity = token => token.id;
/** Send only public key to client. If you leak the private key somone might forge a valid authentication request */


exports.getIdentity = getIdentity;

const getAddress = token => ({
  strat: 'webauthn',
  id: token.keyId,
  name: token.keyId,
  email: null,
  picture: null
});

exports.getAddress = getAddress;

const link = async (token, store) => {
  if (!token.webauthn) throw new Error('Not authenticated');
  const id = token.address.id;
  const identity = token.webauthn;
  const state = await store.useState(id, {}, {
    scope: 'identities'
  });
  const link = await store.useState(identity.keyId, {}, {
    scope: 'identities.webauthn'
  });
  const account = { ...state.value
  };
  account.devices = account.devices || [];
  account.devices.push(identity.keyId);
  account.identities.webauthn = account.identities.webauthn || [];
  account.identities.webauthn.push(token.webauthn);
  link.setValue(state.id);
  state.setValue(account);
  return account;
};

exports.link = link;

const register = async (token, store) => {
  if (token.compound) return link(token, store);
  const identity = token.webauthn;
  const state = await store.useState(null, null, {
    scope: 'identities'
  });
  const linked = await store.useState(identity.keyId, null, {
    scope: 'identities.webauthn'
  });
  if (linked !== null && linked !== void 0 && linked.value) throw new Error('Account already registered');
  const account = {
    id: state.id,
    devices: [identity.keyId],
    identities: {
      [STRAT]: [identity]
    }
  };
  linked.setValue(state.id);
  state.setValue(account);
  return account;
};

exports.register = register;

const recover = (json, store) => {
  const {
    type,
    response,
    name = 'Anonymous'
  } = json;
  const state = store.scope('auth-strategy-webauthn').useState('key-' + name);

  if (type === 'register') {
    const {
      key
    } = parseRegisterRequest(response);
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
};

exports.recover = recover;

const challenge = (json, store) => {
  const {
    name = "Anonymous"
  } = json;
  const state = store.scope('auth-strategy-webauthn').useState('key-' + name);

  if (!state.value) {
    return {
      type: 'register',
      challenge: registerChallenge(name)
    };
  } else {
    const key = state.value;
    return {
      type: 'login',
      challenge: loginChallenge(key)
    };
  }
};

exports.challenge = challenge;