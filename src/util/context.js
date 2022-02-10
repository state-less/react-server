import { v4 } from "uuid";

export const createContext = (defaultValue) => {
    const listeners = [];
    let value = defaultValue;
    const id = v4();
    const ref = {
        id,
        Provider: (props) => {
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