/// <reference types="react" />
export declare const StoreProvider: (props: any) => JSX.Element;
declare const Server: (props: any) => {
    v: string;
    component: string;
    components: any;
    props: any;
};
declare type RouterProps = {
    target: string;
};
declare const Router: {
    (props: any): any;
    context: {
        props: RouterProps;
    } | null;
};
declare const Route: (props: any) => {
    component: string;
    props: any;
};
declare const ClientComponent: {
    (props: any): {
        component: string;
        props: any;
    };
    server: boolean;
};
declare const Action: {
    (props: any): {
        component: string;
        props: {
            name: any;
            disabled: any;
            boundHandler: any;
            handler: string[];
        };
    };
    server: boolean;
};
declare const Stream: {
    (props: any, key: any): {
        component: string;
        stream: any;
        props: {
            key: any;
        };
    };
    instances: Map<any, any>;
};
export { ClientComponent, Stream, Server, Router, Route, Action };
