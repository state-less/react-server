import WebSocket from "ws";
/**
 * Interface to retrieve the sec-websocket-key in case the implementation might change
 * @param {*} req - Websocket request
 * @returns {string} - The Sec-WebSocket-Key
 * @see - https://stackoverflow.com/questions/18265128/what-is-sec-websocket-key-for
 */
export declare const getSecWebSocketKey: (req: any) => any;
/**
 * Interface to make sure the sec-websocket-key
 * @param {*} req - Websocket request
 * @returns
 */
export declare const validateSecWebSocketKey: (req: any) => void;
/**
 * Will ping clients in a interval and terminate broken connections
 * @see https://gist.github.com/thiagof/aba7791ef9504c1184769ce401f478dc
 */
export declare function setupWsHeartbeat(wss: WebSocket.Server<WebSocket.WebSocket & {
    isAlive: boolean;
}>): void;
