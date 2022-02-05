const logger = require("../lib/logger")
const { failure, success } = require('../lib/response-lib/websocket');


const WebSocket = require('ws');
const { WebsocketBroker } = require("../server/brokers/WebSocket");
const { render } = require("../runtime");
const { ConnectionHandler } = require("../server/handler/WebSocket");
const { ACTION_RENDER, ACTION_STREAM, ACTION_AUTH, ACTION_CALL, ACTION_USE_STATE, ACTION_SET_STATE } = require("../consts");
const { Component } = require("../server/component");
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { recover } = require('../lib/web3-util');
const { Streams } = require("../Stream");
const { Stream } = require('../components')


import { flatReduce } from '../util/reduce';
import { getSecWebSocketKey, validateSecWebSocketKey } from '../util/socket';

import * as strategies from '../strategies';
import { RenderAction, RenderErrorAction, SocketErrorAction } from '../actions/socket';
import { ErrorMessage } from '../factories/socket'
import { State } from '../server/state';
import { RenderableComponent, ServerComponent, WebSocketRendererProps } from '../types';

/**
 * An object containing the active connections to the server.
 */
export const activeConnections = {}


const broker = new WebsocketBroker({ activeConnections });
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
const WebSocketRenderer = async (props: WebSocketRendererProps): Promise<ServerComponent> => {
    const { children, store, secret, authFactors } = props;
    const server = WebSocketServer(props);
    handleRender({ server, secret, streams: null, store, authFactors });
    return { type: 'ServerComponent', key: 'server', props, children, server, handler: (...args) => handleRender({ server, secret, streams: null, store, authFactors, ...args }) }
}
WebSocketRenderer.server = true;

interface WebSocketServerProps {
    port?: number,
    children?: any[]
}

interface JSONComponent {

}

const WebSocketServer = (props: WebSocketServerProps): typeof WebSocket.Server => {
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
const handleRender = ({ server, secret, streams, store, authFactors, ...rest }) => {
    server.on('connection', (socket, req) => {
        const handler = ConnectionHandler(broker, store, 'DISCONNECT');

        try {
            let challenge, solvedFactors = authFactors.reduce((lkp, cur) => ({ ...lkp, [cur]: false }), {}),
                identities = {};
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

            const onClose = () => {
                handler(connectionInfo)
            }

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
                    const { id, phase, strategy, data } = json;
                    const strat = strategies[strategy]

                    try {
                        if (!strat) {
                            // socket.send(failure({ message: 'Invalid strategy: "' + strategy + '"' }, {
                            //     action: 'invalidate',
                            //     routeKey: 'auth',
                            //     phase: 'response',
                            //     type: 'error',
                            //     id
                            // }));
                            // return;
                        }

                        if (phase === 'register') {
                            if (!headers?.Authorization) {
                                socket.send(success({ message: 'Not authorized' }, {
                                    action: 'invalidate',
                                    routeKey: 'auth',
                                    phase: 'response',
                                    type: 'error',
                                    id
                                }));
                            } else {
                                let token;
                                try {
                                    token = jwt.verify(headers.Authorization.split(' ')[1], secret);
                                    const identity = token[strategy]
                                    if (!identity) throw new Error;

                                    const registered = await strat.register(identity, store);
                                    identities['compound'] = registered;

                                    const jwtToken = jwt.sign({
                                        exp: Math.floor(Date.now() / 1000) + (60 * 60),
                                        iat: Date.now() / 1000,
                                        address: strat.getAddress(registered),
                                        id: strat.getIdentity(registered),
                                        ...identities,
                                        factors: authFactors.filter(f => !solvedFactors[f])
                                    }, secret);

                                    socket.send(success(jwtToken, {
                                        action: 'auth',
                                        phase: 'response',
                                        routeKey: 'auth',
                                        type: 'response',
                                        identities,
                                        id
                                    }));

                                } catch (e) {
                                    socket.send(success({ message: 'Invalid token' }, {
                                        action: 'invalidate',
                                        routeKey: 'auth',
                                        phase: 'response',
                                        type: 'error',
                                        id
                                    }));
                                }
                            }
                        }

                        if (phase === 'challenge') {
                            if (headers?.Authorization && !strat) {
                                let token;
                                try {
                                    token = jwt.verify(headers.Authorization.split(' ')[1], secret);
                                    for (const key in token) {
                                        if (strategies[key])
                                            identities[key] = token[key];
                                    }
                                    socket.send(success(token, {
                                        action: 'auth',
                                        phase: 'response',
                                        routeKey: 'auth',
                                        type: 'response',
                                        address: token.address,
                                        id
                                    }));
                                } catch (e) {
                                    socket.send(success(token, {
                                        action: 'invalidate',
                                        phase: 'response',
                                        routeKey: 'auth',
                                        type: 'response',
                                        id
                                    }));
                                }
                            } else {
                                let challenge = 'Following strategies available'
                                if (strat)
                                    challenge = await strat.challenge(json, store);


                                socket.send(success(challenge, {
                                    action: 'auth',
                                    phase: 'challenge',
                                    routeKey: 'auth',
                                    type: 'response',
                                    factors: authFactors,
                                    id
                                }));
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
                                const address = await strat.recover(json, store)
                                identities[strategy] = address;

                                const token = jwt.sign({
                                    exp: Math.floor(Date.now() / 1000) + (60 * 60),
                                    iat: Date.now() / 1000,
                                    address: strat.getAddress(address),
                                    id: strat.getIdentity(address),
                                    ...identities,
                                    factors: authFactors.filter(f => !solvedFactors[f])
                                }, secret);

                                solvedFactors[strategy] = true;
                                if (!Object.values(solvedFactors).reduce((a, b) => a && b)) {
                                    crypto.randomBytes(8, function (err, buffer) {
                                        const rand = buffer.toString('hex');
                                        socket.send(success(token, {
                                            action: 'auth',
                                            phase: 'response',
                                            routeKey: 'auth',
                                            type: 'response',
                                            id
                                        }));
                                        socket.send(success(`Please sign this message to prove your identity: ${rand}`, {
                                            action: 'auth',
                                            phase: 'challenge',
                                            routeKey: 'auth',
                                            type: 'response',
                                            factors: authFactors.filter(f => !solvedFactors[f]),
                                        }));
                                    });
                                } else {
                                    socket.send(success(token, {
                                        action: 'auth',
                                        phase: 'response',
                                        routeKey: 'auth',
                                        type: 'response',
                                        identities,
                                        id
                                    }));
                                }
                            }
                        }
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

                    logger.info`Invoking function ${name}`;

                    try {
                        if (action.props.boundHandler.use && typeof action.props.boundHandler.use === 'function') {
                            const useRes = await action.props.boundHandler.use({
                                socket,
                                connectionInfo,
                                data: json
                            }, ...args);
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
                    const { action, key, scope, requestId, props, options, defaultValue } = json;
                    const handler = ConnectionHandler(broker, store, 'USE_STATE');
                    const state = await handler(connectionInfo, { key, scope, requestId, props, options, requestType, defaultValue })
                    console.log("Used state ", key, state.key, state.id)
                }

                if (action === ACTION_SET_STATE) {
                    const { action, key, scope, requestId, props, options, value, id } = json;
                    const handler = ConnectionHandler(broker, store, 'USE_STATE');
                    const state: State = await handler(connectionInfo, { key: key ? key : id, scope, requestId, props, options, requestType })
                    console.log("Setting state value", state.id);
                    state.setValue(value);
                    socket.send(success({ value }, {
                        action,
                        routeKey: action,
                        id
                    }));
                }
            }

            /**
             * This is the entrypoint. Every socket message get's handled here. 
             * This is where rendering happens, actions get run.
             */
            socket.on('message', onMessage);

            /**
             * Exit 
             */
            socket.on('close', onClose)
        } catch (e) {
            socket.send(failure(ErrorMessage(e), SocketErrorAction()));
        }
    })
}

module.exports = {
    WebSocketRenderer,
    activeConnections
}