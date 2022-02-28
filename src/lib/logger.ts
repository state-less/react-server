const { Logger } = require("l0g");
// const {Color} = require('l0g/formatters/Color');
const { Inspect } = require("l0g/formatters/Inspect");
const { ConsoleTransport, Table } = require("l0g/transports/ConsoleTransport");
// const {FileTransport}= require('l0g/transports/FileTransport');
// const {SocketTransport}= require('l0g/transports/SocketTransport');
// const {ReloadConfigFeature} = require('l0g/features/ReloadConfigFeature.js');

// const util = require('util');
// const chalk = require('chalk');

const { LOG_LEVEL, LOG_LEVEL_HTTP } = require("./consts");

// const reloadConfigFeature = new ReloadConfigFeature();

const features = [
  //   reloadConfigFeature
];

// ConsoleTransport.surpressed = false;
// ConsoleTransport.surpress();

let State;
const setState = (v) => (State = v);

/**
 * I wish I had more time to write this project.
 * The logger needs to be rewritten or replaced.
 * I wanted a logger that's able to use colors, works in node.js and web-browsers
 * and provides a way to format messages on a per object basis.
 */

/**
 * In order to make logging easier, we can use formatters that target specific objects.
 * This way we can simply pass the whole object to the logger and change the output/formatting later.
 * If we need more detail in a debug scenario we can change the logging behaviour here.
 * That way we don't have to update single logging calls.
 * This is useful to format errors, objects, numbers strings.
 * You can also format a single object using its reference.
 * Each transport has its own formatter.
 */

/**
 * Anything that's an instanceof State will be formatted by the formatter using the function below.
 */
const SHOW_ID = false;
const isState = (obj) => obj instanceof State;
const formatState = (obj) =>
  `State[${obj.key}] ${SHOW_ID ? `(${obj.id}) ` : ""}[${
    Array.isArray(obj.value) ? obj.value.length : obj.value
  }]`;

//Format web push subscriptions keys.
const isSubscription = (obj) =>
  obj && obj.endpoint && obj.keys && obj.keys.auth;
const formatSubscription = (obj) => obj.keys.auth;

const isCandle = (obj) => obj && obj.symbol && obj.open && obj.close;
const formatCandle = (obj) => `Candle[${obj.symbol}] ${obj.close}`;

const isSocket = (obj) => obj && obj.client && obj.id;
const formatSocket = (obj) => `Socket[${obj.id}]`;
/**
 * I think the logger should have a built in way to format http requests, but I don't have enough time to think about a proper interface that's independent of frameworks like express.
 * That's why we extend the logger and provide the functionality here. It colors status codes and response times.
 */
const statusColors = { 200: "green", 300: "blue", 400: "orange", 500: "red" };
const timingColors = { 0: "green", 200: "yellow", 500: "orange", 1000: "red" };

const isResponseTime = (obj) => obj && obj.req && obj.res && obj.time;

/**
 * Format responseTime arguments when passed to the logger.
 * Formats an object in the form {req, res, time};
 * That way its easier to classify it as such
 */
const getRangeValue = (obj) => (value, def) => {
  const key = Object.keys(obj).reduce((acc, cur) => (value > cur ? cur : acc));
  return obj[key] || def;
};
const getStatusColor = getRangeValue(statusColors);
const getTimingColor = getRangeValue(timingColors);

// const formatResponseTime = (obj) => {
//   let { req, res, time } = obj;
//   const { method, url } = req;

//   let { statusCode } = res;
//   const statusColor = getStatusColor(statusCode, undefined);

//   if (statusColor) {
//     statusCode = chalk[statusColor](statusCode);
//   }

//   const timingColor = getTimingColor(time, undefined);
//   if (timingColor) {
//     time = chalk[timingColor](time.toFixed(2));
//   }

//   return `${statusCode} ${method} ${url} - ${time}ms`;
// };

/**
 * Inspect objects when log level is set to debug
 * The Color formatter colorizes objects by default.
 * Adds a call to util.inspect before the default format functions
 */
// if (LOG_LEVEL === 'debug') {
//     Color.formatMap.get(Color.isObject).unshift((v) => util.inspect(v, false, 1, true));
// }

//The Color formatter of the logger uses Maps to map functions to functions.
//The key (a function or regexp) determines whether an object should be formatted by the mapped function.
//In retrospect I don't like this  because you need to create a new Map if you want to extend the default behaviour.
//But I don't have enough time to rewrite all the modules i made for this demo.

/**
 * Extend the default formatMap, to keep default coloring behaviour for strings and numbers.
 */
// const formatMap = new Map([
//     [isResponseTime, formatResponseTime],
//     [isState, formatState],
//     [isSubscription, formatSubscription],
//     [isCandle, formatCandle],
//     [isSocket, formatSocket],
//     ...Color.formatMap
// ]);
// const formatter = new Color((options) => {
//     const {ts, level, scope, message} = options;
//     return `${ts} ${scope} ${level}: ${message}`
// }, {
//     //The format map used to format log messages on a per object basis
//     formatMap,
//     //The chalk color level. 1 = 256
//     chalkLevel: 3
// });

/**
 * The logger supports transports. We'll use two transports.
 * ConsoleTransport to log to stdout.
 * FileTransport to log to a file. - Unfortunately I didn't have the time to add log rotation/timestamps.
 */
const transports = [
  new ConsoleTransport({ formatter: new Inspect() }),
  // new FileTransport('main.log', {formatter: new Inspect}),
];

export const logger = new Logger("debug", { transports, features });
export default logger;
//Add a http level to the loglevel set. - This way we can control the log level of http logs individually.
logger.levels.http = LOG_LEVEL_HTTP;
// Color.colors.key.level.http = 'purple';

//We need to provide the logging function ourselves. There's no setter on the levels object. Maybe i should add a addLogLevel method.
logger.http = (...args) => logger.setLe("http").log(...args);

logger.setState = setState;

// logger.formatter = formatter;

Logger.scope = /.*/;
