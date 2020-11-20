const { v4: uuidv4 } = require("uuid");

class Broker {
}

class SocketIOBroker extends Broker {
    constructor (io, options) {
        super(options);
        io.on('connection', (socket) => {
            console.log('a user connected');
        });
    }

    sync (state, socket) {
        const {id, value} = state;
        socket.emit('setState', {
            id, value
        })
    };
}

class Store {
    constructor (options = {}) {
        const {autoCreate = false} = options;
        this.map = new Map;
        this.scopes = new Map;
        Object.assign(this, {autoCreate});
    }
    
    has = (...args) => {
        return this.map.has(...args);
    }

    get (...args) {
        return this.map.get(...args);
    }

    scope (key) {
        if (this.scopes.has(key)) 
            return this.scopes.get(key);

        const {autoCreate} = this;

        const store = new Store({autoCreate, key});
        this.scopes.set(key, store);
        return store;
    }

    createState = (key, def) => {
        const state = new State(def);
        if (!key) 
            key = state.id;
            
        this.map.set(key, state);
        return state;
    }

    useState = (key, def) => {
        if (this.has(key))
            return this.get(key);
        
        if (this.autoCreate)
            return this.createState(key, def);

        throw new Error (`Attempt to use non-existent state '${key}' failed.`);
    }
}

class State {
    static genId () {
        return uuidv4();
    }

    constructor (defaultValue, options = {}) {
        const {syncInitialState = false} = options;

        const id = State.genId();

        const instanceVariables = {id, value: defaultValue, syncInitialState, brokers: []};
        Object.assign(this, instanceVariables);    
        
        if (syncInitialState)
            setImmediate(() => {
                this.setValue(defaultValue);
            })
    }

    setValue = (value) => {
        this.value = value;
        this.brokers.forEach(entry => {
            const [broker, args] = entry;
            if (typeof broker === 'function') {
                broker(this, ...args);
            } else if (broker instanceof Broker) {
                broker.sync(this, ...args);
            }
        })
        return this;
    }

    sync = (broker, ...args) => {
        this.brokers.push([broker, args]);
        return this;
    }
}

module.exports = {
    State,
    SocketIOBroker,
    Store
}   