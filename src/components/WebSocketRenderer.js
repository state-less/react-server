const logger = require("../lib/logger")
const {failure, success} = require('../lib/response-lib/websocket');


const WebSocket = require('ws');
const { WebsocketBroker } = require("../server/brokers/WebSocket");
const { render } = require("../runtime");
const { ConnectionHandler } = require("../server/handler/Websocket");
const broker = new WebsocketBroker();

const reduce = {
    Lookup: (key) => (lkp, cur) => {
      lkp[cur[key]] = cur;
      return lkp;
    }
  };
  
  const flatReduce = (arr, ...args) => arr.flat().reduce(...args);
  const flatLkp = (arr, key) => flatReduce(arr, reduce.Lookup(key), {});

const WebSocketRenderer = async (props) => {
    logger.warning`Websocket renderer ${props}`
    const {children: Server, store} = props; 
    const components = flatLkp([Server.props.children], 'key');
    logger.debug`Components ${components}`
    const server = WebSocketServer(props)
    handleRender(server, components, store);
    return {server, handler: (...args) => handleRender(server, ...args)}
}
WebSocketRenderer.server = true;

const WebSocketServer = (props) => {
    const {port = 8080, } = props;
    const extend = {port};

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

const handleRender = (wss, components, store) => {
    wss.on('connection', (socket, req) => {
        const clientId = req.headers['sec-websocket-key']
        const connectionInfo = {
            endoint: 'localhost',
            id: clientId
        }
        store.on('setValue', () => {
            process.exit(0);
        });
        logger.error`Received connection ${clientId}`
        socket.on('message', async (data) => {
            const json = JSON.parse(data);
            const {action, key, componentKey, scope, props={}, options} = json;
            logger.warning`Rendering component ${action} ${key} ${components}`
            if (action === 'render') {
                const comp = components[key];

                
                try {
                    
                    const res = await render(comp);
                    socket.send(success(res, {action: 'render', routeKey:'render'}));
                } catch (e) {
                    console.log("Error", e);
                }
                // logger.log`Render result ${res}`;
                // logger.log`Message ${action}`;
                // process.exit(0);
            }
            if (action === 'call') {
                    const {handler, componentKey, args, name} = json;
                    const comp = components[componentKey];

                    const res = await render(comp, connectionInfo);
                    const action = res.props.children.find((action) => action.props.name === name);

                    if (!action) {
                        throw new Error('Action ${name} not available');
                    } else if (!action.props.boundHandler[handler]) {
                        throw new Error('No handler ${handler} defined for action ${action}');
                    }
                    console.log("Invoking handler ", action.props.boundHandler[handler]);
                    await action.props.boundHandler[handler]({socket: connectionInfo},...args);
                
                    logger.debug`Executed action ${name}`;
            }

            if (action === 'useState') {
                    const {action, key, scope, requestId, props, options} = json;
                    const comp = components[key];

                    console.log ("USE STATE", json, comp);
                    const handler = ConnectionHandler(broker, store, 'USE_STATE');
                    const state = await handler(socket, {key, scope, requestId, props, options})
                    const {id, createdAt} = state;
                    await emit(socket, success({id, createdAt}, {action:'setValue', routeKey: 'useState', requestId}));

                    console.log ("USE STATE STATE", state);
                    // process.exit(0);

            }
            // const state = connHandler({id:key, endpoint: 'http://localhost:8080'}, {key, scope, options});
        })
    })
}
module.exports = {
    WebSocketRenderer
}