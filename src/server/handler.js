const ee = require('event-emitter');
const _logger = require('../lib/logger');
const logger = _logger.scope('state-server.handler');

const sendPing = (broker,socket) => broker.emit(socket, 'ping', +new Date);
const getScope = (broker,socket, options) => broker.getScope(socket, options);
const createScope = (store,key) => {
    if (!Array.isArray(key))
        key = [key];

    return key.reduce((store, key) => {
        return store.scope(key);
    }, store)
}

const handleSetState = (broker, store, socket) => (data, options = {}) => {
    const {id, key = id , value} = data;
    const scopeKey = getScope(broker, socket, options);
    const {useState, has} = createScope(store, scopeKey);

    if (!key || !(has(key))) 
        return console.error(`Error setting state with key ${key}`);
        
    const {setValue} = useState(key);
    setValue(value)
}
// const state = require('./state');
/**
 * Default connection handler, takes a broker and a store. - Simply stores states in a store.
 * @param {*} broker - The broker that synchronizes states between server and client. Can be a function or Broker instance.
 * @param {Store} store  - The store used to store the states. Needs to be a instance of Store
 */
const ConnectionHandler = (broker, store = new Store) => (socket) => {
    const states = new Map;

    sendPing(broker, socket);
    socket.on('setState', handleSetState(broker, store, socket));

    socket.on('useState', (key, def, options = {}) => {
        const scope = broker.getScope(socket, options);
        const scopedStore = store.scope(scope, options, socket);
        const {useState} = scopedStore;
        const permitted = store.requestState(key, options, socket);

        logger.info`State ${key} requested. ${scope} Permitting: ${permitted}`
        logger.debug`Store content ${store}`
        if (permitted) {
            let socketSet = states.get(socket);
            if (!socketSet) socketSet = states.set(socket, new Set).get(socket);   
            
            const state = useState(key, def, options, socket);
            if (!socketSet.has(state)) {
                socketSet.add(state);
                state.sync(broker, socket);           
                logger.debug`Syncing state ${state} with socket ${socket}`

                //NOTE: echoing data might pose security risks maybe use configurable whitelists
                broker.syncInitialState(state, socket, options);
            } else {
                logger.debug`${socket} already synced to state ${state}. Doing nothing`
            }
        } else {
            broker.emitError(socket, options, `Request to use state ${key} declined.`);

        }
    })

    socket.on('call', (key, args, options = {}) => {
        const {exec} = store.scope(broker.getScope(socket, options));

        const result = exec(key, args, options);

        logger.warning`Result ${result}`;

        broker.emit(socket, `called:${key}`, result);
    });

    socket.on('disconnect', () => {
        logger.warning`Client ${socket.id} disconnected. ${states.get(socket)}`;
        const syncedStates = states.get(socket);
        logger.log`Synced ${syncedStates}`
        if (syncedStates) {
            syncedStates.forEach((state) => {
                logger.info`Removing socket ${socket.id} from state ${state}`;
                state.unsync(broker, (args) => {
                    const [_socket] = args;
                    return _socket.id === socket.id;
                });
            })
        }

        
        // process.exit(0);
    })
}
ee(ConnectionHandler.prototype);

module.exports = {
    ConnectionHandler
}