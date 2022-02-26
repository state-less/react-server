export declare const wssDefaults: {
    perMessageDeflate: {
        zlibDeflateOptions: {
            chunkSize: number;
            memLevel: number;
            level: number;
        };
        zlibInflateOptions: {
            chunkSize: number;
        };
        clientNoContextTakeover: boolean;
        serverNoContextTakeover: boolean;
        serverMaxWindowBits: number;
        concurrencyLimit: number;
        threshold: number;
    };
};
