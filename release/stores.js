"use strict";

const {
  DynamoDBState,
  DynamodbStore
} = require('./server/state/DynamoDBState');

const {
  State,
  SocketIOBroker,
  Store
} = require('./server/state');

const store = new DynamodbStore({
  autoCreate: true,
  StateConstructor: DynamoDBState,
  TableName: 'dev2-states'
});
const publicStore = store.scope('public');
publicStore.autoCreate = true;
module.exports = {
  store,
  publicStore
};