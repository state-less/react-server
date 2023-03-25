import { StateOptions } from '../store/MemoryStore';
import { ReactServerComponent } from './types';
export declare const createId: (debugHint: any) => any;
export declare const generateComponentPubSubKey: (component: ReactServerComponent<any>) => string;
export declare const isStateOptions: (options: any) => options is StateOptions;
export declare const authenticate: (headers: any, secret?: string) => any;
