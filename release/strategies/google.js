"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.recover = void 0;

const jwt = require('jsonwebtoken');

const pem = "-----BEGIN PUBLIC KEY-----\nMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ…cQvdi82UgJIPjg/ZbMt\nUwIDAQAB\n-----END PUBLIC KEY-----\n";

const recover = (challenge, response) => {
  const token = jwt.verify(response, pem);
  return token;
};

exports.recover = recover;