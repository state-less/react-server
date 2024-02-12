/// <reference types="node" />
/// <reference types="node" />
import { Transport } from './transport';
import { EventEmitter } from 'events';
type PrimitiveValue = string | number;
export type GenericStateValue = PrimitiveValue | Array<PrimitiveValue>;
export type StateValue<T = unknown> = T;
export type SetValueAction<T> = StateValue<T> | ((value: StateValue<T>) => StateValue<T>);
export type StateOptions = {
    scope: string;
    uuid?: string;
    user?: string;
    client?: string;
    key: string;
    labels?: string[];
    storeInitialState?: boolean;
};
export type QueryOptions = StateOptions & {
    poll?: number;
};
export declare class Query<T> extends EventEmitter {
    value: StateValue<T>;
    initialValue: StateValue<T>;
    fetched: boolean;
    _options: QueryOptions;
    _store: Store;
    constructor(initialValue: StateValue<T>, options: QueryOptions);
    getValue(): void;
    refetch(): void;
}
export declare class State<T> extends EventEmitter {
    id: string;
    uuid: string;
    key: string;
    /**
     * The unique id of the currently authenticated user.
     * */
    user: string;
    /**
     * The unique id of the connected client.
     */
    client: string;
    scope: string;
    value: StateValue<T>;
    initialValue: StateValue<T>;
    initialValuePublished: boolean;
    timestamp: number;
    labels: string[];
    _store: Store;
    constructor(initialValue: StateValue<T>, options: StateOptions);
    publish(): void;
    setValue(valueAction: SetValueAction<T>): Promise<this>;
    getValue(): T;
    toJSON: () => {
        scope: string;
        key: string;
        value: T;
    };
}
export type StoreOptions = {
    transport?: Transport;
    file?: string;
    logger?: any;
};
export declare class Store extends EventEmitter {
    _scopes: Map<string, Map<string, State<unknown>>>;
    _queries: Map<string, Query<any>>;
    _states: Map<string, State<any>>;
    _options: StoreOptions;
    _storing: boolean;
    static getKey: (options: StateOptions) => string;
    constructor(options: StoreOptions);
    restore: () => void;
    store: () => void;
    sync: (interval?: number) => NodeJS.Timer;
    dehydrate: (obj: any) => void;
    serialize: () => any;
    getScope: (scope: string) => Map<string, State<unknown>>;
    hasQuery(key: string | StateOptions): boolean;
    createQuery<T>(initialValue: StateValue<T>, options: QueryOptions): Query<any>;
    query<T>(initialValue: StateValue<T>, options: StateOptions): Query<any>;
    createState<T>(value: StateValue<T>, options?: StateOptions): State<T>;
    deleteState: (options: StateOptions) => void;
    hasState(key: string | StateOptions): boolean;
    getState<T>(initialValue: StateValue<T>, options: StateOptions): State<T>;
    purgeLabels: (labels: string[]) => void;
}
export {};
