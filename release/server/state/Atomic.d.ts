import { State } from './index';
interface AtomicOptions {
    key?: string;
    atomic?: string;
}
declare abstract class Atomic extends State {
    isAtomic: boolean;
    atomic: string;
    updateEquation: Function;
    value: any;
    constructor(defaultValue: any, options?: AtomicOptions);
    compileExpression(nextValue: any, sub: any): void;
    compile(tree: any): void;
}
export { Atomic };
