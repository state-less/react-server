"use strict";
const {useAsyncState, getScopedStore, getAuthorization} = require('./');

const _logger = require('../../lib/logger');

const logger = _logger.scope('state-server.aws.handler');

const ConnectionHandler = (broker, store) => async (connectionInfo , data = {}) => {
  const {key = "votes", defaultValue = null, options = {
    key: 'base'
  }} = data;
  logger.warning`Handling connections ${broker} ${store} ${connectionInfo}`;
  const scopedStore = getScopedStore(broker, store, options, connectionInfo);
  logger.warning`Scoped store ${store}`;

  const authorized = getAuthorization(scopedStore, key, options, connectionInfo);
  logger.warning`Authorized  ${authorized}`;

  const state = await useAsyncState(scopedStore, key, defaultValue, {
    ...options,
    connectionInfo
  });
  logger.warning`Syncing State ${state}`;

  await state.sync(broker, connectionInfo);

  logger.warning`Synced State ${state}`;

};

module.exports = {
  ConnectionHandler
};