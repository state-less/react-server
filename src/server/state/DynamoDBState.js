const {State, Store, Broker} = require('./');
const {Atomic: AtomicState} = require('./Atomic');
const {compile} = require('@state-less/atomic/DynamoDB');
const {broadcast} = require('./util');
const {success} = require('../../lib/response-lib');

const {put, get, update} = require('../../lib/dynamodb-lib');
const logger = require('../../lib/logger');
const { Pinpoint } = require('aws-sdk');
const { emit } = require('../../../dist/server/state/util');
const { v4 } = require('uuid');

class LambdaBroker extends Broker {
    constructor (io, options = {}) {
        super(options);
        const {getScope = this.getScope} = options;
        Object.assign(this, {getScope});
    }

    getScope (event) {
        return 'base'
    }    

    async sync (state, connection) {
        logger.info`Syncing state ${state} with connection ${connection}.`
        const {id, value, error} = state;
        // const {message, stack} = error || {};
        const syncObject = {
            id, value
        };

        // syncObject.error = error?{message, stack}:null;
        logger.error`Building response data ${syncObject}`;

        const data = success(syncObject);
        logger.error`Sending data ${data}`;
        await emit(connection, JSON.stringify(data));
    };
};

class DynamoDBState extends AtomicState {
    constructor (def, options) {
        logger.info`Creating dynamodb state with options ${options}`
        super(def, options);
        logger.info`Freezing value of atomic state`;
        Object.freeze(this.value)
    }

    compileExpression(nextValue) {
        const {key, value, updateEquation} = this;
        logger.info`Compiling expression ${value} ${nextValue}`
        if (value.length) {
            if (value.length !== nextValue.length) {
                throw new Error(`Atomic arrays need to be of same length! Reveived ${value} ${nextValue}`)
            }
            const trees = Object.values(value).map((val, i) => {
                return updateEquation(val, nextValue[i]);
            })
            const updateEq = this.compile(trees)
            logger.info`Tree is ${updateEq}`
            return updateEq
        }
    }

    compile(...trees) {
        logger.info`Compiling atomic update expression ${trees}`;
        return compile(...trees);
    }
    async setValue (value, initial) {
        logger.debug`About to set dynamodb state. ${this.value} -> ${value}`

        if (Array.isArray(value) && initial) {
            console.log (`Setting value ${this.value}`)
            const fakeArray = {...this.value};
            fakeArray.length = this.value.length;
            await put({...this, value: fakeArray}, 'dev2-states')
            console.log (`Created state in dynamodb ${this.value}`)
            if (initial)
            process.exit(0);

        } else if (!initial && this.isAtomic) {
            const expr = this.compileExpression(value);
            logger.debug`Dynamodb update expression. ${expr}`
            const {key, scope} = this;
            await update({key, scope} , expr, 'dev2-states');
        } else {
            await put(this, 'dev2-states')
        }
        logger.debug`Updated state in Dynamodb.`
        this.value = value;
        await DynamoDBState.sync(this, new LambdaBroker)
        return this;
    }

    async sync(broker, connectionInfo = {
        id: 'mock-client',
        endpoint: 'foo.bar'
      }) {
        logger.error`Dynamodb state sync request for broker ${broker}. Endpoint ${connectionInfo}`;
        const {key, scope} = this;
        try {

            const res = await update({key, scope}, {
                UpdateExpression: 'SET #key.#connection = :value',
                ExpressionAttributeValues:{
                    ":value": connectionInfo,
                },
                ExpressionAttributeNames: {
                    "#key":'brokers',
                    "#connection": connectionInfo.id,
                },
                ReturnValues:"UPDATED_NEW"
            }, 'dev2-states');
            logger.error`Updated connections ${res}`

        } catch (e) {
            logger.error`Error Updating connections in state failed ${e}`
        }
        logger.warning`Added connection info ${connectionInfo} ${res}`;
        DynamoDBState.sync(this, broker);
    }
    async unsync (broker, connectionInfo) {
        logger.error`Dynamodb state unsync request for broker ${broker}. Endpoint ${connectionInfo}`;
        const {key, scope} = this;
        try {

            const res = await update({key, scope}, {
                UpdateExpression: 'REMOVE #key.#connection',
                ExpressionAttributeNames: {
                    "#key":'brokers',
                    "#connection": connectionInfo.id,
                },
                ReturnValues:"ALL_NEW"
            }, 'dev2-states');
            logger.error`Updated connections ${res}`
            return true;
        } catch (e) {
            logger.error`Error Updating connections in state failed ${e}`
            return false;
        }
        logger.warning`Deleted connection info ${connectionInfo} ${res}`;
        // DynamoDBState.sync(this, broker);
    }
    async getValue (key) {
        logger.debug`Getting state from Dynamodb. ${{key:this.key, scope: this.scope}}`

        let state;
        try {
            state = await get({key:this.key, scope: this.scope}, 'dev2-states');
        } catch (e) {
            logger.errror`Error getting state from dynamod ${state}`
        }
        if (state.Item) {

            logger.warning`Dynamodb state ${{key:this.key,scope:this.scope}} ${state}`;
            if (!Array.isArray(state.Item.value) && state.Item.value.length) {
                this.value = Array.from(state.Item.value);
                
            } else {
                this.value = state.Item.value;
            }
            const {brokers, defaultValue} = state.Item;
            Object.assign(this, {brokers, defaultValue});
            logger.warning`Resolved dynamodb state ${this.value} ${Array.isArray(state.Item)} ${this.value.length}`;

        } else {
            logger.warning`State ${this.key} doesn't exist`
        }
        return this;
    }
}
DynamoDBState.sync = async (instance, broker) => {
    logger.error`Syncing dynamodb state ${instance.brokers}`;
    return await Promise.all(Object.values(instance.brokers).map(async (connectionInfo) => {
        logger.error`Syncing dynamodb state ${instance.brokers}`;

      return await broker.sync(instance, connectionInfo);
    }))
  };

class DynamodbStore extends Store {
    constructor (options = {}) {
        const {key = 'base', parent = null, autoCreate = false, onRequestState, StateConstructor = DynamoDBState, TableName} = options;
        logger.warning`TableName ${TableName}`
        super ({key, parent, autoCreate, onRequestState, StateConstructor})
        Object.assign(this, {TableName})
        this.useState = this.useState.bind(this);
    }

    // init = async () => {
    //     const table = await get({id: this.key});
    //     logger.info`Store table ${table}`
    // }
    async has (stateKey) {
        logger.info`Has state? ${stateKey} ${this.key} ${this.TableName}`
        const state = await get({key: stateKey || "ASD", scope: this.key}, this.TableName);
        return !!state.Item
    }
    
    async get (key, def, options, ...args) {
        logger.info`STATE QWE getValue ${key} ${options}`

        const state = this.createState(key, def, options, ...args);
        logger.info`STATE QWE getValue ${key} ${options} ${state}`
        return  await state.getValue();

    }
    clone (...args) {
        logger.info`Creating new Dynamodb store`
        return new DynamodbStore(...args);
    }

    async useState (key, def, options = {}, ...args) {
        logger.info`Using Dynamodb state '${key}'. Validating ${options}`
        // let state = await super.useState(key, def, options = {}, ...args);
        this.validateUseStateArgs(key, def, options, ...args);
        const hasKey = await this.has(key);
        logger.info`Has key ${hasKey} ${this.key === options.scope}`

        if (hasKey && this.key === options.scope)
            return await this.get(key, def, options, ...args);
        
        // const id = 'temp-'+v4();

        if (this.autoCreate) {
            const state = this.createState(key, def, options, ...args);
            await state.setValue(def, true);
            return state;
        }
        this.throwNotAvailble(key);
    }
}
module.exports = {
    DynamoDBState,
    DynamodbStore,
    LambdaBroker
}