"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.WebsocketStream = exports.Streams = void 0;

var _stream = require("stream");

var _websocket = require("./lib/response-lib/websocket");

const Streams = {};
exports.Streams = Streams;

class WebsocketStream extends _stream.Writable {
  constructor(socket) {
    super();
    this.sockets = [];
  }

  addSocket(socket, info) {
    this.sockets.push([socket, info]);
  }

  write(data) {
    this.sockets.forEach(([socket, info]) => {
      socket.send((0, _websocket.success)(data, info));
    });
  }

}

exports.WebsocketStream = WebsocketStream;