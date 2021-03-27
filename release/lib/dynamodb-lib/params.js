"use strict";

const PutParams = (Item, TableName) => {
  const params = {
    TableName,
    Item
  };
  return params;
};

const UpdateParams = (Key, UpdateExpressions, TableName) => {
  const params = {
    TableName,
    Key,
    ...UpdateExpressions,
    ReturnValues: "UPDATED_NEW"
  };
  return params;
};

const GetParams = (Key, TableName) => {
  const params = {
    TableName,
    Key
  };
  return params;
};

const DeleteParams = (Key, TableName) => {
  const params = {
    TableName,
    Key
  };
  return params;
};

const QueryParams = (Key, TableName) => {
  const [key, value] = Object.entries(Key)[0];
  const params = {
    TableName,
    KeyConditionExpression: '#key = :hval',
    ExpressionAttributeValues: {
      ':hval': value
    },
    ExpressionAttributeNames: {
      '#key': key
    }
  };
  return params;
};

const ScanTableParams = TableName => ({
  TableName
});

module.exports = {
  PutParams,
  DeleteParams,
  GetParams,
  ScanTableParams,
  UpdateParams,
  QueryParams
};