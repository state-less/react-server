"use strict";
const { useAsyncState, getScopedStore, getAuthorization } = require('./');

const _logger = require('../../lib/logger');

const logger = _logger.scope('state-server.aws.handler');
const { v4 } = require('uuid');

const ConnectionHandler = (broker, store, eventType) => {
  if (eventType === 'USE_STATE') {
    return async (connectionInfo, data = {}) => {
      const {
        key,
        scope,
        id,
        defaultValue = null,
        requestId,
        requestType,
        options = {}
      } = data;
      const scopedStore = getScopedStore(broker, store, data, connectionInfo);
      // logger.warning`Scoped store ${store}`;
      const authorized = getAuthorization(scopedStore, key, data, connectionInfo);
      const state = await useAsyncState(scopedStore, key, defaultValue, {
        cache: 'CACHE_FIRST',
        ...options,
        connectionInfo,
        throwIfNotAvailable: true
      });

      if (eventType === 'DISCONNECT') {
        await state.unsync(broker, connectionInfo);
      } else {
        await state.sync(broker, { ...connectionInfo, requestId, requestType });
        if (requestType === 'request')
          await state.publish(broker, { ...connectionInfo, requestId, requestType });
      }

      return state;
    };
  }
  if (eventType === 'SUBSCRIBE') {
    return (client) => {
      client.on('open', (socket) => {

        store.on('createState', (store, state, key, ...args) => {
          const subId = v4();
          const action = { "action": "useState", "key": state.key, "scope": store.key, "requestId": subId, "options": {} }

          client.send(JSON.stringify(action));
          client.on('message', (data) => {
            const json = JSON.parse(data);
            if (json.action === 'setValue') {

              const body = JSON.parse(json.body);
              if (body.id === state.id) {
                const value = body.value;

                state.setInternalValue(value);
              }
            }
          })
        })
      })
    }
  }
  return async (connectionInfo, data = {}) => {
    const { key, defaultValue = null, options = {
    } } = data;
    const scopedStore = getScopedStore(broker, store, options, connectionInfo);
    // logger.warning`Scoped store ${store}`;

    const authorized = getAuthorization(scopedStore, key, options, connectionInfo);
    const state = await useAsyncState(scopedStore, key, defaultValue, {
      ...options,
      connectionInfo
    });

    if (eventType === 'DISCONNECT') {
      await state.unsync(broker, connectionInfo);
    } else {
      await state.sync(broker, connectionInfo);
    }

    return state;
  };
}
module.exports = {
  ConnectionHandler
};