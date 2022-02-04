import crypto from 'crypto';

import {recover as web3Recover} from '../lib/web3-util'
export const getIdentity = (token) => token;
export const getAddress = (token) => ({name: token, email: null, picture: null});

export const recover = (json) => {
    const {response} = json;
    return web3Recover(response)
}
export const challenge = () => {
    return new Promise ((resolve, ) => {
        crypto.randomBytes(8, function (err, buffer) {
            const token = buffer.toString('hex');
            resolve ({
                type: 'sign',
                challenge: `Please sign this message to prove your identity: ${token}`
            });
        });
    })
}