import { PubSub } from 'graphql-subscriptions';
import { StateOptions, StateValue, Store } from '../store/MemoryStore';
import { ReactServerComponent, ReactServerNode } from './types';
import { ClientRequest, Maybe } from './types';
type ProviderComponent = {
    context: unknown;
    children: ReactServerNode<unknown>;
};
export type Context<C> = {
    context: {
        current: C;
    };
    Provider: (props: any) => ProviderComponent;
};
export declare const createContext: <T>() => Context<T>;
declare class RenderContext {
    request: ClientRequest;
    constructor(request: ClientRequest);
}
declare class Dispatcher {
    store: Store;
    _pubsub: PubSub;
    _currentComponent: ReactServerComponent<unknown>[];
    _clientContext: RenderContext;
    _parentLookup: Map<string, ReactServerNode<unknown>>;
    static _tree: ReactServerNode<unknown>;
    static _current: Dispatcher;
    static getCurrent: () => Dispatcher;
    constructor();
    static init: () => void;
    setPubSub: (pubsub: PubSub) => void;
    setClientContext: (context: Maybe<ClientRequest>) => void;
    setStore(store: Store): void;
    setRootComponent(component: ReactServerNode<unknown>): void;
    setParentNode(key: string, component: ReactServerNode<unknown>): void;
    getParentNode(key: string): ReactServerNode<unknown>;
    getStore(): Store;
    addCurrentComponent: (component: ReactServerComponent<unknown>) => void;
    popCurrentComponent: () => void;
    useState<T>(initialValue: StateValue<T>, options: StateOptions): [StateValue<T>, (value: StateValue<T>) => void];
    useEffect(fn: () => void, deps: Array<any>): [StateValue, (value: StateValue) => void];
    useContext: (context: Context<unknown>) => unknown;
}
export default Dispatcher;
