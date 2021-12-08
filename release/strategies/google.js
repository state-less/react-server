"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.recover = void 0;

const jwt = require('jsonwebtoken');

const recover = (challenge, response) => {
  const token = jwt.verify(response);
  return token;
};

exports.recover = recover;