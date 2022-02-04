import crypto from 'crypto';

export { recover } from '../lib/web3-util'
export const getIdentity = (token) => token;
export const getAddress = (token) => ({name: token, email: null, picture: null});

export const challenge = () => {

    const token = crypto.randomBytes(4).toString('hex')
    return {
        type: 'sign',
        challenge: `Please sign this message to prove your identity: ${token}`
    }
}