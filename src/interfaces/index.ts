import { Broker } from "../server/state";

export enum CacheBehaviour {
    CACHE_FIRST = "CACHE_FIRST",
    NETWORK_FIRST = "NETWORK_FIRST"
}

type RecursiveMap = Map<string, RecursiveMap>;

type Component = () => any;

export type SetValueFunction = (value: any) => void;

export type Context = {
    value: any;
}
export interface Lifecycle{
    (fn, baseStore): any
    rendered: Map<string, object>,
    scope: RecursiveMap,
    isServer(socket: any): boolean,
    instances: any,
    defaultCacheBehaviour: CacheBehaviour,
    /**
     * 
     * @param defaultValue - default value for the state
     * @param key - the key of the state.
     * @param options - options that are passed to useState
     * @returns - Array of value and setter function.
     */
    useState <T extends any>(defaultValue: T, key: string, options?: object): [T, (value: T) => void],
    useContext(context: Context): any;
    useEffect(callback: Function, changedVariables: any[]): void
    useClientEffect(callback: Function)
    useFunction(callback: Function)
    useClientState(defaultValue: any, key: string, options: object)
    setTimeout(callback: Function)
    destroy(): void
}

export interface UseStateOptions  {
    cache?: CacheBehaviour
    throwIfNotAvailable?: boolean;
    scope?: string;
}

export interface StateOptions {
    syncInitialState?: boolean;
    args?: any[];
    broker?: Broker;
    scope?: string;
}