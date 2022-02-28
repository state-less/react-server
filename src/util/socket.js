import { assertIsValid } from ".";

/**
 * Interface to retrieve the sec-websocket-key in case the implementation might change
 * @param {*} req - Websocket request
 * @returns {string} - The Sec-WebSocket-Key
 * @see - https://stackoverflow.com/questions/18265128/what-is-sec-websocket-key-for
 */
export const getSecWebSocketKey = (req) => req.headers["sec-websocket-key"];

/**
 * Interface to make sure the sec-websocket-key
 * @param {*} req - Websocket request
 * @returns
 */
export const validateSecWebSocketKey = (req) => {
  assertIsValid(getSecWebSocketKey(req), "Invalid websocket connection.");
};

/**
 * Will ping clients in a interval and terminate broken connections
 * @see https://gist.github.com/thiagof/aba7791ef9504c1184769ce401f478dc
 */
export function setupWsHeartbeat(wss) {
  function noop() {}
  function heartbeat() {
    this.isAlive = true;
  }

  wss.on("connection", function connection(ws) {
    ws.isAlive = true;
    ws.on("pong", heartbeat);
  });

  const interval = setInterval(function ping() {
    wss.clients.forEach(function each(ws) {
      // client did not respond the ping (pong)
      if (ws.isAlive === false) return ws.terminate();

      ws.isAlive = false;
      ws.ping(noop);
    });
  }, 30000);
}
