import { Broker } from "../server/state";
export declare enum CacheBehaviour {
    CACHE_FIRST = "CACHE_FIRST",
    NETWORK_FIRST = "NETWORK_FIRST"
}
declare type RecursiveMap = Map<string, RecursiveMap>;
export declare type SetValueFunction = (value: any) => void;
export declare type Context = {
    value: any;
};
export interface Lifecycle {
    (fn: any, baseStore: any): any;
    rendered: Map<string, object>;
    scope: RecursiveMap;
    isServer(socket: any): boolean;
    instances: any;
    defaultCacheBehaviour: CacheBehaviour;
    /**
     *
     * @param defaultValue - default value for the state
     * @param key - the key of the state.
     * @param options - options that are passed to useState
     * @returns - Array of value and setter function.
     */
    useState<T extends any>(defaultValue: T, key: string, options?: object): [T, (value: T) => void];
    useContext(context: Context): any;
    useEffect(callback: Function, changedVariables: any[]): void;
    useClientEffect(callback: Function): any;
    useFunction(callback: Function): any;
    useClientState(defaultValue: any, key: string, options: object): any;
    setTimeout(callback: Function): any;
    destroy(): void;
}
export interface UseStateOptions {
    cache?: CacheBehaviour;
    throwIfNotAvailable?: boolean;
    scope?: string;
}
export interface StateOptions {
    syncInitialState?: boolean;
    args?: any[];
    broker?: Broker;
    scope?: string;
}
export {};
