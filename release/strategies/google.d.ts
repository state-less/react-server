import { Store } from '../server/state';
export declare const getIdentity: (token: any) => any;
export declare const getAddress: (token: any) => {
    id: any;
    strat: string;
    name: any;
    email: any;
    picture: any;
};
export declare const register: (identity: any, store: Store) => Promise<{
    name: any;
    email: any;
    picture: any;
    identities: {
        google: any;
    };
}>;
export declare const challenge: () => {
    type: string;
    challenge: any;
};
export declare const recover: (json: any) => Promise<any>;
