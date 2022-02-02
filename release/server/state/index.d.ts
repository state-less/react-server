import { StateOptions, UseStateOptions } from "../../interfaces";
declare class Broker {
    options: BrokerOptions;
    constructor(options: BrokerOptions);
    sync(state: any, client: any): void;
}
interface BrokerOptions {
    getScope?: Function;
}
declare class SocketIOBroker extends Broker {
    constructor(io: any, options?: BrokerOptions);
    getScope(socket: any, options: any): any;
    emitError(socket: any, options: any, message: any): void;
    emit(socket: any, event: any, message: any): void;
    syncInitialState(state: any, socket: any, options: any): void;
    sync(state: any, socket: any, ...args: any[]): void;
}
interface StoreOptions {
    key?: string;
    parent?: Store;
    autoCreate?: boolean;
    onRequestState?: Function;
    StateConstructor?: typeof State;
    StoreConstructor?: typeof Store;
    broker?: Broker;
}
declare class Store {
    map: Map<string, State>;
    actions: Map<string, any>;
    scopes: Map<string, Store>;
    StateConstructor: typeof State;
    StoreConstructor?: typeof Store;
    key: string;
    autoCreate: boolean;
    broker?: Broker;
    options: StateOptions;
    parent?: Store;
    static STATE_PERMIT_DEFAULT: boolean;
    constructor(options?: StoreOptions);
    has(key: string): boolean | Promise<boolean>;
    get(key: string): State | Promise<State>;
    purge: () => void;
    clone(options: StoreOptions): Store;
    /**
     *
     * @param {String} key - The key of the subscope
     * @param  {...any} args - Additional args passed to the store constructor.
     * @returns {Store} - A new store instance
     */
    scope(key: any, options?: {}): any;
    path(...keys: any[]): void;
    createState(key: any, def: any, options?: UseStateOptions, ...args: any[]): State | Promise<State>;
    deleteState: (key: any) => void;
    /**
     * @description Callback to accept or deny requests to use a state.
     * @param {any} key - The key of the state.
     * @param {*} options - The options
     * @param  {...any} args - Additional arguments
     */
    onRequestState: (key: any, options: any, ...args: any[]) => boolean;
    requestState: (key: any, options: any, ...args: any[]) => boolean;
    validateUseStateArgs(key: any, def: any, options?: UseStateOptions, ...args: any[]): void;
    useState(key: any, def: any, options?: UseStateOptions, ...args: any[]): State | Promise<State>;
    throwNotAvailble(key: any): void;
    action(key: any, callback: any): void;
    exec: (key: any, args: any, ...extra: any[]) => any;
    emit: (...args: any[]) => void;
}
declare class State {
    args: any[];
    createdAt: number;
    key: string;
    value: any;
    emit: Function;
    error: Error;
    brokers: [Broker, any[]];
    id: string;
    scope: string;
    options: StateOptions;
    static sync: Function;
    static genId: Function;
    constructor(defaultValue: any, options?: StateOptions);
    setValue(value: any, initial?: boolean): any | Promise<any>;
    getValue(): any;
    setError: (error: any) => void;
    publish(): void;
    sync(broker: any, ...args: any[]): any;
    unsync(broker: any, filterFn: any): void;
}
export { State, SocketIOBroker, Store, Broker, };
