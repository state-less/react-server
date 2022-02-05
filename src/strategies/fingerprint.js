export const getIdentity = (token) => token?.fingerprint?.visitorId;
export const getAddress = (token) => ({ id: token?.fingerprint?.visitorId, strat: 'fingerprint', name: token?.fingerprint?.visitorId });

export const recover = (json) => {
    const { challenge, response } = json;
    const { visitorId, confidence } = response;
    return { fingerprint: { visitorId, confidence } }
}
export const challenge = () => {
    return {
        type: 'login',
        challenge: `Welcome!`
    }
}