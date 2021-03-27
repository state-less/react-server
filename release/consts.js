"use strict";

const EVENT_STATE_USE = 'useState';
const EVENT_STATE_PERMIT = 'permitState';
const EVENT_STATE_DECLINE = 'declineState';
const EVENT_STATE_SET = 'setState';
const EVENT_STATE_CREATE = 'createState';
const EVENT_STATE_REQUEST = 'requestState';
const EVENT_STATE_ERROR = 'error';
const EVENT_SCOPE_CREATE = 'createScope';
module.exports = {
  EVENT_STATE_ERROR,
  EVENT_STATE_DECLINE,
  EVENT_STATE_PERMIT,
  EVENT_STATE_SET,
  EVENT_STATE_USE,
  EVENT_STATE_CREATE,
  EVENT_STATE_REQUEST,
  EVENT_SCOPE_CREATE
};