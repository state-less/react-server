/// <reference types="node" />
import { EventEmitter } from 'events';
type PrimitiveValue = string | number;
export type GenericStateValue = PrimitiveValue | Array<PrimitiveValue>;
export type StateValue<T = unknown> = T;
export type StateOptions = {
    scope: string;
    key: string;
    labels?: string[];
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
}
export type StoreOptions = {};
export declare class Store {
    _scopes: Map<string, Map<string, State<unknown>>>;
    _states: Map<string, State<any>>;
    _options: StoreOptions;
    static getKey: (options: StateOptions) => string;
    constructor(options: StoreOptions);
    getScope: (scope: string) => Map<string, State<unknown>>;
    createState<T>(value: StateValue<T>, options?: StateOptions): State<T>;
    deleteState: (options: StateOptions) => void;
    hasState(key: string | StateOptions): boolean;
    getState<T>(initialValue: StateValue<T>, options: StateOptions): State<T>;
    purgeLabels: (labels: string[]) => void;
}
export {};
