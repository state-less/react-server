export enum Scopes {
  Client = '$client',
  User = '$user',
  Component = '$component',
  Global = '$global',
}

export type Scope = Scopes | string;
