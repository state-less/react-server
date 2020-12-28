const { v4: uuidv4 } = require("uuid");
const ee = require('event-emitter');
const {EVENT_STATE_ERROR, EVENT_STATE_USE, EVENT_STATE_SET, EVENT_STATE_PERMIT, EVENT_STATE_CREATE, EVENT_STATE_REQUEST, EVENT_SCOPE_CREATE, EVENT_STATE_DECLINE} = require('../consts');

const logger = require('../lib/logger');

const {isFunction} = require('common-fns');

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
        return scope==='client'?socket:scope;
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
        logger.info`Syncing state ${state} with socket ${socket.id}. ${state.args.clientId}`
        const {id, args: {clientId}, value} = state;
        socket.emit(EVENT_STATE_SET+':'+id, {
            id, value, clientId
        })
        socket.emit(EVENT_STATE_SET+':$'+clientId, {
            id, value, clientId
        })
    };
}

class Store {
    static STATE_PERMIT_DEFAULT = false;
    constructor (options = {}) {
        const {key, parent = null, autoCreate = false, onRequestState} = options;
        this.map = new Map;
        this.actions = new Map;
        this.scopes = new Map;
        Object.assign(this, {key, parent, autoCreate, onRequestState});
    }
    
    has = (...args) => {
        return this.map.has(...args);
    }

    get (...args) {
        return this.map.get(...args);
    }

    scope (key, ...args) {
        if (this.scopes.has(key)) {
            return this.scopes.get(key);
        }

        const {autoCreate, onRequestState} = this;
        const store = new Store({autoCreate, key, parent: this, onRequestState});

        this.scopes.set(key, store);

        store.actions = this.actions;

        this.emit(EVENT_SCOPE_CREATE, store, key, ...args);
        return store;
    }

    createState = (key, def, ...args) => {
        const state = new State(def , {args});

        if (!key) 
            key = state.id;
            
        state.key = key;
        state.scope = this.key;

        this.map.set(key, state);

        this.emit(EVENT_STATE_CREATE, this, state, key, ...args);
        return state;
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

    useState = (key, def, ...args) => {
        this.emit(EVENT_STATE_USE, key, def, ...args);

        logger.info`Using state ${key}. Has state ${this.has(key)}. Id: ${this.get(key)?.id} Scope: ${this.key}`;
        if (this.has(key))
            return this.get(key);
        
        if (this.autoCreate)
            return this.createState(key, def, ...args);

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
    }

    
}
ee(Store.prototype);

class State {
    static genId () {
        return uuidv4();
    }

    constructor (defaultValue, options = {}) {
        const {syncInitialState = false, args} = options;

        const id = State.genId();

        const instanceVariables = {id, args, value: defaultValue, syncInitialState, brokers: []};
        Object.assign(this, instanceVariables);    
        
        if (syncInitialState)
            setImmediate(() => {
                this.setValue(defaultValue);
            })
    }

    setValue = (value) => {
        logger.debug`Setting value of ${this}.`
        this.value = value;
        State.sync(this);
        return this;
    }

    setError = (error) => {
        logger.warning`Setting error of ${this}.`
        this.error = error;
        State.sync(this);
    }

    sync = (broker, ...args) => {
        logger.debug`Syncing ${this} over ${broker}`
        this.brokers.push([broker, args]);
        State.sync(this);
        return this;
    }

    unsync = (broker, filterFn) => {
        logger.debug`Unsyncing ${this.brokers}`;
        this.brokers = this.brokers.filter((entry) => {
            const [_broker, _args] = entry;
            const match = filterFn(_args);
            logger.debug`Unsyncing ${broker} ${_broker}. Filtered ${_broker !== broker && !match}`;
            return _broker !== broker && !match;
        });
        logger.debug`Unsynced ${this.brokers}`;

    }

    static sync (instance) {
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
}


logger.setState(State);
module.exports = {
    State,
    SocketIOBroker,
    Store,
}   