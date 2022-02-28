"use strict";

var _logger2 = _interopRequireDefault(require("../../lib/logger"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const {
  useAsyncState,
  getScopedStore,
  getAuthorization
} = require("./");

const logger = _logger2.default.scope("state-server.aws.handler");

const ConnectionHandler = (broker, store, eventType) => async (connectionInfo, data = {}) => {
  const {
    key = "votes",
    scope,
    defaultValue = null,
    options = {}
  } = data;
  const scopedStore = getScopedStore(broker, store, data, connectionInfo);
  const authorized = getAuthorization(scopedStore, key, data, connectionInfo);
  const state = await useAsyncState(scopedStore, key, defaultValue, {
    cache: "NETWORK_FIRST",
    ...options,
    connectionInfo,
    throwIfNotAvailable: true
  });

  if (eventType === "DISCONNECT") {
    await state.unsync(broker, connectionInfo);
  } else {
    await state.sync(broker, connectionInfo);
  }

  return state;
};

module.exports = {
  ConnectionHandler
};