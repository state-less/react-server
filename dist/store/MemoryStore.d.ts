/// <reference types="node" />
import { Transport } from './transport';
import { EventEmitter } from 'events';
type PrimitiveValue = string | number;
export type GenericStateValue = PrimitiveValue | Array<PrimitiveValue>;
export type StateValue<T = unknown> = T;
export type StateOptions = {
    scope: string;
    key: string;
};
export declare class State<T> extends EventEmitter {
    id: string;
    key: string;
    scope: string;
    value: StateValue<T>;
    _store: Store;
    constructor(initialValue: StateValue<T>, options: StateOptions);
    publish(): void;
    setValue(value: StateValue<T>): Promise<this>;
    getValue(): Promise<T>;
}
export type StoreOptions = {
    transport?: Transport;
};
export declare class Store {
    _scopes: Map<string, Map<string, State<unknown>>>;
    _states: Map<string, State<any>>;
    _options: StoreOptions;
    static getKey: (options: StateOptions) => string;
    constructor(options: StoreOptions);
    getScope: (scope: string) => Map<string, State<unknown>>;
    createState<T>(value: StateValue<T>, options?: StateOptions): State<T>;
    hasState(key: string | StateOptions): boolean;
    getState<T>(initialValue: StateValue<T>, options: StateOptions): State<T>;
}
export {};
