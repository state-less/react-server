import WebSocket from "ws";
import { assertIsValid } from ".";
import { logger } from "../lib/logger";
import { heart } from "../static/heartbeat";

const socketUtilLogger = logger.scope("util.socket");
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
export function setupWsHeartbeat(
  wss: WebSocket.Server<WebSocket.WebSocket & { isAlive?: boolean }>
) {
  function noop() {}

  socketUtilLogger.debug`Setting up heartbeats.`;

  wss.on("connection", function connection(ws) {
    function heartbeat() {
      this.isAlive = true;
    }
    ws.isAlive = true;
    ws.on("pong", heartbeat);
    ws.on("message", (msg: string) => {
      if (msg === "pong") heartbeat();
    });
  });

  heart.createEvent(30, function ping() {
    socketUtilLogger.debug`Sending heartbeat to ${wss.clients.entries.length} sockets.`;
    wss.clients.forEach(function each(ws) {
      // client did not respond the ping (pong)
      if (ws.isAlive === false) {
        socketUtilLogger.warning`Client timed out. Terminating connection.`;
        return ws.terminate();
      }

      ws.isAlive = false;

      ws.ping(noop);
      ws.send("ping");
    });
  });
}
