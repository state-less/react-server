import heartbeats from "heartbeats";
import logger from "../lib/logger";

/**
 * A simple module to very efficiently manage time-based objects and events.
 * Use this library for comparing large numbers of relativistic time lapses efficiently and for synchronizing the execution of events based on these time lapses.
 * @see https://www.npmjs.com/package/heartbeats
 */
export const heart = heartbeats.createHeart(1000);

/**
 * Cleanup function that should be called upon exit of the application.
 */
export const cleanup = () => {
  logger.debug`Cleaning up heart.`;
  heart.kill();
};
