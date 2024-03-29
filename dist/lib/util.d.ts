import { StateOptions } from '../store/MemoryStore';
import { ClientContext, ReactServerComponent, RequestContext } from './types';
import { PartialAuth } from '../types/auth';
export declare const serverKey = "server";
export declare const createId: (debugHint: any) => any;
export declare const clientKey: (key: any, requestContext: RequestContext) => string;
export declare const generateComponentPubSubKey: (component: ReactServerComponent<any>, requestContext: ClientContext) => string;
export declare const isStateOptions: (options: any) => options is StateOptions;
export declare const authenticate: (headers: Record<string, string>, secret?: string) => PartialAuth<unknown>;
