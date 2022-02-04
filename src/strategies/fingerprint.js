export const getIdentity = (token) => token;
export const getAddress = (token) => ({name: token, email: null, picture: null});

export const recover = (json) => {
    const {challenge, response} = json;
    return response
}
export const challenge = () => {
    return {
        type: 'login',
        challenge: `Welcome!`
    }
}