import { v4 } from "uuid";
import { Component } from "../server/component";

export const createContext = (defaultValue) => {
    const listeners = {};
    let value = defaultValue;
    const id = v4();
    
    const ref = {
        id,
        onRender: (key, fn) => {
            listeners[key] = fn;
        },
        Provider: (props) => {
            Component.useEffect(() => {
                Object.values(listeners).forEach(fn => fn())
            },[])
            return {
                id,
                component: 'Provider',
                value,
                props
            }
        }
    };
    return ref;
}       