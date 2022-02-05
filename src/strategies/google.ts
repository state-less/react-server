import fetch from 'isomorphic-fetch';
import logger from '../lib/logger'
import { Store } from '../server/state';
const jwt = require('jsonwebtoken');
const { v4 } = require('uuid');

const STRAT = 'google';

var jwkToPem = require("jwk-to-pem")

var jwk = {
  "keys": [
    {
      "use": "sig",
      "n": "umvf7fUxwzm76j41jjd-8HCguLXpkzcw-VzH-ur1OkmWWPtQ8W3_yPuhK5K35I0akptWtqHTzKyrCYPXrICY54D0HGp4ycLDSe2H_KTZGcTPfLwNhTWyc-Ax_7ZO89NyPNxn6yIoLhqEa8Q6gMUIRxkwLz0PWtGGn8qFCB_9jUFPjTiRbJ87C8LNYo3wwHiBJQfOF3QOf46gVoLHv8qM-2a27qQcl9f3oZVlm8Gwtvj6E6AnfZmehkzZZwOJyf1FvJxVaYIE5MLcsY-YwAatFgL_urwCFbp4wr9HtI_-CmU_AnF0aAOHCdRRJCXmAFgKtcQvdi82UgJIPjg_ZbMtUw==",
      "kty": "RSA",
      "alg": "RS256",
      "kid": "9341abc4092b6fc038e403c91022dd3e44539b56",
      "e": "AQAB"
    },
    {
      "use": "sig",
      "kid": "c1892eb49d7ef9adf8b2e14c05ca0d032714a237",
      "kty": "RSA",
      "alg": "RS256",
      "e": "AQAB",
      "n": "xWDJBwwxLU8KU0w2bqiiXPPrOA7ffmF7g78O_D6LOv80bzeRyyX3zjzIcOI0tLZfFEfFO8CvpzTzB1h5bNinDA4MX9PFMyNBjc7Q4h7QStYZoORY6Kac314IQkwfVM3u4hbIpVvVgmapYESGpPfKh_SPr8tRvarDoEnXG6a501Ni8PfZg44aCbe0kJygl4YZjvLABEkH19HxPiXojxJEWee1lToyDJfM8tZqNTal5u3F8Mk37RhkMWMM1gypvl22t6MDUEOmqp5StwWWgo7KDJ17nDXsM6TQ10rxofkQm5I2swvfosr4Qr3GoUCrE1zXnPwNZJ_P-sQziOFRd36eZw=="
    }
  ]
}

export const getIdentity = (token) => {
  if (token?.compound?.id)
    return token?.compound?.id;
  return token?.google?.email;
}

export const getAddress = (token) => {
  if (token.compound) {
    const { id, name, email, picture } = token.compound;
    return { id, strat: 'compound', name, email, picture };
  }
  const { name, email, picture } = token.google;
  return { id: email, strat: 'google', name, email, picture };
}

export const register = async (token, store: Store) => {
  const identity = token.google;
  const state = await store.scope('identities').useState(null, null)
  const link = await store.scope('identities.google').useState(identity.email, null)

  if (link?.value)
    throw new Error('Account already registered');

  const account = {
    id: state.id,
    name: identity.name,
    email: identity.email,
    picture: identity.picture,
    identities: {
      [STRAT]: identity
    }
  }

  link.setValue(state.key);
  state.setValue(account);

  return account
}

export const link = async (token, store) => {
  const id = token.address.id;
  const identity = token.google;
  const state = await store.scope('identities').useState(id, null)
  const link = await store.scope('identities.google').useState(identity.email, null)
  const account = {
    ...state.value
  };

  account.identities.google = identity

  link.setValue(state.key);
  state.setValue(account);
  return account;
};

export const challenge = () => {
  return {
    type: 'oauth',
    challenge: null
  }
}

export const recover = async (json, store) => {
  const { challenge, response } = json;
  const jwk = await fetch('https://www.googleapis.com/oauth2/v3/certs');
  const certJson = await jwk.json();
  let e;
  for (let i = 0; i < 2; i++) {
    const pem = jwkToPem(certJson.keys[i]);
    try {
      logger.debug`Trying signature ${i + 1} of 2`;
      const token = jwt.verify(response, pem);
      console.log("Successful")
      const link = await store.scope('identities.google').useState(token.email, null)
      if (!link) return { google: token };
      const state = await store.scope('identities').useState(link.value, null)
      if (state?.value) return { 'compound': state.value, 'google': token }
      return { google: token }
    } catch (e) {
      logger.error`Error validating google oauth signature. ${e}`;
      e = e;
      continue;
    }
  }
  if (e)
    throw e;
  throw new Error('Google token could not be verified.')
}
