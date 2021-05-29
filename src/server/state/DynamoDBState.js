const { State, Store, Broker } = require('./');
const { Atomic: AtomicState } = require('./Atomic');
const { compile } = require('@state-less/atomic/DynamoDB');
const { broadcast, emit } = require('./util');
const { success } = require('../../lib/response-lib/websocket');

const { put, get, update, del, query } = require('../../lib/dynamodb-lib');
const logger = require('../../lib/logger');
const { Pinpoint } = require('aws-sdk');
const { v4 } = require('uuid');
const { encryptValue } = require('../pipes/Crypt');
const { SERVER_ID } = require('../../consts');
class LambdaBroker extends Broker {
    constructor(io, options = {}) {
        super(options);
        const { getScope = this.getScope } = options;
        Object.assign(this, { getScope });
    }

    getScope(socket, options) {
        let { scope = 'client' } = options;
        return scope === 'client' ? socket.id : scope;
    }

    //rename to publish
    async sync(state, connection, requestId) {
        if (connection.endpoint === 'localhost')
            return;
            
        const { id, value, error } = state;
        // const {message, stack} = error || {};
        const syncObject = {
            id, value
        };
        const data = success(syncObject, { action: 'setValue', requestId });
        try {
            return await emit(connection, data);;
        } catch (e) {
            await state.unsync(this, connection);
        }
    };


    async consume(state) {
    }
};

const copyStateVariables = ({ key, scope, id }) => ({ key, scope, id })
class DynamoDBState extends AtomicState {
    constructor(def, options) {
        super(def, options);
        Object.freeze(this.value)
        this.setValue = this.setValue.bind(this);
    }

    compileExpression(nextValue) {
        const { key, value, updateEquation } = this;
        if (value.length) {
            if (value.length !== nextValue.length) {
                throw new Error(`Atomic arrays need to be of same length! Reveived ${value} ${nextValue}`)
            }
            const trees = Object.values(value).map((val, i) => {
                return updateEquation(val, nextValue[i]);
            })
            const updateEq = this.compile(trees)
            return updateEq
        }
    }

    compile(...trees) {
        return compile(...trees);
    }

    async setInternalValue(value) {
        this.value = value;
    }

    async setValue(value, initial) {
        if (Array.isArray(value) && initial) {
            const fakeArray = { ...this.value, $$isArray: true};
            fakeArray.length = this.value.length;

            await put({ ...this, value: fakeArray }, 'dev2-states')
            this.value = value;
        } else if (!initial && this.isAtomic) {
            const expr = this.compileExpression(value);
            const { key, scope, id } = this;
            await update({ key, scope, id }, expr, 'dev2-states');
            this.value = value;
        } else {
            // const encrypted = JSON.stringify(encryptValue(value));
            const { key, scope, id } = { ...this };
            const response = await put({ key, scope, id, value }, 'dev2-states');
            this.value = value;
        }

        this.emit('setValue', this);

        /** 
         * Execute the sync after the callstack completed
         * otherwise it can happen that the client
         * tries to render a component which doesn't yet 
         * exist on the serverside
         */
        setTimeout(() => {
          DynamoDBState.sync(this, new LambdaBroker);
        }, 10)

    }

    async publish(broker, connectionInfo, requestId) {
        super.publish();
        return await DynamoDBState.sync(this, broker, requestId);
    }

    async sync(broker, connectionInfo, requestId) {
        const { key, scope } = this;
        super.sync(broker, connectionInfo, requestId);

        try {
            let res = await put({ id: connectionInfo.id, key: `${scope}:${key}`, connectionInfo }, 'dev2-subscriptions')
            res = await put({ id: `${scope}:${key}`, key: connectionInfo.id, connectionInfo }, 'dev2-subscriptions')
            return void 0;

        } catch (e) {
        }

    }
    async unsync(broker, connectionInfo) {
        const { key, scope } = this;
        try {
            let res = await del({ id: connectionInfo.id, key: `${scope}:${key}` }, 'dev2-subscriptions')
            res = await del({ key: connectionInfo.id, id: `${scope}:${key}` }, 'dev2-subscriptions')

            return res;
        } catch (e) {
            throw e;
        }

    }
    async getValue(key) {
        let state;
        try {
            state = await get({ key: this.key, scope: this.scope }, 'dev2-states');
        } catch (e) {
        }
        if (state.Item) {
            if (!Array.isArray(state.Item.value) && state.Item.value?.$$isArray) {
                this.value = Array.from(state.Item.value);
            } else {
                this.value = state.Item.value;
            }
            const { id, defaultValue, atomic, isAtomic } = state.Item;
            Object.assign(this, { id, defaultValue, atomic, isAtomic });
            return true;
        } else {
            return null;
        }
    }
}
DynamoDBState.sync = async (instance, broker, requestId) => {
    const { scope, key } = instance;
    State.sync(instance);
    const result = await query({ id: `${scope}:${key}` }, 'dev2-subscriptions')
    if (!result.Items) {
        throw new Error(`Could not get state subscriptions for state ${instance}`)
    }

    const { Items: subscriptions } = result;

    try {

        const syncResult = await Promise.all(subscriptions.map((item) => {
            const { connectionInfo } = item;
            return broker.sync(instance, connectionInfo, requestId)
        }));
        return syncResult;
    } catch (e) {
        throw e;
    }
};

class DynamodbStore extends Store {
    constructor(options = {}) {
        const { key = SERVER_ID, parent = null, autoCreate = false, onRequestState, StateConstructor = DynamoDBState, TableName, broker } = options;
        super({ key, parent, autoCreate, onRequestState, StateConstructor, broker })
        Object.assign(this, { TableName })
        this.useState = this.useState.bind(this);
    }

    async has(stateKey, scope = "base") {
        if (super.has(stateKey)) {
            return true;
        }
        const state = await get({ key: stateKey, scope: scope }, 'dev2-states');
        const hasState = !!state.Item;

        return hasState;
    }

    async get(key, def, options, ...args) {
        const { cache = "CACHE_FIRST" } = options;

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
        //TODO: Refactor. Make this a static method that writes to the instance from the outside.
        //Void!
        await state.getValue();

        return state;

    }
    clone(...args) {
        return new DynamodbStore(...args);
    }

    async useState(key, def, options = {}, ...args) {
        const { cache = "CACHE_FIRST" } = options;
        this.validateUseStateArgs(key, def, options, ...args);
        const hasKey = await this.has(key, options.scope);

        if (hasKey)
            return await this.get(key, def, options, ...args);


        if (this.autoCreate) {
            const state = this.createState(key, def, options, ...args);
            await state.setValue(def, true);
            return state;
        }

        if (options.throwIfNotAvailable || !this.autoCreate) {
            this.throwNotAvailble(key);
        }

    }
}
module.exports = {
    DynamoDBState,
    DynamodbStore,
    LambdaBroker
}