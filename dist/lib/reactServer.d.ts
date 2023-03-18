import { StateOptions, StateValue } from '../store/MemoryStore';
import { Context } from './Dispatcher';
export type ReactServerGlobal = {
    components: Map<string, any>;
};
export declare const globalInstance: ReactServerGlobal;
export declare const useState: <T>(initialValue: StateValue<T>, options: StateOptions) => [StateValue<T>, (value: StateValue<T>) => void];
export declare const useEffect: (fn: () => void, deps: Array<any>) => [import("../store/MemoryStore").GenericStateValue, (value: import("../store/MemoryStore").GenericStateValue) => void];
export declare const useContext: (context: Context<unknown>) => unknown;
