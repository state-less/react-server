"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.SocketErrorAction = exports.RenderErrorAction = exports.RenderAction = void 0;

var _consts = require("../consts");

const RenderAction = rest => ({
  action: _consts.ACTION_RENDER,
  routeKey: _consts.ACTION_RENDER,
  ...rest
});

exports.RenderAction = RenderAction;

const RenderErrorAction = rest => RenderAction({
  type: 'error'
});

exports.RenderErrorAction = RenderErrorAction;

const SocketErrorAction = rest => ({
  type: 'error'
});

exports.SocketErrorAction = SocketErrorAction;