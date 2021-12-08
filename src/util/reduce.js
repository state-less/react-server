export const Lookup = (key) => (lkp, cur) => {
    lkp[cur[key]] = cur;
    return lkp;
}

export const flatReduce = (arr, ...args) => arr.flat().reduce(...args);
