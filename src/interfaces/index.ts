export enum CacheBehaviour {
    CACHE_FIRST = "CACHE_FIRST",
    NETWORK_FIRST = "NETWORK_FIRST"
}

type RecursiveMap = Map<string, RecursiveMap>;

type Component = () => any;

export interface Lifecycle{
    (fn, baseStore): any
    rendered: Map<string, object>,
    scope: RecursiveMap,
    isServer(socket: any): boolean,
    instances: any,
    defaultCacheBehaviour: CacheBehaviour,
    useState(defaultValue: any, key: string, options: object)
    useEffect(callback: Function)
    useClientEffect(callback: Function)
    useFunction(callback: Function)
    useClientState(defaultValue: any, key: string, options: object)
    setTimeout(callback: Function)
    destroy(): void
}