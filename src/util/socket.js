import { assertIsValid } from "."

/**
 * Interface to retrieve the sec-websocket-key in case the implementation might change
 * @param {*} req - Websocket request
 * @returns {string} - The Sec-WebSocket-Key
 * @see - https://stackoverflow.com/questions/18265128/what-is-sec-websocket-key-for
 */
export const getSecWebSocketKey = req => req.headers['sec-websocket-key']

/**
 * Interface to make sure the sec-websocket-key
 * @param {*} req - Websocket request
 * @returns 
 */
export const validateSecWebSocketKey = req => {
    assertIsValid(getSecWebSocketKey(req), 'Invalid websocket connection.')
}