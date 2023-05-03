import { StateOptions, StateValue } from '../store/MemoryStore';
import Dispatcher, { Context } from './Dispatcher';

export type ReactServerGlobal = {
  components: Map<string, any>;
};

export const globalInstance: ReactServerGlobal = {
  components: new Map(),
};

export const useState = <T>(
  initialValue: StateValue<T>,
  options: StateOptions
) => {
  return Dispatcher.getCurrent().useState<T>(initialValue, options);
};

export const useEffect = (fn: () => void, deps: Array<any>) => {
  return Dispatcher.getCurrent().useEffect(fn, deps);
};

export const useClientEffect = (fn: () => void, deps: Array<any>) => {
  return Dispatcher.getCurrent().useClientEffect(fn, deps);
};

export const destroy = () => {
  return Dispatcher.getCurrent().destroy();
};

export const useContext = (context: Context<unknown>) => {
  return Dispatcher.getCurrent().useContext(context);
};
