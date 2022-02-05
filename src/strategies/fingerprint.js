export const getIdentity = (token) => token.visitorId;
export const getAddress = (token) => ({id: token.visitorId, strat: 'fingerprint', name: token.visitorId, email: null, picture: null});

export const recover = (json) => {
    const {challenge, response} = json;
    const {visitorId, confidence} = response;
    return {fingerprint: {visitorId, confidence}}
}
export const challenge = () => {
    return {
        type: 'login',
        challenge: `Welcome!`
    }
}