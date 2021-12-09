const logger = require("../lib/logger")
const { failure, success } = require('../lib/response-lib/websocket');


const WebSocket = require('ws');
const { WebsocketBroker } = require("../server/brokers/WebSocket");
const { render } = require("../runtime");
const { ConnectionHandler } = require("../server/handler/WebSocket");
const { ACTION_RENDER, ACTION_STREAM, ACTION_AUTH, ACTION_CALL, ACTION_USE_STATE } = require("../consts");
const { Component } = require("../server/component");
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { recover } = require('../lib/web3-util');
const { Streams } = require("../Stream");
const { Stream } = require('../components')


import { flatReduce } from '../util/reduce';
import { getSecWebSocketKey, validateSecWebSocketKey } from '../util/socket';

import * as strategies from '../strategies';
import { RenderAction, SocketErrorAction } from '../actions/socket';
import { ErrorMessage } from '../factories/socket'

/**
 * An object containing the active connections to the server.
 */
export const activeConnections = {}


const broker = new WebsocketBroker({ activeConnections });

const flatLkp = (arr, key) => flatReduce(arr, reduce.Lookup(key), {});

/**
 * @typedef WebSocketRendererProps
 * @property {string} secret - A private key or secret used to sign JWT
 * @property {Object} store - The **root** store used by the renderer. 
 * @property {Object} children - The children
 * @returns 
 */

/**
 * The WebSocketRenderer Component.
 * @param {WebSocketRendererProps} props 
 * @returns 
 */
const WebSocketRenderer = async (props) => {
    const { children, store, secret } = props;
    const server = WebSocketServer(props);

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

/**
 * @typedef SocketData
 * @type {object}
 * @property {string} action - The action that shall be performed.
 * @property {string} key - The key of the target component.
 * @property {object} props - Props passed from the client to the component.
 * @property {object} headers - HTTP headers sent with every request (e.g. auth)
 * @property {('request'|'action')} requestType - The requesttype
 * @property {string} requestId - The id of the request. Needs to be returned to the client.
 */

const componentCache = {};
const handleRender = (wss, secret, streams, store) => {
    wss.on('connection', (socket, req) => {
        try {
            let challenge;
            validateSecWebSocketKey(req);
            const clientId = getSecWebSocketKey(req);
            const connectionInfo = {
                endpoint: 'localhost',
                id: clientId
            }

            activeConnections[clientId] = socket;

            store.on('setValue', () => {
                process.exit(0);
            });

            /**
             * Handles socket messages meant for react-server.
             * @param {string} data - The stringified message data
             * @returns 
             */
            const onMessage = async (data) => {
                /**
                 * @type {SocketData}
                 */
                let json;
                try {
                    json = JSON.parse(data);
                } catch (e) {
                    logger.error`Invalid data passed to JSON.parse: '${data}'`
                    return;
                }


                const { action, key, props = {}, headers, requestType } = json;

                if (action === ACTION_RENDER) {
                    const comp = Component.instances.get(key);

                    try {
                        const res = await render(comp, props, { ...connectionInfo, headers });
                        socket.send(success(res, RenderAction({ key })));
                    } catch (e) {
                        socket.send(failure(ErrorMessage(e), RenderErrorAction()));
                    }
                }

                if (action === ACTION_STREAM) {
                    const { name, id } = json;
                    const stream = Stream.instances.get(name)
                    stream.stream.addSocket(socket, { id });
                    stream.stream.write({ foo: 'bar' }, { id })
                    console.log("STREAM", stream)
                }

                if (action === ACTION_AUTH) {
                    const { id, phase } = json;
                    if (phase === 'challenge') {
                        if (headers?.Authorization) {
                            let token;
                            try {
                                token = jwt.verify(headers.Authorization.split(' ')[1], secret);
                                socket.send(success(token, {
                                    action: 'auth',
                                    phase: 'response',
                                    routeKey: 'auth',
                                    type: 'response',
                                    address,
                                    id
                                }));
                            } catch (e) {
                                console.log("Error e", e);
                                socket.send(success(token, {
                                    action: 'invalidate',
                                    phase: 'response',
                                    routeKey: 'auth',
                                    type: 'response',
                                    id
                                }));
                            }
                        } else {
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
                        }
                    }
                    if (phase === 'response') {
                        const { challenge, response, strategy } = json;

                        if (!strategy || !strategies[strategy]) {
                            socket.send(failure({ message: 'Invalid strategy: "' + strategy + '"' }, {
                                action: 'invalidate',
                                routeKey: 'auth',
                                phase: 'response',
                                type: 'error',
                                id
                            }));
                        } else {

                            const strat = strategies[strategy]
                            const address = strat.recover(challenge, response)
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
                }

                if (action === ACTION_CALL) {
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

                if (action === ACTION_USE_STATE) {
                    const { action, key, scope, requestId, props, options } = json;
                    const comp = Component.instances.get(key);

                    const handler = ConnectionHandler(broker, store, 'USE_STATE');
                    const state = await handler(connectionInfo, { key, scope, requestId, props, options, requestType })
                }
            }

            /**
             * This is the entrypoint. Every socket message get's handled here. 
             * This is where rendering happens, actions get run.
             */
            socket.on('message', onMessage)

        } catch (e) {
            socket.send(failure(ErrorMessage(e), SocketErrorAction()));
        }
    })
}

module.exports = {
    WebSocketRenderer,
    activeConnections
}