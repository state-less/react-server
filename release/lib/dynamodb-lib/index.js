"use strict";

const AWS = require("aws-sdk");

const {
  ScanTableParams,
  PutParams,
  GetParams,
  DeleteParams,
  QueryParams,
  UpdateParams
} = require('./params');

const ACTIONS = {
  GET: 'get',
  DELETE: 'delete',
  UPDATE: 'update',
  PUT: 'put',
  SCAN: 'scan',
  QUERY: 'query',
  BATCH_WRITE: 'batchWrite'
};

async function call(action, params) {
  const dynamoDb = new AWS.DynamoDB.DocumentClient();
  return await dynamoDb[action](params).promise();
}

async function tryCall(action, params) {
  try {
    return call(action, params);
  } catch (e) {
    throw new Error("wtf");
    process.exit(0);
  }
}

async function put(data, TableName) {
  return await tryCall(ACTIONS.PUT, PutParams(data, TableName));
}

async function get(data, TableName) {
  return await tryCall(ACTIONS.GET, GetParams(data, TableName));
}

async function del(data, TableName) {
  return await tryCall(ACTIONS.DELETE, DeleteParams(data, TableName));
}

async function query(key, TableName) {
  return await tryCall(ACTIONS.QUERY, QueryParams(key, TableName));
}

async function update(key, expr, TableName) {
  return await tryCall(ACTIONS.UPDATE, UpdateParams(key, expr, TableName));
}

async function scan(params) {
  return await tryCall(ACTIONS.SCAN, params);
}

async function getAllFromTable(TableName) {
  return await scan(ScanTableParams(TableName));
}

async function tryGetAllFromTable(TableName) {
  try {
    return getAllFromTable(TableName);
  } catch (e) {}
}

module.exports = {
  put,
  del,
  get,
  tryGetAllFromTable,
  query,
  update
};