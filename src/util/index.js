import baseLogger from "../lib/logger";
import { DESC_MISSING_KEY } from "../consts";

const logger = baseLogger.scope("util");

export const assertIsValid = (isValid, message) => {
  if (!isValid) throw new Error(message);
};

export const validateComponentArgs = (props, key, options, socket) => {
  if (!key) {
    logger.warning`Error validating component args. ${DESC_MISSING_KEY}`;
    return ERR_MISSING_KEY;
  }
  return true;
};

export const authenticate = ({ data }) => {
  if (
    !data?.headers?.Authorization ||
    !data?.headers?.Authorization?.includes("Bearer")
  ) {
    throw new Error("Not authorized");
  }

  const token = data.headers.Authorization.split(" ").pop();

  return jwt.verify(token, SECRET);
};
