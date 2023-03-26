import { State } from './MemoryStore';
export declare class Transport {
    constructor();
    setState(state: State<any>): void;
    getState<T>(scope: string, key: string): Promise<State<T>>;
}
export declare class PostgresTransport extends Transport {
    connectionString: string;
    db: any;
    constructor({ connectionString }: {
        connectionString: any;
    });
    setState(state: State<unknown>): Promise<any>;
    getState<T>(scope: string, key: string): Promise<State<T>>;
}
