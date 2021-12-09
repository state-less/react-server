"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.validateSecWebSocketKey = exports.getSecWebSocketKey = void 0;

var _ = require(".");

/**
 * Interface to retrieve the sec-websocket-key in case the implementation might change
 * @param {*} req - Websocket request
 * @returns {string} - The Sec-WebSocket-Key
 * @see - https://stackoverflow.com/questions/18265128/what-is-sec-websocket-key-for
 */
const getSecWebSocketKey = req => req.headers['sec-websocket-key'];
/**
 * Interface to make sure the sec-websocket-key
 * @param {*} req - Websocket request
 * @returns 
 */


exports.getSecWebSocketKey = getSecWebSocketKey;

const validateSecWebSocketKey = req => {
  (0, _.assertIsValid)(getSecWebSocketKey(req), 'Invalid websocket connection.');
};

exports.validateSecWebSocketKey = validateSecWebSocketKey;