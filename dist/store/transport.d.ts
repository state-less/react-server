import { State } from './MemoryStore';
export declare class Transport {
    constructor();
    setState(state: State<any>): void;
    getState<T>(scope: string, key: string): Promise<State<T> | null>;
}
export declare class PostgresTransport extends Transport {
    connectionString: string;
    _db: any;
    constructor({ connectionString }: {
        connectionString: any;
    });
    setState(state: State<unknown>): Promise<any>;
    getState<T>(scope: string, key: string): Promise<State<T> | null>;
}
