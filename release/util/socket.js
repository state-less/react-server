"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.setupWsHeartbeat = setupWsHeartbeat;
exports.validateSecWebSocketKey = exports.getSecWebSocketKey = void 0;

var _ = require(".");

var _logger = require("../lib/logger");

var _heartbeat = require("../static/heartbeat");

const socketUtilLogger = _logger.logger.scope("util.socket");
/**
 * Interface to retrieve the sec-websocket-key in case the implementation might change
 * @param {*} req - Websocket request
 * @returns {string} - The Sec-WebSocket-Key
 * @see - https://stackoverflow.com/questions/18265128/what-is-sec-websocket-key-for
 */


const getSecWebSocketKey = req => req.headers["sec-websocket-key"];
/**
 * Interface to make sure the sec-websocket-key
 * @param {*} req - Websocket request
 * @returns
 */


exports.getSecWebSocketKey = getSecWebSocketKey;

const validateSecWebSocketKey = req => {
  (0, _.assertIsValid)(getSecWebSocketKey(req), "Invalid websocket connection.");
};
/**
 * Will ping clients in a interval and terminate broken connections
 * @see https://gist.github.com/thiagof/aba7791ef9504c1184769ce401f478dc
 */


exports.validateSecWebSocketKey = validateSecWebSocketKey;

function setupWsHeartbeat(wss) {
  function noop() {}

  function heartbeat() {
    this.isAlive = true;
  }

  socketUtilLogger.debug`Setting up heartbeats.`;
  wss.on("connection", function connection(ws) {
    ws.isAlive = true;
    ws.on("pong", heartbeat);
  });

  _heartbeat.heart.createEvent(30, function ping() {
    socketUtilLogger.debug`Sending heartbeat to ${wss.clients.entries.length} sockets.`;
    wss.clients.forEach(function each(ws) {
      // client did not respond the ping (pong)
      if (ws.isAlive === false) {
        socketUtilLogger.warning`Client timed out. Terminating connection.`;
        return ws.terminate();
      }

      ws.isAlive = false;
      ws.ping(noop);
    });
  });
}