"use strict";

const useAsyncState = async (store, key, defaultValue, options) => {
  const {
    useState
  } = store;
  return useState(key, defaultValue, options);
};

const getScopedStore = (broker, store, options, connectionInfo) => {
  const scope = broker.getScope(connectionInfo, options);
  const scopedStore = store.scope(scope, options, connectionInfo);
  return scopedStore;
};

const getAuthorization = (store, key, options, connectionInfo) => {
  return store.requestState(key, options, connectionInfo);
};

module.exports = {
  useAsyncState,
  getScopedStore,
  getAuthorization
};