export const getIdentity = (token) => token?.fingerprint?.visitorId;
export const getAddress = (token) => ({ id: token?.fingerprint?.visitorId, strat: 'fingerprint', name: token?.fingerprint?.visitorId });

export const link = (json) => {
    throw new Error('Fingerprint can not be linked');
}

export const register = (json) => {
    throw new Error('Fingerprint can not be used to register');
}

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