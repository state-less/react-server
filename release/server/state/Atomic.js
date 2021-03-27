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
    logger.log`Instantiating atomic state with options ${JSON.stringify(options)}`;

    if (atomic) {
      logger.log`State is atomic`;
      const updateEquation = genAtomic(atomic);
      logger.log`Update equation is ${updateEquation(0, 1)}`;
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