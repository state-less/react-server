"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.activeConnections = void 0;

var _logger = _interopRequireDefault(require("../lib/logger"));

var _ws = _interopRequireDefault(require("ws"));

var _socket = require("../util/socket");

var strategies = _interopRequireWildcard(require("../strategies"));

var _socket2 = require("../actions/socket");

var _socket3 = require("../factories/socket");

var _defaults = require("../lib/defaults");

var _consts = require("../consts");

function _getRequireWildcardCache() { if (typeof WeakMap !== "function") return null; var cache = new WeakMap(); _getRequireWildcardCache = function () { return cache; }; return cache; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const {
  failure,
  success
} = require("../lib/response-lib/websocket");

const {
  WebsocketBroker
} = require("../server/brokers/WebSocket");

const {
  render
} = require("../runtime");

const {
  ConnectionHandler
} = require("../server/handler/WebSocket");

const {
  ACTION_RENDER,
  ACTION_STREAM,
  ACTION_AUTH,
  ACTION_CALL,
  ACTION_USE_STATE,
  ACTION_SET_STATE
} = require("../consts");

const {
  Component
} = require("../server/component");

const crypto = require("crypto");

const jwt = require("jsonwebtoken");

const {
  recover
} = require("../lib/web3-util");

const {
  Streams
} = require("../Stream");

const {
  Stream
} = require("../components");

/**
 * Contains active connections to the server
 */
const activeConnections = {};
exports.activeConnections = activeConnections;
const broker = new WebsocketBroker({
  activeConnections
});

const WebSocketRenderer = props => {
  const {
    children,
    key,
    store,
    secret,
    authFactors,
    onConnect
  } = props;
  const servedComponents = (Array.isArray(children) ? children : [children].filter(Boolean)).reduce((acc, child) => {
    const {
      key
    } = child;
    acc[key] = child;
    return acc;
  }, {});
  const server = createWebsocketServer(props);
  Component.useEffect(() => {
    handleRender({
      server,
      secret,
      streams: null,
      store,
      authFactors,
      servedComponents
    });
  }, []);
  return {
    type: WebSocketRenderer,
    key,
    props,
    children,
    server // handler: (...args) =>
    //   handleRender({
    //     server,
    //     secret,
    //     streams: null,
    //     store,
    //     authFactors,
    //     ...args,
    //   }),

  };
};

const createWebsocketServer = props => {
  const {
    port = 8080,
    children
  } = props;
  const extend = {
    port
  };
  const ws = new _ws.default.Server({ ..._defaults.wssDefaults,
    ...extend
  });
  return ws;
};

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
const messageQueue = [];
let currentPromise;

const handleRender = ({
  server,
  secret,
  streams,
  store,
  authFactors,
  servedComponents,
  onConnect,
  ...rest
}) => {
  server.on("listening", () => {
    (0, _socket.setupWsHeartbeat)(server);
  });
  server.on("close", () => {
    _logger.default.warning`Socket Server closed. Exiting...`;
    process.exit(0);
  });
  server.on("connection", (socket, req) => {
    const handler = ConnectionHandler(broker, store, "DISCONNECT");
    let challenge,
        solvedFactors = {},
        identities = {};

    try {
      (0, _socket.validateSecWebSocketKey)(req);
      const connectionInfo = {
        endpoint: "localhost",
        ...(0, _socket.extractConnectionInfo)(req)
      };
      activeConnections[connectionInfo.id] = socket;

      if (typeof onConnect === "function") {
        onConnect(connectionInfo);
      }

      const onClose = () => {
        handler(connectionInfo);
      };
      /**
       * Handles socket messages meant for react-server.
       * @param {string} data - The stringified message data
       * @returns
       */


      const onMessage = async data => {
        /**
         * @type {SocketData}
         */
        let json;

        if (data === "pong") {
          return;
        }

        try {
          json = JSON.parse(data);
        } catch (e) {
          _logger.default.error`Invalid data passed to JSON.parse: '${data}'`;
          return;
        }

        const {
          action,
          key,
          props = {},
          headers,
          requestType
        } = json;

        if (action === ACTION_RENDER) {
          const comp = Component.instances.get(key);

          try {
            const res = await render(comp, props, { ...connectionInfo,
              headers
            });
            socket.send(success(res, (0, _socket2.RenderAction)({
              key
            })));
          } catch (e) {
            socket.send(failure((0, _socket3.ErrorMessage)(e), (0, _socket2.RenderErrorAction)()));
          }
        }

        if (action === ACTION_STREAM) {
          const {
            name,
            id
          } = json;
          const stream = Stream.instances.get(name);
          stream.stream.addSocket(socket, {
            id
          });
          stream.stream.write({
            foo: "bar"
          }, {
            id
          });
          console.log("STREAM", stream);
        }

        if (action === _consts.ACTION_LOGOUT) {
          identities = {};
        }

        if (action === ACTION_AUTH) {
          const {
            id,
            phase,
            strategy,
            data
          } = json;
          const strat = strategies[strategy];

          try {
            if (phase === "logout") identities = {};

            if (phase === "register") {
              if (!(headers !== null && headers !== void 0 && headers.Authorization)) {
                socket.send(success({
                  message: "Not authorized"
                }, {
                  action: "invalidate",
                  routeKey: "auth",
                  phase: "response",
                  type: "error",
                  id
                }));
              } else {
                let token;

                try {
                  token = jwt.verify(headers.Authorization.split(" ")[1], secret);
                  const identity = token[strategy];
                  if (!identity) throw new Error();
                  const registered = await strat.register(token, store);
                  identities["compound"] = registered.compound;
                  const jwtToken = jwt.sign({
                    exp: Math.floor(Date.now() / 1000) + 60 * 60,
                    iat: Date.now() / 1000,
                    address: strat.getAddress(registered),
                    id: strat.getIdentity(registered),
                    ...identities
                  }, secret);
                  socket.send(success(jwtToken, {
                    action: "auth",
                    phase: "response",
                    routeKey: "auth",
                    type: "response",
                    identities,
                    id
                  }));
                } catch (e) {
                  socket.send(success({
                    message: "Invalid token"
                  }, {
                    action: "invalidate",
                    routeKey: "auth",
                    phase: "response",
                    type: "error",
                    id
                  }));
                }
              }
            }

            if (phase === "challenge") {
              if (headers !== null && headers !== void 0 && headers.Authorization && !strat) {
                let token;

                try {
                  token = jwt.verify(headers.Authorization.split(" ")[1], secret);

                  for (const key in token) {
                    if (strategies[key]) identities[key] = token[key];
                  }

                  socket.send(success(token, {
                    action: "auth",
                    phase: "response",
                    routeKey: "auth",
                    type: "response",
                    address: token.address,
                    id
                  }));
                } catch (e) {
                  socket.send(success(token, {
                    action: "invalidate",
                    phase: "response",
                    routeKey: "auth",
                    type: "response",
                    id
                  }));
                }
              } else {
                let challenge = "Following strategies available";
                if (strat) challenge = await strat.challenge(json, store);
                socket.send(success(challenge, {
                  action: "auth",
                  phase: "challenge",
                  routeKey: "auth",
                  type: "response",
                  id
                }));
              }
            }

            if (phase === "response") {
              const {
                challenge,
                response,
                strategy
              } = json;

              if (!strategy || !strategies[strategy]) {
                socket.send(failure({
                  message: 'Invalid strategy: "' + strategy + '"'
                }, {
                  action: "invalidate",
                  routeKey: "auth",
                  phase: "response",
                  type: "error",
                  id
                }));
              } else {
                const strat = strategies[strategy];
                const recoveredToken = await strat.recover(json, store);

                if (recoveredToken.compound) {
                  const mfaState = await store.scope("public.mfa").scope(recoveredToken.compound.id).useState("2fa");

                  if (typeof mfaState.value === "object") {
                    for (const key in mfaState.value) {
                      if (mfaState.value[key]) solvedFactors[key] = false;
                    }
                  }
                }
                /** Assign all recovered identities. A strategy can recover multiple identities. Registered + Oauth */


                Object.assign(identities, recoveredToken);
                /** Mark already authenticated identities as solved.*/

                for (const key in identities) {
                  solvedFactors[key] = true;
                }

                const token = jwt.sign({
                  exp: Math.floor(Date.now() / 1000) + 60 * 60,
                  iat: Date.now() / 1000,
                  address: strat.getAddress(recoveredToken),
                  id: strat.getIdentity(recoveredToken),
                  ...identities,

                  /**This field marks the jwt as invalid, as multiple factor steps are still missing. */
                  factors: Object.keys(solvedFactors).filter(f => !solvedFactors[f])
                }, secret);

                if (!Object.values(solvedFactors).reduce((a, b) => a && b)) {
                  crypto.randomBytes(8, function (err, buffer) {
                    const rand = buffer.toString("hex");
                    socket.send(success(token, {
                      action: "auth",
                      phase: "response",
                      routeKey: "auth",
                      type: "response",
                      id
                    }));
                    socket.send(success(`Please sign this message to prove your identity: ${rand}`, {
                      action: "auth",
                      phase: "challenge",
                      routeKey: "auth",
                      type: "response"
                    }));
                  });
                } else {
                  socket.send(success(token, {
                    action: "auth",
                    phase: "response",
                    routeKey: "auth",
                    type: "response",
                    identities,
                    id
                  }));
                }
              }
            }
          } catch (e) {
            const {
              message,
              stack
            } = e;
            socket.send(failure({
              message,
              stack
            }, {
              action: "call",
              routeKey: "call",
              type: "error",
              id
            }));
          }
        }

        if (action === ACTION_CALL) {
          const {
            handler,
            componentKey,
            args,
            name,
            id
          } = json;
          const comp = Component.instances.get(componentKey);
          let res;

          try {
            res = await render(comp, props, { ...connectionInfo,
              headers
            });
          } catch (e) {
            const {
              message,
              stack
            } = e;
            socket.send(failure({
              message,
              stack
            }, {
              action: "call",
              routeKey: "call",
              phase: "render",
              type: "error",
              id
            }));
          }

          const action = res.props.children.find(action => {
            var _action$props;

            return (action === null || action === void 0 ? void 0 : (_action$props = action.props) === null || _action$props === void 0 ? void 0 : _action$props.name) === name;
          });

          if (!action) {
            throw new Error("Action ${name} not available");
          } else if (!action.props.boundHandler[handler]) {
            throw new Error("No handler ${handler} defined for action ${action}");
          }

          _logger.default.info`Invoking function ${name}`;

          try {
            if (action.props.boundHandler.use && typeof action.props.boundHandler.use === "function") {
              const useRes = await action.props.boundHandler.use({
                socket,
                connectionInfo,
                data: json
              }, ...args);
            }

            const res = await action.props.boundHandler[handler]({
              socket,
              connectionInfo
            }, ...args);
            socket.send(success(res, {
              action: "call",
              routeKey: "call",
              id
            }));
          } catch (e) {
            const {
              message,
              stack
            } = e;
            socket.send(failure({
              message,
              stack
            }, {
              action: "call",
              routeKey: "call",
              type: "error",
              id
            }));
          }
        }

        if (action === ACTION_USE_STATE) {
          const {
            action,
            key,
            scope,
            requestId,
            props,
            options,
            defaultValue
          } = json;
          const handler = ConnectionHandler(broker, store, "USE_STATE");
          const state = await handler(connectionInfo, {
            key,
            scope,
            requestId,
            props,
            options,
            requestType,
            defaultValue
          });
          console.log("Used state ", key, state.key, state.id);
        }

        if (action === ACTION_SET_STATE) {
          const {
            action,
            key,
            scope,
            requestId,
            props,
            options,
            value,
            id
          } = json;
          const handler = ConnectionHandler(broker, store, "USE_STATE");
          const state = await handler(connectionInfo, {
            key: key ? key : id,
            scope,
            requestId,
            props,
            options,
            requestType
          });
          console.log("Setting state value", state.id);
          state.setValue(value);
          socket.send(success({
            value
          }, {
            action,
            routeKey: action,
            id
          }));
        }
      };

      const queueMessage = async data => {
        messageQueue.push(data);
        _logger.default.info`Queuing message. [${messageQueue.length}]`;
        await flushQueue();
      };

      const flushQueue = async () => {
        if (currentPromise) {
          _logger.default.warning`Already flushiung queue`;
          return;
        }

        _logger.default.info`Flushing queue.`;

        do {
          const data = messageQueue.shift();
          currentPromise = onMessage(data);
          await currentPromise;
          _logger.default.info`Processed Message`;
        } while (messageQueue.length);

        _logger.default.info`Flushed queue going idle. ${messageQueue.length}`;
        currentPromise = null;
      };
      /**
       * This is the entrypoint. Every socket message get's handled here.
       * This is where rendering happens, actions get run.
       */


      socket.on("message", queueMessage);
      /**
       * Exit
       */

      socket.on("close", onClose);
    } catch (e) {
      socket.send(failure((0, _socket3.ErrorMessage)(e), (0, _socket2.SocketErrorAction)()));
    }
  });
};

module.exports = {
  WebSocketRenderer,
  activeConnections
};