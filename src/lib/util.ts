import {v4} from 'uuid';

export const createId = (debugHint) => {
    return v4();
}