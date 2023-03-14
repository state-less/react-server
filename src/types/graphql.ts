export type State = {
  id;
  key;
  scope;
  value;
};

export type Resolver<T, U> = (arg1: T, arg2: U, context: any) => U;
