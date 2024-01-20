type Props<T> = {
    key: string;
} & T;
type PropsWithChildren<T> = Props<{
    children?: unknown;
}> & T;
export declare const TestComponent: (_props: PropsWithChildren<unknown>) => any;
export {};
