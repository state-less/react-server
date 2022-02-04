import crypto from 'crypto';

export { recover } from '../lib/web3-util'
export const getIdentity = (token) => token;
export const getAddress = (token) => ({name: token, email: null, picture: null});

export const challenge = () => {
    return new Promise ((reject, resolve) => {
        crypto.randomBytes(8, function (err, buffer) {
            const token = buffer.toString('hex');
            resolve ({
                type: 'sign',
                challenge: `Please sign this message to prove your identity: ${token}`
            });
        });
    })
}