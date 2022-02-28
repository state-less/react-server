"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.cleanup = exports.heart = void 0;

var _heartbeats = _interopRequireDefault(require("heartbeats"));

var _logger = _interopRequireDefault(require("../lib/logger"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const heart = _heartbeats.default.createHeart(1000);

exports.heart = heart;

const cleanup = () => {
  _logger.default.debug`Cleaning up heart.`;
  heart.kill();
};

exports.cleanup = cleanup;