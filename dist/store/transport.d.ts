import { IDatabase } from 'pg-promise';
import { State, StateOptions } from './MemoryStore';
export declare class Transport {
    constructor();
    setState<T>(state: State<any>): Promise<State<T> | null>;
    setInitialState<T>(state: State<any>): Promise<State<T> | null>;
    getState<T>(state: State<any>): Promise<State<T> | null>;
    deleteState<T>(state: State<any>): Promise<State<T> | null>;
}
export declare class PostgresTransport extends Transport {
    connectionString: string;
    _db: IDatabase<any>;
    constructor({ connectionString }: {
        connectionString: any;
    });
    setState(state: State<unknown>): Promise<any>;
    deleteState<T>(state: State<any>): Promise<State<T>>;
    setInitialState(state: State<unknown>): Promise<any>;
    getState<T>(state: State<T>): Promise<State<T> | null>;
    queryByOptions<T>(stateOptions: StateOptions, retries?: number): Promise<any>;
}
