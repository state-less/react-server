"use strict";
const {useAsyncState, getScopedStore, getAuthorization} = require('./');

const _logger = require('../../lib/logger');

const logger = _logger.scope('state-server.aws.handler');
const {v4} = require('uuid');

const ConnectionHandler = (broker, store, eventType) => {
  if (eventType === 'USE_STATE') {
    return async (connectionInfo, data = {}) => {
      const {
        key = "votes",
        scope,
        defaultValue = null,
        options = {}
      } = data;
      logger.warning`Handling connections ${broker} ${store} ${connectionInfo}`;
      const scopedStore = getScopedStore(broker, store, data, connectionInfo);
      logger.warning`Scoped store ${store}`;
      const authorized = getAuthorization(scopedStore, key, data, connectionInfo);
      logger.warning`Authorized  ${authorized}`;
      const state = await useAsyncState(scopedStore, key, defaultValue, {
        cache: 'NETWORK_FIRST',
        ...options,
        connectionInfo,
        throwIfNotAvailable: true
      });
    
      if (eventType === 'DISCONNECT') {
        logger.warning`Unsyncing state ${state}`;
        await state.unsync(broker, connectionInfo);
      } else {
        logger.warning`Syncing State ${state}`;
        await state.sync(broker, connectionInfo);
      }
    
      logger.warning`Synced State ${state}`;
      return state;
    };
  }
  if (eventType === 'SUBSCRIBE') {
    return (client) => {
      logger.info`Subscribing to state updates using client ${client}`;
      client.on('open', (socket) => {
        console.log("Client opened, subscribing create state")

        store.on('createState', (store, state, key, ...args) => {
          logger.log`State created ${key}`;
          const subId = v4();
          const action = {"action":"useState","key":state.key,"scope":store.key,"requestId":subId,"options":{}}
    
          client.send(JSON.stringify(action));
          client.on('message', (data) => {
            logger.log`State update reveived `
            const json = JSON.parse(data);
            if (json.action === 'setValue') {

              const body = JSON.parse(json.body);
              if (body.id === state.id) {
                const value = body.value;
                
                logger.warning`Setting state vlaue ${value}`;
                state.setInternalValue(value);
              }
            }
              // process.exit(0);
          })
        })
      })
    }
  }
  return async (connectionInfo , data = {}) => {
    logger.error`Creating connection handler for broker ${broker.constructor}. Store: ${store.constructor}. Connection: ${connectionInfo} Data: ${data}`;

    const {key, defaultValue = null, options = {
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
    
    if (eventType === 'DISCONNECT') {
      logger.warning`Unsyncing state ${state}`;
      await state.unsync(broker, connectionInfo);
    } else {
      logger.warning`Syncing State ${state}`;
      await state.sync(broker, connectionInfo);
    }

    logger.warning`Synced State ${state}`;
    return state;
  };
}
module.exports = {
  ConnectionHandler
};