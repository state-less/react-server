import fetch from 'isomorphic-fetch';
const jwt = require('jsonwebtoken');

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
  return token.email;
}

export const getAddress = (token) => {
  const {name, email, picture} = token;
  return {name, email, picture};
}

export const challenge = () => {
  return {
    type: 'oauth',
    challenge: null
  }
}

export const recover = async (challenge, response) => {

  const jwk = await fetch('https://www.googleapis.com/oauth2/v3/certs');
  const json = await jwk.json();
  for (let i = 0; i < 1; i++) {
    const pem = jwkToPem(json.keys[i]);
    let e;
    try {
      console.log ("Trying signature ", i, "of ", 2)
      const token = jwt.verify(response, pem);
      console.log ("Successful")
      return token
    } catch (e) {
      console.log ("Error")
      e = e;
      continue;
    }
  }
  throw e;
}
