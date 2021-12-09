"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Atomic = void 0;

var _atomic = require("@state-less/atomic");

var _ = require("./");

class Atomic extends _.State {
  constructor(defaultValue, options = {}) {
    const {
      key,
      atomic,
      ...rest
    } = options;
    super(defaultValue, {
      key,
      ...rest
    });

    if (atomic) {
      const updateEquation = (0, _atomic.atomic)(atomic);
      this.updateEquation = updateEquation;
    }

    this.isAtomic = !!atomic;
    this.atomic = atomic;
  }

  compileExpression(nextValue, sub) {
    const {
      key,
      value,
      updateEquation
    } = this;
    const tree = updateEquation(value, nextValue, sub);
    return this.compile(tree);
  }

  compile(tree) {
    throw new Error(`Attempt to call 'compile' on abstract class AtomicState. You need to implement compile when subclassing AtomicState`);
  }

}

exports.Atomic = Atomic;