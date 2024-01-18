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
    key: string;
    labels?: string[];
    id?: string;
};
export declare class State<T> extends EventEmitter {
    id: string;
    key: string;
    scope: string;
    value: StateValue<T>;
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
    createState<T>(value: StateValue<T>, options?: StateOptions): State<T>;
    deleteState: (options: StateOptions) => void;
    hasState(key: string | StateOptions): boolean;
    getState<T>(initialValue: StateValue<T>, options: StateOptions): State<T>;
    purgeLabels: (labels: string[]) => void;
}
export {};
