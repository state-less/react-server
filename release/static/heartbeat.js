"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.cleanup = exports.heart = void 0;

var _heartbeats = _interopRequireDefault(require("heartbeats"));

var _logger = _interopRequireDefault(require("../lib/logger"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * A simple module to very efficiently manage time-based objects and events.
 * Use this library for comparing large numbers of relativistic time lapses efficiently and for synchronizing the execution of events based on these time lapses.
 * @see https://www.npmjs.com/package/heartbeats
 */
const heart = _heartbeats.default.createHeart(1000);
/**
 * Cleanup function that should be called upon exit of the application.
 */


exports.heart = heart;

const cleanup = () => {
  _logger.default.debug`Cleaning up heart.`;
  heart.kill();
};

exports.cleanup = cleanup;