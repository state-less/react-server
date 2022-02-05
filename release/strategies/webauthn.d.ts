import { Store } from "../server/state";
export declare const registerChallenge: (name: any) => any;
export declare const loginChallenge: (key: any) => any;
export declare const getIdentity: (token: any) => any;
/** Send only public key to client. If you leak the private key somone might forge a valid authentication request */
export declare const getAddress: (token: any) => {
    strat: string;
    id: any;
    name: any;
    email: any;
    picture: any;
};
/**
 * Links the currently authenticated webauthn device to the registered account.
 * Both accounts need to be actively authenticated.
 * @param token - The JWT that's currently authenticated.
 * @param store - A store instance that can be used to store data.
 * @returns - The registered account
 */
export declare const link: (token: any, store: Store) => Promise<any>;
export declare const register: (token: any, store: Store) => Promise<any>;
export declare const recover: (json: any, store: any) => Promise<{
    webauthn: any;
    compound?: undefined;
} | {
    compound: any;
    webauthn: any;
}>;
export declare const challenge: (json: any, store: any) => {
    type: string;
    challenge: any;
};
