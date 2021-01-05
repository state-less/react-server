const AWS = require("aws-sdk");
const exprts = require("l0g");
const {ScanTableParams, PutParams, GetParams, QueryByKeysParams, DeleteParams, UpdateParams} = require('./params')

const ACTIONS = {
    GET: 'get',
    DELETE: 'delete',
    PUT: 'put',
    SCAN: 'scan',
    UPDATE: 'update',
    BATCH_WRITE: 'batchWrite'
}

async function call(action, params) {
    const dynamoDb = new AWS.DynamoDB.DocumentClient();
    try {

        return await dynamoDb[action](params).promise();
    } catch (e) {
        throw new Error(`Malformed query ${action} ${JSON.stringify(params)}. Error ${e}` )
        process.exit(0);
    }
}

async function tryCall (action, params) {
    try {
        return call (action, params);
    } catch (e) {

    } 
}

async function put (data, TableName) {
    return await  tryCall (ACTIONS.PUT, PutParams(data, TableName))
}

async function update (key, expr, TableName) {
    return await  tryCall (ACTIONS.UPDATE, UpdateParams(key,expr, TableName))
}

async function get (key, TableName) {
    return await  tryCall (ACTIONS.GET, GetParams(key, TableName))
}

async function del (data, TableName) {
    return await  tryCall (ACTIONS.DELETE, DeleteParams(data, TableName))
}

async function scan (params) {
    return await tryCall (ACTIONS.SCAN, params)
}

async function getAllFromTable (TableName) {
    return await scan(ScanTableParams(TableName));
}

async function tryGetAllFromTable (TableName) {
    try {
        return getAllFromTable (TableName);
    } catch (e) {
    }
}

module.exports = {
    put, del, get, update,  tryGetAllFromTable
}