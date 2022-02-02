"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
Object.defineProperty(exports, "recover", {
  enumerable: true,
  get: function () {
    return _web3Util.recover;
  }
});
exports.getAddress = exports.getId = void 0;

var _web3Util = require("../lib/web3-util");

const getId = token => token;

exports.getId = getId;

const getAddress = token => ({
  name: token,
  email: null,
  picture: null
});

exports.getAddress = getAddress;