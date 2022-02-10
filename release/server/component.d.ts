import { Lifecycle } from "../interfaces";
export declare const createContext: (defaultValue: any) => {
    value: any;
    onChange: (fn: any) => void;
    Provider: (props: any) => any;
};
declare const Component: Lifecycle;
export declare const useState: (...args: any[]) => any;
export declare const useContext: (...args: any[]) => any;
export { Component };
