const {Broker} = require('../state');

class WebsocketBroker extends Broker {   
    constructor (options = {}) {
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

module.exports = {
    WebsocketBroker
}