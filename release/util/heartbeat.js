"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.createEvent = void 0;

const createEvent = (heart, n, fn, ...args) => {
  return heart.createEvent(n, fn);
};

exports.createEvent = createEvent;