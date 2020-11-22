export const useState = (state) => {
    return [state.value, state.setValue];
}