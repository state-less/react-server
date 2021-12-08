const baseLogger = require('./lib/logger');
const { DESC_MISSING_KEY } = require("./consts");

const logger = baseLogger.scope('util');

const assertIsValid = (isValid, message) => {
  if (!isValid)
    throw new Error(message);
}

const validateComponentArgs = (props, key, options, socket) => {
  if (!key) {
    logger.warning`Error validating component args. ${DESC_MISSING_KEY}`;
    return ERR_MISSING_KEY;
  }
  return true;
}

module.exports = {
  assertIsValid,
  validateComponentArgs
}