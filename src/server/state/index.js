const { v4: uuidv4 } = require("uuid");
const ee = require('event-emitter');
const {EVENT_STATE_ERROR, EVENT_STATE_USE, EVENT_STATE_SET, EVENT_STATE_PERMIT, EVENT_STATE_CREATE, EVENT_STATE_REQUEST, EVENT_SCOPE_CREATE, EVENT_STATE_DECLINE} = require('../../consts');

const logger = require('../../lib/logger');

const isFunction = fn =>  'function' === typeof fn;

class Broker {
}
ee(Broker.prototype);

class SocketIOBroker extends Broker {   
    constructor (io, options = {}) {
        super(options);
        const {getScope = this.getScope} = options;
        Object.assign(this, {getScope});
    }


    getScope (socket, options) {
        let {scope = 'client'} = options;
        return scope==='client'?socket.id:scope;
    }

    emitError (socket, options, message) {
        logger.warning`Emitting error event (${EVENT_STATE_ERROR+':'+options.clientId}) ${message} to client ${socket.id}`
        socket.emit(EVENT_STATE_ERROR+':'+options.clientId, {error: message, ...options});
    }

    emit (socket, event, message) {
        socket.emit(event, message);
    }
    syncInitialState (state, socket, options) {
        const {id, value} = state;
        socket.emit(EVENT_STATE_CREATE+':'+options.clientId, {id, value, ...options});
    }

    sync (state, socket) {
        logger.info`Syncing state ${state} with socket ${socket.id}.`
        const {id, value, error} = state;
        const {message, stack} = error || {};
        const syncObject = {
            id, value
        };

        syncObject.error = error?{message, stack}:null;

        socket.emit(EVENT_STATE_SET+':'+id, syncObject)
    };
}

class Store {
    constructor (options = {}) {
        const {key = 'base', parent = null, autoCreate = false, onRequestState, StateConstructor = State} = options;
        this.map = new Map;
        this.actions = new Map;
        this.scopes = new Map;
        this.StateConstructor = StateConstructor;
        logger.info`State constructor ${this.StateConstructor }`
        Object.assign(this, {key, parent, autoCreate, onRequestState});
        this.useState = this.useState.bind(this);
    }
    
    has (...args) {
        return this.map.has(...args);
    }

    get (...args) {
        return this.map.get(...args);
    }

    purge = () => {
        logger.info`Purgin states. ${this.scopes}`;
        this.map.forEach((state) => {
            const [options = {}] = state.args || [];
            if (options.ttl) {
                logger.warning`State ${state} has a ttl ${options.ttl}`
            }
            if (options.ttl && +new Date - state.createdAt > options.ttl) {
                logger.error`State ${state} expired. Removing from store`;
                this.deleteState(state.key);
            }
        })
        this.scopes.forEach((scope) => {
            scope.purge();
        })
    }

    clone (...args) {
        return new Store(...args);
    }
    scope (key, ...args) {
        const {StateConstructor, ...rest} = this;
        if (this.scopes.has(key)) {
            return this.scopes.get(key);
        }

        if (/\./.test(key)) {
            key = key.split('.');
            if (key [0] === this.key)
            return this.scope(key.slice(1), ...args);
        }
        
        logger.scope('state-server.handler').warning`Getting scope ${key}`
        if (Array.isArray(key) && this.scopes.has(key[0])) {
            return this.scopes.get(key[0]).scope(key.slice(1), ...args)
        } else if (Array.isArray(key) && key.length === 0) {
            logger.scope('state-server.handler').warning`Getting this store ${this}`

            return this;
        } 
        const {autoCreate, onRequestState} = this;
        logger.debug`Creating new store ${StateConstructor}`
        const store = this.clone({...rest, autoCreate: true, onRequestState, StateConstructor,key: `${this.key}.${key}`, parent: this});

        this.scopes.set(key, store);

        store.actions = this.actions;

        this.emit(EVENT_SCOPE_CREATE, store, key, ...args);
        return store;
    }

    path (...keys) {

    }

    createState = (key, def, options = {}, ...args) => {
        const {StateConstructor} = this;
        const state = new StateConstructor(def , options, ...args);

        if (!key) 
            key = state.id;
            
        state.key = key;
        state.scope = this.key;
        logger.log`Creating state with options ${options} ${def}`
        state.options = options;
        state.args = args;

        this.map.set(key, state);

        this.emit(EVENT_STATE_CREATE, this, state, key, ...args);
        return state;
    }

    deleteState = (key) => {
        logger.error`Deleting state with key ${key}`
        this.map.delete(key);
    }

    /**
     * @description Callback to accept or deny requests to use a state.
     * @param {any} key - The key of the state.
     * @param {*} options - The options
     * @param  {...any} args - Additional arguments
     */
    onRequestState = (key, options, ...args) => false;

    requestState = (key, options, ...args) => {
        this.emit(EVENT_STATE_REQUEST, key, options, ...args);

        //Deny all state requests by default
        let permitted = Store.STATE_PERMIT_DEFAULT;
        if (isFunction(this.onRequestState)) {
            permitted = this.onRequestState(key, options, ...args);
        }

        if (permitted) {
            this.emit(EVENT_STATE_PERMIT, key, options, ...args);
        } else {
            this.emit(EVENT_STATE_DECLINE, key, options, ...args);
            
        }
        return permitted;
    }

    validateUseStateArgs (key, def, options = {}, ...args) {
        this.emit(EVENT_STATE_USE, key, def, ...args);

        // const {scope, ...rest} = options;

        if (typeof key !== 'string') {
            logger.warning`Key is not of type string. Are you sure you're passing a key?`;
        }

        if (def?.scope) {
            logger.warning`You're passing a 'scope' property in the 'defaultValue' argument . Perhaps you meant to pass them to options instead?`;

        }
        // if (scope) {
        //     return this.scope(scope).useState(key, def, {...rest}, ...args);
        // }
        logger.info`Using state ${key}. Has state ${this.has(key)}. Scope: ${this.key}`;
        options.scope = options.scope || this.key;
    }

    useState (key, def, options = {}, ...args) {
        this.validateUseStateArgs(key, def, options, ...args);

        if (this.has(key) && this.key === options.scope)
            return this.get(key);
        
        if (this.autoCreate)
            return this.createState(key, def, options, ...args);
    }

    throwNotAvailble (key) {
        throw new Error (`Attempt to use non-existent state '${key}' failed.`);
    }

    action (key, callback) {
        if ('function' !== typeof callback) 
            throw new Error('Expected callback to be of type function.');

        logger.debug`Registering action ${key}.`;

        this.actions.set(key, callback);
    }

    exec = (key, args, ...extra) => {
        const action = this.actions.get(key);

        if (!isFunction(action)) {
            throw new Error('Attemp to call action ${key} failed. Action is not of type function');
        }

        logger.debug`Calling action ${key} with arguments ${args}.`;

        const result = action(...args);

        return result;
    }

    emit = (...args) => {
        //Append events to callstack in order to get chained methods to work.
        setImmediate(() => {
            Store.prototype.emit.call(this, ...args);
        })
        this.parent && this.parent.emit(...args);
    }

    
}
Store.STATE_PERMIT_DEFAULT = false;

ee(Store.prototype);

class State {
    static genId () {
        return uuidv4();
    }

    constructor (defaultValue, options = {}) {
        const {syncInitialState = false, args, ...rest} = options;

        const id = State.genId();

        logger.debug`Creating state with default value ${defaultValue}`
        const instanceVariables = {createdAt: +new Date, id, args, value: defaultValue,defaultValue, syncInitialState, brokers: {}, ...rest};
        Object.assign(this, instanceVariables);    
        
        if (syncInitialState)
            this.setValue(defaultValue, true);
            // setImmediate(() => {
            // })
        this.setValue = this.setValue.bind(this);
    }

    setValue (value) {
        logger.debug`Setting value of ${this}.`
        this.value = value;
        
        return this.constructor.sync(this);
    }

    getValue () {
        return this.value;
    }
    setError = (error) => {
        logger.warning`Setting error of ${this}.`
        this.error = error;
        State.sync(this);
    }

    sync (broker, ...args) {
        logger.debug`Syncing ${this} over ${broker}`
        this.brokers.push([broker, args]);
        State.sync(this);
        return this;
    }

    unsync (broker, filterFn) {
        logger.debug`Unsyncing ${this.brokers}`;
        const index = this.brokers.findIndex((entry) => {
            const [_broker, _args] = entry;
            const match = filterFn(_args);
            logger.debug`Unsyncing ${broker} ${_broker}. Filtered ${_broker !== broker && !match}`;
            return match //_broker == broker //&& !match;
        });
        this.brokers.splice(index, 1);

        logger.debug`Unsynced ${this.brokers}`;
    }


}

State.sync = (instance) => {
    logger.warning`Runnin Sync of normal State`
    instance.brokers.forEach((entry, i) => {
        const [broker, args] = entry;
        logger.debug`Syncing with broker ${i} ${broker}.`
        if (typeof broker === 'function') {
            broker(instance, ...args);
        } else if (broker instanceof Broker) {
            
            broker.sync(instance, ...args);
        }
    })
}

logger.setState(State);
module.exports = {
    State,
    SocketIOBroker,
    Store,
    Broker,
}   