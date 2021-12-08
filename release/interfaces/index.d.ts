export declare enum CacheBehaviour {
    CACHE_FIRST = "CACHE_FIRST",
    NETWORK_FIRST = "NETWORK_FIRST"
}
declare type RecursiveMap = Map<string, RecursiveMap>;
export interface Lifecycle {
    rendered: Map<string, object>;
    scope: RecursiveMap;
    isServer(socket: any): boolean;
    instances: any;
    defaultCacheBehaviour: CacheBehaviour;
    useState(defaultValue: any, key: string, options: object): any;
    useEffect(callback: Function): any;
    useClientEffect(callback: Function): any;
    useFunction(callback: Function): any;
    useClientState(defaultValue: any, key: string, options: object): any;
    setTimeout(callback: Function): any;
    destroy(): void;
}
export {};
