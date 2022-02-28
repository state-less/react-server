import heartbeats from "heartbeats";
import logger from "../lib/logger";

export const heart = heartbeats.createHeart(1000);

export const cleanup = () => {
  logger.debug`Cleaning up heart.`;
  heart.kill();
};
