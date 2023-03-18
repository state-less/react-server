import { StateOptions, StateValue } from '../store/MemoryStore';
import { Context } from './Dispatcher';
export type ReactServerGlobal = {
    components: Map<string, any>;
};
export declare const globalInstance: ReactServerGlobal;
export declare const useState: <T>(initialValue: T, options: StateOptions) => [T, (value: T) => void];
export declare const useEffect: (fn: () => void, deps: Array<any>) => [unknown, (value: unknown) => void];
export declare const useContext: (context: Context<unknown>) => unknown;
