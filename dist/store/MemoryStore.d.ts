/// <reference types="node" />
/// <reference types="node" />
import { EventEmitter } from 'events';
type PrimitiveValue = string | number;
export type GenericStateValue = PrimitiveValue | Array<PrimitiveValue>;
export type StateValue<T = unknown> = T;
export type StateOptions = {
    scope: string;
    key: string;
    labels?: string[];
    id?: string;
};
export declare class State<T> extends EventEmitter {
    id: string;
    key: string;
    scope: string;
    value: StateValue<T>;
    labels: string[];
    _store: Store;
    constructor(initialValue: StateValue<T>, options: StateOptions);
    setValue(value: StateValue<T>): void;
    toJSON: () => {
        scope: string;
        key: string;
        value: T;
    };
}
export type StoreOptions = {
    file?: string;
    logger?: any;
};
export declare class Store {
    _scopes: Map<string, Map<string, State<unknown>>>;
    _states: Map<string, State<any>>;
    _options: StoreOptions;
    static getKey: (options: StateOptions) => string;
    constructor(options: StoreOptions);
    restore: () => void;
    store: () => void;
    sync: (interval?: number) => NodeJS.Timer;
    deserialize: (json: any) => void;
    serialize: () => any;
    getScope: (scope: string) => Map<string, State<unknown>>;
    createState<T>(value: StateValue<T>, options?: StateOptions): State<T>;
    deleteState: (options: StateOptions) => void;
    hasState(key: string | StateOptions): boolean;
    getState<T>(initialValue: StateValue<T>, options: StateOptions): State<T>;
    purgeLabels: (labels: string[]) => void;
}
export {};
