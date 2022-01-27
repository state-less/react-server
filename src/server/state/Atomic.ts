import { atomic as genAtomic, compile } from '@state-less/atomic'
import logger from '../../lib/logger'
import { State } from './index'

interface AtomicOptions {
    key?: string;
    atomic?: string;
}

abstract class Atomic extends State {
    isAtomic: boolean;
    atomic: string;
    updateEquation: Function;
    value: any;

    constructor(defaultValue, options: AtomicOptions = {}) {
        const { key, atomic, ...rest } = options;
        super(defaultValue, { ...rest });

        if (atomic) {
            const updateEquation = genAtomic(atomic);
            this.updateEquation = updateEquation
        }

        this.isAtomic = !!atomic;
        this.atomic = atomic;

    }

    compileExpression(nextValue, sub) {
        const { value, updateEquation } = this;
        const tree = updateEquation(value, nextValue, sub);
        return this.compile(tree);
    }

    compile(tree) {
        throw new Error(`Attempt to call 'compile' on abstract class AtomicState. You need to implement compile when subclassing AtomicState`)
    }
}

export { Atomic }
