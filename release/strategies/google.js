"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.recover = exports.challenge = exports.register = exports.getAddress = exports.getIdentity = void 0;

var _isomorphicFetch = _interopRequireDefault(require("isomorphic-fetch"));

var _logger = _interopRequireDefault(require("../lib/logger"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const jwt = require('jsonwebtoken');

const {
  v4
} = require('uuid');

const STRAT = 'google';

var jwkToPem = require("jwk-to-pem");

var jwk = {
  "keys": [{
    "use": "sig",
    "n": "umvf7fUxwzm76j41jjd-8HCguLXpkzcw-VzH-ur1OkmWWPtQ8W3_yPuhK5K35I0akptWtqHTzKyrCYPXrICY54D0HGp4ycLDSe2H_KTZGcTPfLwNhTWyc-Ax_7ZO89NyPNxn6yIoLhqEa8Q6gMUIRxkwLz0PWtGGn8qFCB_9jUFPjTiRbJ87C8LNYo3wwHiBJQfOF3QOf46gVoLHv8qM-2a27qQcl9f3oZVlm8Gwtvj6E6AnfZmehkzZZwOJyf1FvJxVaYIE5MLcsY-YwAatFgL_urwCFbp4wr9HtI_-CmU_AnF0aAOHCdRRJCXmAFgKtcQvdi82UgJIPjg_ZbMtUw==",
    "kty": "RSA",
    "alg": "RS256",
    "kid": "9341abc4092b6fc038e403c91022dd3e44539b56",
    "e": "AQAB"
  }, {
    "use": "sig",
    "kid": "c1892eb49d7ef9adf8b2e14c05ca0d032714a237",
    "kty": "RSA",
    "alg": "RS256",
    "e": "AQAB",
    "n": "xWDJBwwxLU8KU0w2bqiiXPPrOA7ffmF7g78O_D6LOv80bzeRyyX3zjzIcOI0tLZfFEfFO8CvpzTzB1h5bNinDA4MX9PFMyNBjc7Q4h7QStYZoORY6Kac314IQkwfVM3u4hbIpVvVgmapYESGpPfKh_SPr8tRvarDoEnXG6a501Ni8PfZg44aCbe0kJygl4YZjvLABEkH19HxPiXojxJEWee1lToyDJfM8tZqNTal5u3F8Mk37RhkMWMM1gypvl22t6MDUEOmqp5StwWWgo7KDJ17nDXsM6TQ10rxofkQm5I2swvfosr4Qr3GoUCrE1zXnPwNZJ_P-sQziOFRd36eZw=="
  }]
};

const getIdentity = token => {
  return token.email;
};

exports.getIdentity = getIdentity;

const getAddress = token => {
  const {
    name,
    email,
    picture
  } = token;
  return {
    id: email,
    strat: 'google',
    name,
    email,
    picture
  };
};

exports.getAddress = getAddress;

const register = async (identity, store) => {
  const id = v4();
  const state = await store.useState(null, {}, {
    scope: 'identities'
  });
  const link = await store.useState(identity.id, {}, {
    scope: 'identities.google'
  });
  const account = {
    name: identity.name,
    email: identity.email,
    picture: identity.picture,
    identities: {
      [STRAT]: identity
    }
  };
  link.setValue(state.id);
  state.setValue(account);
  return account;
};

exports.register = register;

const challenge = () => {
  return {
    type: 'oauth',
    challenge: null
  };
};

exports.challenge = challenge;

const recover = async json => {
  const {
    challenge,
    response
  } = json;
  const jwk = await (0, _isomorphicFetch.default)('https://www.googleapis.com/oauth2/v3/certs');
  const certJson = await jwk.json();
  let e;

  for (let i = 0; i < 2; i++) {
    const pem = jwkToPem(certJson.keys[i]);

    try {
      _logger.default.debug`Trying signature ${i + 1} of 2`;
      const token = jwt.verify(response, pem);
      console.log("Successful");
      return token;
    } catch (e) {
      _logger.default.error`Error validating google oauth signature. ${e}`;
      e = e;
      continue;
    }
  }

  if (e) throw e;
  throw new Error('Google token could not be verified.');
};

exports.recover = recover;