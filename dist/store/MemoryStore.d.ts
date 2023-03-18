type PrimitiveValue = string | number;
export type GenericStateValue = PrimitiveValue | Array<PrimitiveValue> | {
    [key: string]: GenericStateValue;
};
export type StateValue<T = unknown> = T & GenericStateValue;
export type StateOptions = {
    scope: string;
    key: string;
};
export declare class State<T> {
    id: string;
    key: string;
    scope: string;
    value: StateValue<T>;
    _store: Store;
    constructor(initialValue: StateValue<T>, options: StateOptions);
}
export type StoreOptions = {
    scope: string;
};
export declare class Store {
    _states: Map<string, State<any>>;
    _stores: Map<string, Store>;
    _options: StoreOptions;
    constructor(options: StoreOptions);
    createState<T>(value: StateValue<T>, options?: StateOptions): State<T>;
    hasState(key: string): boolean;
    getState<T>(initialValue: StateValue<T>, options: StateOptions): State<any>;
}
export {};
