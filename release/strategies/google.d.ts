import { Store } from '../server/state';
export declare const getIdentity: (token: any) => any;
export declare const getAddress: (token: any) => {
    id: any;
    strat: string;
    name: any;
    email: any;
    picture: any;
};
export declare const register: (token: any, store: Store) => Promise<{
    compound: {
        id: any;
        name: any;
        email: any;
        picture: any;
        identities: {
            google: any;
        };
    };
}>;
export declare const link: (token: any, store: any) => Promise<{
    compound: any;
}>;
export declare const challenge: () => {
    type: string;
    challenge: any;
};
export declare const recover: (json: any, store: any) => Promise<{
    google: any;
    compound?: undefined;
} | {
    compound: any;
    google: any;
}>;
