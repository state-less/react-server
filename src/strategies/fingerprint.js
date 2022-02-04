export const getIdentity = (token) => token.visitorId;
export const getAddress = (token) => ({name: token.visitorId, email: null, picture: null});

export const recover = (json) => {
    const {challenge, response} = json;
    const {visitorId, confidence} = response;
    return {visitorId, confidence}
}
export const challenge = () => {
    return {
        type: 'login',
        challenge: `Welcome!`
    }
}