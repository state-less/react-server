"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.ACTION_USE_STATE = exports.ACTION_CALL = exports.ACTION_AUTH = exports.ACTION_STREAM = exports.ACTION_RENDER = void 0;
const EVENT_STATE_USE = 'useState';
const EVENT_STATE_PERMIT = 'permitState';
const EVENT_STATE_DECLINE = 'declineState';
const EVENT_STATE_SET = 'setState';
const EVENT_STATE_CREATE = 'createState';
const EVENT_STATE_REQUEST = 'requestState';
const EVENT_STATE_ERROR = 'error';
const EVENT_SCOPE_CREATE = 'createScope';
const CACHE_FIRST = 'CACHE_FIRST';
const NETWORK_FIRST = 'NETWORK_FIRST';
const SERVER_ID = 'server';
const ACTION_RENDER = 'render';
exports.ACTION_RENDER = ACTION_RENDER;
const ACTION_STREAM = 'stream';
exports.ACTION_STREAM = ACTION_STREAM;
const ACTION_AUTH = 'auth';
exports.ACTION_AUTH = ACTION_AUTH;
const ACTION_CALL = 'call';
exports.ACTION_CALL = ACTION_CALL;
const ACTION_USE_STATE = 'useState';
exports.ACTION_USE_STATE = ACTION_USE_STATE;
const SCOPE_CLIENT = '$client';
const SCOPE_SERVER = '$server';
const SCOPE_COMPONENT = '$component';
const ERR_MISSING_KEY = `Missing property 'key' in component props.`;
const DESC_MISSING_KEY = `A key is required to be able to map the client component to a Server component.`;
module.exports = {
  EVENT_STATE_ERROR,
  EVENT_STATE_DECLINE,
  EVENT_STATE_PERMIT,
  EVENT_STATE_SET,
  EVENT_STATE_USE,
  EVENT_STATE_CREATE,
  EVENT_STATE_REQUEST,
  EVENT_SCOPE_CREATE,
  CACHE_FIRST,
  NETWORK_FIRST,
  SERVER_ID,
  SCOPE_CLIENT,
  SCOPE_SERVER,
  SCOPE_COMPONENT,
  ERR_MISSING_KEY,
  DESC_MISSING_KEY
};