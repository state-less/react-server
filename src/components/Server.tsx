import { createContext } from '../lib/Dispatcher';
import pckg from '../../package.json';

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
