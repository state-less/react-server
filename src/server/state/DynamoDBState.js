const {State, Store, Broker} = require('./');
const {Atomic: AtomicState} = require('./Atomic');
const {compile} = require('@state-less/atomic/DynamoDB');
const {broadcast, emit} = require('./util');
const {success} = require('../../lib/response-lib/websocket');

const {put, get, update, del, query} = require('../../lib/dynamodb-lib');
const logger = require('../../lib/logger');
const { Pinpoint } = require('aws-sdk');
const { v4 } = require('uuid');
const { encryptValue } = require('../pipes/Crypt');
class LambdaBroker extends Broker {
    constructor (io, options = {}) {
        super(options);
        const {getScope = this.getScope} = options;
        Object.assign(this, {getScope});
    }

    getScope (socket, options) {
        let {scope = 'client'} = options;
        return scope==='client'?socket.id:scope;
    } 

    //rename to publish
    async sync (state, connection, requestId) {
        logger.info`Syncing state ${state} with connection ${connection}.`
        const {id, value, error} = state;
        // const {message, stack} = error || {};
        const syncObject = {
            id, value
        };

        // syncObject.error = error?{message, stack}:null;
        logger.error`Building response data ${syncObject}`;

        const data = success(syncObject, {action: 'setValue', requestId});
        logger.error`Sending data ${data}`;
        try {
            return await emit(connection, data);;
        } catch (e) {
            logger.error`Connection gone, Unsyncing state. Clearing error.`;
            await state.unsync(this, connection);
            // throw e;
        }
    };


    async consume (state) {
        logger.info`Subscribing to state ${state}`;
    }
};

class DynamoDBState extends AtomicState {
    constructor (def, options) {
        logger.info`Creating in memory dynamodb state with options ${options}`
        super(def, options);
        logger.info`Freezing value of atomic state`;
        Object.freeze(this.value)
        this.setValue = this.setValue.bind(this);
    }

    compileExpression(nextValue) {
        const {key, value, updateEquation} = this;
        logger.info`Compiling expression ${value} ${nextValue}`

        /**
         * Compiles an array of numbers to atomic update expressions.
         */
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

        /**
         * Compiles a single number into a atomic update expression.
         */
        if (typeof value === 'number') {
            return this.compile(updateEquation(value, nextValue))
        }
    }

    compile(...trees) {
        logger.info`Compiling atomic update expression ${trees}`;
        return compile(...trees);
    }

    async setInternalValue (value) {
        this.value = value;
    }

    async setValue (value, initial) {
        logger.debug`About to set dynamodb state. ${this.key} ${this.value} -> ${value}`

        if (Array.isArray(value) && initial) {
            console.log (`Setting value ${this.value}`)
            const fakeArray = {...this.value};
            fakeArray.length = this.value.length;
            
            await put({...this, value: fakeArray}, 'dev2-states')
            console.log (`Created state in dynamodb ${this.value}`)
            this.value = value;

            /**
             * TODO: for some reason this.isAtomic is not set correctly even though options.atomic is filled. 
             * analyse.
             */
        } else if (!initial && (this.isAtomic || this.options.atomic)) {
            const expr = this.compileExpression(value);
            logger.debug`Dynamodb update expression. ${expr}`
            const {key, scope} = this;
            await update({key, scope} , expr, 'dev2-states');
            this.value = value;
        } else {
            logger.debug`Setting initial value ${value}`
            // const encrypted = JSON.stringify(encryptValue(value));
            // this.value = encrypted;
            const response = await put({...this, value}, 'dev2-states');
            this.value = value;
            logger.debug`Updated dynamodb state ${response}`

        }
        logger.debug`Updated state in Dynamodb.`

        this.emit('setValue', this);
        return await DynamoDBState.sync(this, new LambdaBroker);

    }

    async sync(broker, connectionInfo, requestId) {
        logger.error`Dynamodb state sync request for broker ${broker}. Endpoint ${connectionInfo}`;
        const {key, scope} = this;
        super.sync(broker, connectionInfo, requestId);
        // console.log (this);
        // process.exit(0)

        try {

            let res = await put({id: connectionInfo.id, key: `${scope}:${key}`, connectionInfo},'dev2-subscriptions')
            res = await put({id: `${scope}:${key}`, key: connectionInfo.id , connectionInfo},'dev2-subscriptions')
            // const res = await update({key, scope}, {
            //     UpdateExpression: 'SET #key.#connection = :value',
            //     ExpressionAttributeValues:{
            //         ":value": connectionInfo,
            //     },
            //     ExpressionAttributeNames: {
            //         "#key":'brokers',
            //         "#connection": connectionInfo.id,
            //     },
            //     ReturnValues:"UPDATED_NEW"
            // }, 'dev2-subscriptions');
            logger.error`Updated connections ${res}`
            logger.warning`Added connection info ${connectionInfo} ${res}`;
            if (this.syncInitialState)
                return await DynamoDBState.sync(this, broker, requestId);
            return void 0;

        } catch (e) {
            logger.error`Error Updating connections in state failed ${e}`
        }

    }
    async unsync (broker, connectionInfo) {
        logger.error`Dynamodb state unsync request for broker ${broker}. Endpoint ${connectionInfo}`;
        const {key, scope} = this;
        try {
            let res = await del({id: connectionInfo.id, key: `${scope}:${key}`},'dev2-subscriptions')
            res = await del({key: connectionInfo.id, id: `${scope}:${key}`},'dev2-subscriptions')

            // const res = await update({key, scope}, {
            //     UpdateExpression: 'REMOVE #key.#connection',
            //     ExpressionAttributeNames: {
            //         "#key":'brokers',
            //         "#connection": connectionInfo.id,
            //     },
            //     ReturnValues:"ALL_NEW"
            // }, 'dev2-subscriptions');
            logger.error`Removed subscription connections ${res}`
            return res;
        } catch (e) {
            logger.error`Error Updating connections in state failed ${e}`
            throw e;
        }

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
            const {id, defaultValue, atomic, isAtomic} = state.Item;
            Object.assign(this, {id, defaultValue, atomic, isAtomic});
            logger.warning`Resolved dynamodb state ${this.value} ${Array.isArray(state.Item)} ${this.value.length}`;
            return true;
        } else {
            logger.warning`State D ${this.key} doesn't exist`
            return null;
        }
    }
}
DynamoDBState.sync = async (instance, broker, requestId) => {
    const {scope, key} = instance;
    logger.error`Syncing dynamodb state ASD ${{id: `${scope}:${key}`}}`;
    
    State.sync(instance);

    const result = await query({id: `${scope}:${key}`}, 'dev2-subscriptions')
    logger.error`Syncing dynamodb state connections :${result.Items}`;

    if (!result.Items) {
        throw new Error(`Could not get state subscriptions for state ${instance}`)
    }

    const {Items: subscriptions} = result;
    logger.error`Syncing dynamodb state connections. subscriptions ${subscriptions}`;

    try {

        const syncResult =  await Promise.all(subscriptions.map((item) => {
            const {connectionInfo} = item;
            logger.error`Syncing dynamodb state to connections ${connectionInfo}`;
            return broker.sync(instance, connectionInfo, requestId)
        }));
        logger.log `Sync result ${syncResult}`
        return syncResult;
    } catch (e) {
        logger.error`Error syncing dynamodb state`
        throw e;
    }
  };

class DynamodbStore extends Store {
    constructor (options = {}) {
        const {key = 'base', parent = null, autoCreate = false, onRequestState, StateConstructor = DynamoDBState, TableName, broker} = options;
        logger.warning`TableName ${TableName}`
        super ({key, parent, autoCreate, onRequestState, StateConstructor, broker})
        Object.assign(this, {TableName})
        this.useState = this.useState.bind(this);
    }

    // init = async () => {
    //     const table = await get({id: this.key});
    //     logger.info`Store table ${table}`
    // }
    async has (stateKey, scope = "base") {
        logger.info`Has state? ${stateKey} ${this.key} ${this.TableName}`
        if (super.has(stateKey)) {
            return true;
        }
        const state = await get({key:stateKey, scope: scope}, 'dev2-states');
        const hasState = !!state.Item;

        return hasState;
    }
    
    async get (key, def, options, ...args) {
        logger.info`STATE QWE getValue ${key} ${options}`
        const {cache = "CACHE_FIRST"} = options;

        if (super.has(key)) {
            const state = super.get(key);
            if (cache !== 'NETWORK_FIRST') {
                return state;
            } else {
                await state.getValue();
                return state;
            }
        }


        const state = this.createState(key, def, options, ...args);
        logger.info`STATE QWE getValue ${key} ${options} ${state}`
        //TODO: Refactor. Make this a static method that writes to the instance from the outside.
        //Void!
        await state.getValue();

        return state;

    }
    clone (...args) {
        logger.info`Creating new Dynamodb store`
        return new DynamodbStore(...args);
    }

    async useState (key, def, options = {}, ...args) {
        const {cache = "CACHE_FIRST"} = options;
        logger.info`Using Dynamodb state '${key}'. Validating ${options}`
        // let state = await super.useState(key, def, options = {}, ...args);
        this.validateUseStateArgs(key, def, options, ...args);
        const hasKey = await this.has(key, options.scope);
        logger.info`Has key ${hasKey} ${options.scope} ${this.key === options.scope}`

        if (hasKey)
            return await this.get(key, def, options, ...args);
        
        // const id = 'temp-'+v4();

        if (this.autoCreate && !options.throwIfNotAvailable) {
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