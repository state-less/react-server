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
  const id = token.address.id;
  const state = await store.useState(id, {}, {
    scope: 'identities'
  });
  const link = await store.useState(token.google.email, {}, {
    scope: 'identities.google'
  });
  const account = { ...state.value
  };
  account.identities.google = token.google;
  link.setValue(state.id);
  state.setValue(account);
  return account;
};

exports.link = link;

const register = async (identity, store) => {
  if (identity.compound) return link(identity, store);
  const state = await store.useState(null, null, {
    scope: 'identities'
  });
  const linked = await store.useState(identity.email, null, {
    scope: 'identities.google'
  });
  if (linked !== null && linked !== void 0 && linked.value) throw new Error('Account already registered');
  const account = {
    id: state.id,
    name: identity.name,
    email: identity.email,
    picture: identity.picture,
    identities: {
      [STRAT]: identity
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