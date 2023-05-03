/* eslint-disable @typescript-eslint/no-var-requires */
import { createContext } from '../lib/Dispatcher';
const pckg = require('../../package.json');

const context = createContext();

const VERSION = pckg.version;
const UPTIME = Date.now();

export const Server = (props) => {
  const value = {
    version: VERSION,
    uptime: UPTIME,
    platform: process.platform,
  };
  return {
    ...value,
    children: (
      <context.Provider value={value}>{props.children}</context.Provider>
    ),
  };
};
