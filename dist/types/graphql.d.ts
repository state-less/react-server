export type State = {
    id: any;
    key: any;
    scope: any;
    value: any;
};
export type Resolver<T, U> = (arg1: T, arg2: U, context: any) => U;
