import { store } from '..';
import { StateOptions, StateValue } from '../store/MemoryStore';
import Dispatcher from './Dispatcher';

export type ReactServerGlobal = {
  components: Map<string, any>;
};

export const globalInstance: ReactServerGlobal = {
  components: new Map(),
};

export const useState = (initialValue: StateValue, options: StateOptions) => {
  return Dispatcher.getCurrent().useState(initialValue, options);
};

export const useEffect = (fn: () => void, deps: Array<any>) => {
  return Dispatcher.getCurrent().useEffect(fn, deps);
};

export const useContext = (context: Context) => {
  return Dispatcher.getCurrent().useContext(context);
};
