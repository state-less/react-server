import { Store, Broker } from './';
import { AtomicState } from './Atomic';
import { CacheBehaviour } from '../../interfaces';
interface LambdaBrokerOptions {
    getScope?: Function;
}
interface UseStateOptions {
    scope?: string;
    cache?: CacheBehaviour;
    throwIfNotAvailable?: boolean;
}
interface DynamoDbStateOptions {
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
    sync(state: any, connection: any, requestId: any): Promise<any>;
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
    static sync: Function;
    constructor(def: any, options: any);
    compileExpression(nextValue: any): any;
    compile(...trees: any[]): any;
    setInternalValue(value: any): Promise<void>;
    setValue(value: any, initial: any): Promise<void>;
    publish(broker: any, connectionInfo: any, requestId: any): Promise<any>;
    sync(broker: any, connectionInfo: any, requestId: any): Promise<any>;
    unsync(broker: any, connectionInfo: any): Promise<any>;
    getValue(key: any): Promise<boolean>;
}
declare class DynamodbStore extends Store {
    deleteState: Function;
    createState: Function;
    validateUseStateArgs: Function;
    key: string;
    autoCreate: boolean;
    throwIfNotAvailable: boolean;
    throwNotAvailble: Function;
    constructor(options?: DynamoDbStoreOptions);
    has(stateKey: any, scope?: string): Promise<boolean>;
    get(key: any, def: any, options: any, ...args: any[]): Promise<any>;
    scanStates(stateKey: any, scope?: string): Promise<any>;
    scanScopes(scope?: string): Promise<any>;
    clone(...args: any[]): DynamodbStore;
    useState(key: any, def: any, options?: UseStateOptions, ...args: any[]): Promise<any>;
    _deleteState(key: any): Promise<void>;
}
export { DynamoDBState, DynamodbStore, LambdaBroker };
