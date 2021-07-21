const logger = require("../lib/logger")
const { failure, success } = require('../lib/response-lib/websocket');


const WebSocket = require('ws');
const { WebsocketBroker } = require("../server/brokers/WebSocket");
const { render } = require("../runtime");
const { ConnectionHandler } = require("../server/handler/WebSocket");
const { ACTION_RENDER } = require("../consts");
const { Component } = require("../server/component");
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { recover } = require('../lib/web3-util');
const { Streams } = require("../Stream");
const { Stream } = require('../components')

const activeConnections = {}
const broker = new WebsocketBroker({ activeConnections });

const reduce = {
    Lookup: (key) => (lkp, cur) => {
        lkp[cur[key]] = cur;
        return lkp;
    }
};

const flatReduce = (arr, ...args) => arr.flat().reduce(...args);
const flatLkp = (arr, key) => flatReduce(arr, reduce.Lookup(key), {});

const WebSocketRenderer = async (props) => {
    const { children, store, secret } = props;

    const Server = [children].flat().find(c => c.component === 'Server');
    // const components = flatLkp([Server.props.children], 'key');
    const server = WebSocketServer(props)
    handleRender(server, secret, null, store);
    return { server, handler: (...args) => handleRender(server, secret, ...args) }
}
WebSocketRenderer.server = true;

const WebSocketServer = (props) => {
    const { port = 8080, children } = props;
    const extend = { port };

    const wss = new WebSocket.Server({
        perMessageDeflate: {
            zlibDeflateOptions: {
                // See zlib defaults.
                chunkSize: 1024,
                memLevel: 7,
                level: 3
            },
            zlibInflateOptions: {
                chunkSize: 10 * 1024
            },
            // Other options settable:
            clientNoContextTakeover: true, // Defaults to negotiated value.
            serverNoContextTakeover: true, // Defaults to negotiated value.
            serverMaxWindowBits: 10, // Defaults to negotiated value.
            // Below options specified as default values.
            concurrencyLimit: 10, // Limits zlib concurrency for perf.
            threshold: 1024 // Size (in bytes) below which messages
            // should not be compressed.
        },
        ...extend
    });

    return wss;
}

const emit = (socket, data) => {
    socket.send(data);
};

const componentCache = {};
const handleRender = (wss, secret, streams, store) => {
    wss.on('connection', (socket, req) => {
        let challenge;

        const clientId = req.headers['sec-websocket-key']
        const connectionInfo = {
            endpoint: 'localhost',
            id: clientId
        }

        activeConnections[clientId] = socket;

        store.on('setValue', () => {
            process.exit(0);
        });
        socket.on('message', async (data) => {
            const json = JSON.parse(data);
            const { action, key, componentKey, scope, props = {}, options, headers, requestType } = json;
            if (action === ACTION_RENDER) {

                const comp = Component.instances.get(key);

                try {
                    const res = await render(comp, props, { ...connectionInfo, headers });
                    socket.send(success(res, { action: ACTION_RENDER, routeKey: ACTION_RENDER, key }));
                } catch (e) {
                    const { message, stack } = e;
                    socket.send(failure({
                        message,
                        stack
                    }, {
                        action: ACTION_RENDER,
                        routeKey: ACTION_RENDER,
                        type: 'error'
                    }));
                }

            }

            if (action === 'stream') {
                const { name, id } = json;
                const stream = Stream.instances.get(name)
                stream.stream.addSocket(socket, { id });
                stream.stream.write({ foo: 'bar' }, { id })
                console.log("STREAM", stream)
            }

            if (action === 'auth') {
                const { id, phase } = json;
                if (phase === 'challenge')
                    crypto.randomBytes(8, function (err, buffer) {
                        const token = buffer.toString('hex');
                        challenge = `Please sign this message to prove your identity: ${token}`
                        socket.send(success(challenge, {
                            action: 'auth',
                            phase: 'challenge',
                            routeKey: 'auth',
                            type: 'response',
                            id
                        }));
                    });
                if (phase === 'response') {
                    const { challenge, response } = json;
                    const address = recover(challenge, response)
                    const token = jwt.sign({
                        exp: Math.floor(Date.now() / 1000) + (60 * 60),
                        iat: Date.now() / 1000,
                        address
                    }, secret);

                    socket.send(success(token, {
                        action: 'auth',
                        phase: 'response',
                        routeKey: 'auth',
                        type: 'response',
                        address,
                        id
                    }));
                }
            }

            if (action === 'call') {
                const { handler, componentKey, args, name, id } = json;
                const comp = Component.instances.get(componentKey);

                let res;
                try {
                    res = await render(comp, props, { ...connectionInfo, headers });
                } catch (e) {
                    const { message, stack } = e;
                    socket.send(failure({ message, stack }, {
                        action: 'call',
                        routeKey: 'call',
                        phase: 'render',
                        type: 'error',
                        id
                    }));
                }
                const action = res.props.children.find((action) => action?.props?.name === name);

                if (!action) {
                    throw new Error('Action ${name} not available');
                } else if (!action.props.boundHandler[handler]) {
                    throw new Error('No handler ${handler} defined for action ${action}');
                }
                console.log("Invoking handler ", action.props.boundHandler[handler]);
                try {
                    if (action.props.boundHandler.use && typeof action.props.boundHandler.use === 'function') {
                        const useRes = await action.props.boundHandler.use({
                            socket,
                            connectionInfo,
                            data: json
                        }, ...args);
                        console.log("USE RES", useRes)
                    }
                    const res = await action.props.boundHandler[handler]({ socket, connectionInfo }, ...args);
                    socket.send(success(res, {
                        action: 'call',
                        routeKey: 'call',
                        id
                    }));
                } catch (e) {
                    const { message, stack } = e;
                    socket.send(failure({ message, stack }, {
                        action: 'call',
                        routeKey: 'call',
                        type: 'error',
                        id
                    }));
                }

            }

            if (action === 'useState') {
                const { action, key, scope, requestId, props, options } = json;
                const comp = Component.instances.get(key);


                const handler = ConnectionHandler(broker, store, 'USE_STATE');
                /** TODO: verify why socket is being passed instaed of connectioninfo */
                // const state = await handler(socket, {key, scope, requestId, props, options})
                const state = await handler(connectionInfo, { key, scope, requestId, props, options, requestType })
                /** TODO: why is this being emitted a second time */
                // const {id, createdAt} = state;
                // await emit(socket, success({id, createdAt}, {action:'setValue', routeKey: 'useState', requestId}));

                // process.exit(0);

            }
            // const state = connHandler({id:key, endpoint: 'http://localhost:8080'}, {key, scope, options});
        })
    })
}
module.exports = {
    WebSocketRenderer,
    activeConnections
}