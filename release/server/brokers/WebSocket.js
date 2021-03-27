"use strict";

const logger = require('../../lib/logger');

const {
  success
} = require('../../lib/response-lib/websocket');

const {
  Broker
} = require('../state');

const EVENT_STATE_SET = 'setState';

class WebsocketBroker extends Broker {
  constructor(options = {}) {
    super(options);
    const {
      getScope = this.getScope
    } = options;
    Object.assign(this, {
      getScope
    });
  }

  getScope(socket, options) {
    let {
      scope = 'client'
    } = options;
    return scope === 'client' ? socket.id : scope;
  }

  emitError(socket, options, message) {
    logger.warning`Emitting error event (${EVENT_STATE_ERROR + ':' + options.clientId}) ${message} to client ${socket.id}`;
    socket.emit(EVENT_STATE_ERROR + ':' + options.clientId, {
      error: message,
      ...options
    });
  }

  emit(socket, event, message) {
    socket.emit(event, message);
  }

  syncInitialState(state, socket, options) {
    const {
      id,
      value
    } = state;
    socket.emit(EVENT_STATE_CREATE + ':' + options.clientId, {
      id,
      value,
      ...options
    });
  }

  sync(state, socket) {
    logger.info`Syncing state ${state} with socket ${socket.id}.`;
    const {
      id,
      value,
      error
    } = state;
    const {
      message,
      stack
    } = error || {};
    const syncObject = {
      id,
      value
    };
    syncObject.error = error ? {
      message,
      stack
    } : null;
    const data = success(syncObject, {
      action: 'setValue',
      requestId: null
    });
    socket.send(data);
  }

}

module.exports = {
  WebsocketBroker
};