"use strict";

const {
  atomic: genAtomic,
  compile
} = require('@state-less/atomic');

const logger = require('../../lib/logger');

const {
  State
} = require('./');

class Atomic extends State {
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
      const updateEquation = genAtomic(atomic);
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

module.exports = {
  Atomic
};