"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.recover = void 0;

const jwt = require('jsonwebtoken');

const pem = `-----BEGIN RSA PUBLIC KEY-----
MIGJAoGBAKyFZt4dVhm7yo5r866cDxXsgFiHj91vO8/gvZNGGq3jyBdGO+yoGjAf
N3Fb+R6fOQoXvmf52/8tJAYazoWuP6v+oBRDocs/D1GUs3WNs5IV/A3Ivr4nPR7p
S+XBVowxj18HpBy5vxJl5D5Cru/up25MZsHFUDBl9pRHmsAqqjZpAgMBAAE=
-----END RSA PUBLIC KEY-----`;

const recover = (challenge, response) => {
  const token = jwt.verify(response, pem);
  return token;
};

exports.recover = recover;