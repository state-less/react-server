"use strict";

const AWS = require('aws-sdk');

const {
  tryGetAllFromTable,
  del
} = require('../../lib/dynamodb-lib');

const {
  TableNameWebsocketIDs
} = require('./config');

const Event = {
  getId: event => {
    let id = event.requestContext.connectionId;
    return id;
  },
  getConnInfo: event => {
    const id = Event.getId(event);
    const {
      domainName
    } = event.requestContext;
    const endpoint = `https://${domainName}/${event.requestContext.stage}`;
    const connInfo = {
      id,
      endpoint
    };
    return connInfo;
  }
};

async function broadcast(Data) {
  let promises = [];
  let connections = await tryGetAllFromTable(TableNameWebsocketIDs);
  console.log("connections", connections);
  let {
    Items
  } = connections;

  for (let connection of Items) {
    const promise = emit(connection, Data);
    promises.push(promise);
  }

  await Promise.all(promises);
  console.log("Broadcasted message");
}

async function emit(connection, Data) {
  let promises = [];
  let {
    id: ConnectionId,
    endpoint
  } = connection;
  let client = new AWS.ApiGatewayManagementApi({
    apiVersion: '2018-11-29',
    endpoint
  });
  let promise = client.postToConnection({
    ConnectionId,
    Data
  }).promise();
  promises.push(promise);

  try {
    return await Promise.all(promises);
  } catch (e) {
    console.log("Deleting dangling connection.", e);
    await del({
      id: connection.id
    }, TableNameWebsocketIDs);
    throw e;
  }

  console.log("Broadcasted message");
}

module.exports = {
  broadcast,
  emit,
  Event
};