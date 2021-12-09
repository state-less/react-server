import { StateOptions, UseStateOptions } from '../../interfaces';
import { State, Store, Broker } from './';
import { Atomic as AtomicState } from './Atomic';
interface LambdaBrokerOptions {
    getScope?: Function;
}
interface DynamoDbStateOptions extends StateOptions {
    atomic?: string;
}
interface DynamoDbStoreOptions {
    key?: string;
    parent?: DynamodbStore;
    autoCreate?: boolean;
    onRequestState?: Function;
    StateConstructor?: Function;
    TableName?: string;
    broker?: Broker;
}
declare class LambdaBroker extends Broker {
    constructor(options?: LambdaBrokerOptions);
    getScope(socket: any, options: any): any;
    sync(state: any, connection: any, ...args: any[]): Promise<any>;
    consume(state: any): Promise<void>;
}
declare class DynamoDBState extends AtomicState {
    value: any;
    key: string;
    scope: string;
    isAtomic: boolean;
    options: DynamoDbStateOptions;
    id: string;
    updateEquation: Function;
    emit: Function;
    constructor(def: any, options: any);
    compileExpression(nextValue: any): any;
    compile(...trees: any[]): any;
    setInternalValue(value: any): Promise<void>;
    setValue(value: any, ...args: any[]): Promise<void>;
    publish(...args: any[]): Promise<any>;
    sync(broker: any, ...args: any[]): Promise<any>;
    unsync(broker: any, connectionInfo: any): Promise<any>;
    getValue(key?: any): Promise<boolean>;
}
declare type StateCstr = typeof State;
declare class DynamodbStore extends Store {
    deleteState: (key: any) => void;
    createState: (key: any, def: any, options?: any, ...args: any[]) => State;
    validateUseStateArgs: (key: any, def: any, options?: UseStateOptions, ...args: any[]) => void;
    key: string;
    autoCreate: boolean;
    throwIfNotAvailable: boolean;
    throwNotAvailble: (key: any) => void;
    StateConstructor: StateCstr;
    constructor(options?: DynamoDbStoreOptions);
    has(stateKey: any, scope?: string): Promise<boolean>;
    get(key: any, ...args: any[]): Promise<State>;
    scanStates(stateKey: any, scope?: string): Promise<any>;
    scanScopes(scope?: string): Promise<any>;
    clone(...args: any[]): DynamodbStore;
    useState(key: any, def: any, options?: UseStateOptions, ...args: any[]): Promise<State>;
    _deleteState(key: any): Promise<void>;
}
export { DynamoDBState, DynamodbStore, LambdaBroker };
