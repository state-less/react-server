import { createContext } from '../lib/Dispatcher';
import { useEffect, useState } from '../lib/reactServer';

const context = createContext();

const VERSION = '0.0.1';
const UPTIME = Date.now();

export const Server = (props) => {
  const value = {
    VERSION,
    UPTIME,
    PLATFORM: process.platform,
  };
  return {
    version: VERSION,
    children: (
      <context.Provider value={value}>{props.children}</context.Provider>
    ),
  };
};
