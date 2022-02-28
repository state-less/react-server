const { success } = require("../../lib/response-lib/websocket");
const { Broker } = require("../state");

const EVENT_STATE_SET = "setState";

class WebsocketBroker extends Broker {
  /**
   * WebsocketBroker brokering states between server and client
   */
  constructor(options = {}) {
    super(options);
    const { getScope = this.getScope, activeConnections = {} } = options;
    Object.assign(this, { getScope, activeConnections });
  }

  getScope(socket, options) {
    let { scope = "$client" } = options;
    return scope === "$client" ? socket.id : scope;
  }

  emitError(socket, options, message) {
    socket.emit(EVENT_STATE_ERROR + ":" + options.clientId, {
      error: message,
      ...options,
    });
  }

  emit(socket, event, message) {
    socket.emit(event, message);
  }
  syncInitialState(state, socket, options) {
    const { id, value } = state;
    socket.emit(EVENT_STATE_CREATE + ":" + options.clientId, {
      id,
      value,
      ...options,
    });
  }

  sync(state, connectionInfo) {
    const { activeConnections } = this;
    const { id: clientId, requestId, requestType } = connectionInfo;
    const { id, value, error } = state;
    const { message, stack } = error || {};
    const syncObject = {
      id,
      value,
    };

    syncObject.error = error ? { message, stack } : null;

    const data = success(syncObject, { action: "setValue", requestId });
    const socket = activeConnections[clientId];

    if (!socket) {
      throw new Error(
        `Invalid sync attempt with non existent socket '${clientId}'`
      );
    }

    /** Skip initial emit for subscribe requests */
    socket.send(data);
  }
}

module.exports = {
  WebsocketBroker,
};
