const logger = require("../lib/logger")
const { failure, success } = require('../lib/response-lib/websocket');


const WebSocket = require('ws');
const { WebsocketBroker } = require("../server/brokers/WebSocket");
const { render } = require("../runtime");
const { ConnectionHandler } = require("../server/handler/Websocket");
const { ACTION_RENDER } = require("../consts");
const { Component } = require("../server/component");

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
    const { children: Server, store } = props;
    const components = flatLkp([Server.props.children], 'key');
    const server = WebSocketServer(props)
    handleRender(server, components, store);
    return { server, handler: (...args) => handleRender(server, ...args) }
}
WebSocketRenderer.server = true;

const WebSocketServer = (props) => {
    const { port = 8080, } = props;
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
const handleRender = (wss, components, store) => {
    wss.on('connection', (socket, req) => {
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
            const { action, key, componentKey, scope, props = {}, options, requestType } = json;
            if (action === ACTION_RENDER) {
                if (!componentCache[key]) {
                    componentCache[key] = components[key];
                }

                const comp = componentCache[key];

                try {
                    const res = await render(comp, props, connectionInfo);
                    socket.send(success(res, { action: ACTION_RENDER, routeKey: ACTION_RENDER, key }));
                } catch (e) {
                }

            }
            if (action === 'call') {
                const { handler, componentKey, args, name, id } = json;
                const comp = components[componentKey];
                const comp2 = Component.instances.get(componentKey);
                const res = await render(comp2, props, connectionInfo);
                const action = res.props.children.find((action) => action?.props?.name === name);

                if (!action) {
                    throw new Error('Action ${name} not available');
                } else if (!action.props.boundHandler[handler]) {
                    throw new Error('No handler ${handler} defined for action ${action}');
                }
                console.log("Invoking handler ", action.props.boundHandler[handler]);
                try {
                    const res = await action.props.boundHandler[handler]({ socket: connectionInfo }, ...args);
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
                const comp = components[key];

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