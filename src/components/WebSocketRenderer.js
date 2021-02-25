const logger = require("../lib/logger")
const {failure, success} = require('../lib/response-lib/websocket');

const WebSocket = require('ws');

const WebSocketRenderer = async (props) => {
    logger.warning`Websocket renderer`
    const {children: Server} = props;
    const components = [Server.props.children].flat().reduce((lkp, fn) => {
        lkp[fn.key] = fn;
        return lkp;
    }, {});
    const server = WebSocketServer(props)
    handleRender(server, components)
    return {server, handler: (...args) => handleRender(server, ...args)}
}
WebSocketRenderer.server = true;

const WebSocketServer = (props) => {
    const {port = 8080} = props;
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

const handleRender = (wss, components) => {
    wss.on('connection', (socket, req) => {
        const key = req.headers['sec-websocket-key']
        logger.error`Received connection ${key}`
        socket.on('message', async (data) => {
            const json = JSON.parse(data);
            const {action, key, scope, props={}, options} = json;
            logger.warning`Rendering component ${action} ${key} ${components}`
            if (action === 'render') {

                const comp = components[key];
                
                try {
    
                    const res = await comp();
                    socket.send(success(res, {action: 'render', routeKey:'render'}));
                } catch (e) {
                    console.log("Error", e);
                }
                // logger.log`Render result ${res}`;
                // logger.log`Message ${action}`;
                // process.exit(0);
            }
            // const state = connHandler({id:key, endpoint: 'http://localhost:8080'}, {key, scope, options});
        })
    })
}
module.exports = {
    WebSocketRenderer
}