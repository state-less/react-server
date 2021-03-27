"use strict";

const {
  encrypt,
  decrypt
} = require('./forge');

const dummy = encrypt('foobar');

const encryptValue = value => dummy(value);

module.exports = {
  encryptValue
};