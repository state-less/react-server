"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.flatReduce = exports.Lookup = void 0;

const Lookup = key => (lkp, cur) => {
  lkp[cur[key]] = cur;
  return lkp;
};

exports.Lookup = Lookup;

const flatReduce = (arr, ...args) => arr.flat().reduce(...args);

exports.flatReduce = flatReduce;