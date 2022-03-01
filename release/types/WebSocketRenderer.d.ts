import WebSocket from "ws";
import { Store } from "../server/state";
import { ConnectionInfo } from "./socket";
export declare type HandleRenderOptions = {
    server: WebSocket.Server<WebSocket.WebSocket>;
    secret: string;
    streams: any[];
    store: Store;
    authFactors: string[];
    servedComponents: Record<string, any>;
    onConnect?(connectionInfo: ConnectionInfo): void;
};
