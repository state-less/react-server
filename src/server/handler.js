const ee = require('event-emitter');
const logger = require('../lib/logger');
// const state = require('./state');
/**
 * Default connection handler, takes a broker and a store. - Simply stores states in a store.
 * @param {*} broker - The broker that synchronizes states between server and client. Can be a function or Broker instance.
 * @param {Store} store  - The store used to store the states. Needs to be a instance of Store
 */
const ConnectionHandler = (broker, store = new Store) => (socket) => {
    const states = new Map;

    socket.emit('ping', 'ping');

    socket.on('setState', (data, options = {}) => {
        const {id, key = id , value} = data;
        const {useState, has} = store.scope(broker.getScope(socket, options));

        if (!key || !(has(key))) 
            return console.error(`Error setting state with key ${key}`);
            
        const {setValue} = useState(key);

        setValue(value)
    })

    socket.on('useState', (key, def, options = {}) => {
        const scope = broker.getScope(socket, options);
        const {useState} = store.scope(scope, options, socket);
        const permitted = store.requestState(key, options, socket);

        logger.info`State ${key} requested. ${scope} Permitting: ${permitted}`
        if (permitted) {
            let socketSet = states.get(socket);
            if (!socketSet) socketSet = states.set(socket, new Set).get(socket);   
            
            const state = useState(key, def, options, socket);
            logger.debug`Syncing state ${key} with socket ${socket.id}.`

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

    socket.on('disconnect', () => {
        logger.warning`Client ${socket.id} disconnected. ${states.get(socket)}`;
        const syncedStates = states.get(socket);
        logger.log`Synced ${syncedStates}`
        if (syncedStates) {
            syncedStates.forEach((state) => {
                logger.info`Removing socket ${socket.id} from state ${state}`;
                state.unsync(broker, (args) => {
                    const [_socket] = args;
                    return _socket === socket;
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